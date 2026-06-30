# RCA/backend/src/modules/ddm/services/file_service.py
import os
import uuid
import shutil
import logging
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.src.modules.ddm.models.file import File, StorageType
from backend.src.modules.ddm.models.group import Group
from backend.src.core.utils.encryption import encrypt_data, decrypt_data
from backend.src.config.settings import settings
from backend.src.modules.ddm.services.audit_service import log_audit
from backend.src.modules.ddm.services.text_extraction import extract_text_task
from backend.src.modules.ddm.services.search_service import index_file, delete_file_index, update_file_metadata
import asyncio

logger = logging.getLogger(__name__)

UPLOAD_DIR = "/app/uploads"
TEMP_UPLOAD_DIR = "/app/uploads/temp"


async def create_file(
    db: AsyncSession,
    name: str,
    description: str,
    storage_type: str,
    group_ids: List[int],
    uploader_id: int,
    uploader_type: str,
    file: Optional[UploadFile] = None,
    terabox_url: Optional[str] = None,
    ip_address: str = None,
) -> File:
    if storage_type not in ["local", "terabox"]:
        raise HTTPException(status_code=400, detail="Invalid storage type")
    if storage_type == "local" and not file:
        raise HTTPException(status_code=400, detail="File required for local storage")
    if storage_type == "terabox" and not terabox_url:
        raise HTTPException(status_code=400, detail="Terabox URL required")

    # Resolve groups
    groups = []
    if group_ids:
        result = await db.execute(select(Group).where(Group.id.in_(group_ids)))
        groups = result.scalars().all()
        if len(groups) != len(group_ids):
            raise HTTPException(status_code=400, detail="Some groups not found")

    file_record = File(
        name=name,
        description=description,
        storage_type=storage_type,
        uploader_id=uploader_id,
        uploader_type=uploader_type,
        status="active" if uploader_type == "admin" else "pending",
        groups=groups,
    )

    if storage_type == "local" and file:
        target_dir = UPLOAD_DIR if uploader_type == "admin" else TEMP_UPLOAD_DIR
        os.makedirs(target_dir, exist_ok=True)
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_name = f"{uuid.uuid4()}{ext}"
        path = os.path.join(target_dir, unique_name)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_record.local_path = unique_name
        file_record.mime_type = file.content_type
        file_record.size = os.path.getsize(path)
    elif storage_type == "terabox":
        file_record.encrypted_terabox_url = encrypt_data(terabox_url)
        file_record.mime_type = "application/octet-stream"
        file_record.size = 0

    db.add(file_record)
    await db.commit()
    await db.refresh(file_record)

    # Index into Meilisearch (metadata only for now; content later)
    if file_record.status == "active":
        await index_file(
            file_id=file_record.id,
            name=name,
            description=description,
            group_ids=[g.id for g in groups],
            content="",  # will be updated by text extraction task
        )
        # Queue text extraction for local files (will update content field in Meilisearch)
        if storage_type == "local":
            asyncio.create_task(extract_text_task(file_record.id))

    return file_record


async def update_file_record(db: AsyncSession, file_id: int, **kwargs):
    """Update metadata fields and sync Meilisearch."""
    file_record = await db.get(File, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    for key, value in kwargs.items():
        if hasattr(file_record, key):
            setattr(file_record, key, value)
    await db.commit()
    # Sync Meilisearch metadata
    # Extract name, description, groups if changed
    name = kwargs.get("name", file_record.name)
    description = kwargs.get("description", file_record.description)
    group_ids = None
    if "groups" in kwargs:
        group_ids = [g.id for g in file_record.groups]
    await update_file_metadata(file_id, name=name, description=description, group_ids=group_ids)
    return file_record


async def replace_file_content(
    db: AsyncSession,
    file_id: int,
    storage_type: Optional[str] = None,
    file: Optional[UploadFile] = None,
    terabox_url: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    """Replace the content of an existing file and update Meilisearch."""
    file_record = await db.get(File, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    if file_record.status != "active":
        raise HTTPException(status_code=400, detail="Only active files can be replaced")

    old_storage = file_record.storage_type.value
    new_storage = storage_type or old_storage

    # Delete old physical file if local
    if old_storage == "local" and file_record.local_path:
        old_path = os.path.join(UPLOAD_DIR, file_record.local_path)
        if os.path.exists(old_path):
            os.remove(old_path)

    if new_storage == "local" and file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_name = f"{uuid.uuid4()}{ext}"
        path = os.path.join(UPLOAD_DIR, unique_name)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_record.local_path = unique_name
        file_record.mime_type = file.content_type
        file_record.size = os.path.getsize(path)
        file_record.encrypted_terabox_url = None
    elif new_storage == "terabox" and terabox_url:
        file_record.encrypted_terabox_url = encrypt_data(terabox_url)
        file_record.local_path = None
        file_record.mime_type = "application/octet-stream"
        file_record.size = 0
    else:
        raise HTTPException(status_code=400, detail="Missing file or Terabox URL for replacement")

    file_record.storage_type = new_storage
    file_record.updated_at = func.now()
    await db.commit()
    await db.refresh(file_record)

    # Re-index full document in Meilisearch (clear old content)
    groups_ids = [g.id for g in file_record.groups]
    await index_file(
        file_id=file_record.id,
        name=file_record.name,
        description=file_record.description,
        group_ids=groups_ids,
        content="",  # will be re-extracted
    )
    if new_storage == "local":
        asyncio.create_task(extract_text_task(file_record.id))

    return file_record


async def delete_file(db: AsyncSession, file_id: int):
    """Delete a file record and its physical file, and remove from Meilisearch."""
    file_record = await db.get(File, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    if file_record.storage_type == "local" and file_record.local_path:
        for base_dir in [UPLOAD_DIR, TEMP_UPLOAD_DIR]:
            candidate = os.path.join(base_dir, file_record.local_path)
            if os.path.exists(candidate):
                os.remove(candidate)
                break
    await db.delete(file_record)
    await db.commit()
    # Remove from Meilisearch
    await delete_file_index(file_id)


async def approve_upload_request(db: AsyncSession, file_id: int):
    """Move a pending user upload from temp to permanent, mark active, and index."""
    file_record = await db.get(File, file_id)
    if not file_record or file_record.status != "pending":
        raise HTTPException(status_code=404, detail="Pending upload not found")

    if file_record.storage_type == "local" and file_record.local_path:
        temp_path = os.path.join(TEMP_UPLOAD_DIR, file_record.local_path)
        if not os.path.exists(temp_path):
            raise HTTPException(status_code=500, detail="Temp file missing")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        new_name = f"{uuid.uuid4()}{os.path.splitext(file_record.local_path)[1]}"
        new_path = os.path.join(UPLOAD_DIR, new_name)
        shutil.move(temp_path, new_path)
        file_record.local_path = new_name
        file_record.status = "active"
        await db.commit()
        # Index into Meilisearch
        groups_ids = [g.id for g in file_record.groups]
        await index_file(
            file_id=file_record.id,
            name=file_record.name,
            description=file_record.description,
            group_ids=groups_ids,
            content="",
        )
        asyncio.create_task(extract_text_task(file_record.id))
        return file_record

    # For terabox user request (unlikely), just mark active and index
    file_record.status = "active"
    await db.commit()
    groups_ids = [g.id for g in file_record.groups]
    await index_file(
        file_id=file_record.id,
        name=file_record.name,
        description=file_record.description,
        group_ids=groups_ids,
        content="",
    )
    return file_record


async def reject_upload_request(db: AsyncSession, file_id: int):
    """Reject and delete a pending user upload (no Meilisearch entry existed)."""
    file_record = await db.get(File, file_id)
    if not file_record or file_record.status != "pending":
        raise HTTPException(status_code=404, detail="Pending upload not found")

    if file_record.storage_type == "local" and file_record.local_path:
        temp_path = os.path.join(TEMP_UPLOAD_DIR, file_record.local_path)
        if os.path.exists(temp_path):
            os.remove(temp_path)
    await db.delete(file_record)
    await db.commit()


async def stream_local_file(file_record: File):
    if not file_record.local_path:
        raise HTTPException(status_code=404, detail="File not found on disk")
    for base in [UPLOAD_DIR, TEMP_UPLOAD_DIR]:
        candidate = os.path.join(base, file_record.local_path)
        if os.path.exists(candidate):
            return candidate, file_record.mime_type, file_record.name
    raise HTTPException(status_code=404, detail="File not found on disk")


async def proxy_terabox(file_record: File):
    import httpx
    url = decrypt_data(file_record.encrypted_terabox_url)
    headers = {"User-Agent": "Mozilla/5.0"}
    async with httpx.AsyncClient(follow_redirects=True, max_redirects=3) as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 403:
                raise HTTPException(status_code=502, detail="Terabox access blocked")
            return response.content, response.headers.get("content-type", "application/octet-stream")
        except httpx.HTTPError as e:
            logger.error(f"Terabox proxy error: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch file from Terabox")
# end of RCA/backend/src/modules/ddm/services/file_service.py