# RCA/backend/src/modules/ddm/api/files/upload.py
import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db
from backend.src.config.settings import settings
from backend.src.modules.ddm.api.deps import get_current_admin, get_current_user
from backend.src.modules.ddm.services.file_service import create_file
from backend.src.modules.ddm.schemas.file import FileOut, UploadRequestOut
from backend.src.modules.ddm.models.file import File as FileModel
from typing import List, Optional

router = APIRouter()

# ----------------------- Admin direct upload -----------------------
@router.post("/admin/files", response_model=FileOut)
async def admin_upload(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(""),
    storage_type: str = Form(...),
    group_ids: str = Form(""),
    file: UploadFile = File(None),
    terabox_url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if storage_type == "local" and file:
        max_size = settings.ddm_admin_upload_limit_mb * 1024 * 1024
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            raise HTTPException(status_code=413, detail=f"File too large. Max {settings.ddm_admin_upload_limit_mb} MB")

    group_ids_list = [int(g) for g in group_ids.split(",") if g.strip().isdigit()] if group_ids else []
    file_record = await create_file(
        db, name=name, description=description, storage_type=storage_type,
        group_ids=group_ids_list, uploader_id=admin.id, uploader_type="admin",
        file=file, terabox_url=terabox_url, ip_address=request.client.host,
    )
    return FileOut(
        id=file_record.id,
        name=file_record.name,
        description=file_record.description,
        storage_type=file_record.storage_type.value,
        mime_type=file_record.mime_type,
        size=file_record.size,
        groups=[g.name for g in file_record.groups],
        uploader_type=file_record.uploader_type,
        uploader_id=file_record.uploader_id,
        status=file_record.status,
        created_at=str(file_record.created_at),
        updated_at=str(file_record.updated_at),
    )


# ----------------------- User upload request -----------------------
@router.post("/files/request", response_model=UploadRequestOut)
async def user_upload_request(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(""),
    group_ids: str = Form(""),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    max_size = settings.ddm_user_upload_limit_mb * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.ddm_user_upload_limit_mb} MB")

    group_ids_list = [int(g) for g in group_ids.split(",") if g.strip().isdigit()] if group_ids else []
    file_record = await create_file(
        db, name=name, description=description, storage_type="local",
        group_ids=group_ids_list, uploader_id=user.id, uploader_type="user",
        file=file, terabox_url=None, ip_address=request.client.host,
    )
    return UploadRequestOut(
        id=file_record.id,
        name=file_record.name,
        description=file_record.description,
        mime_type=file_record.mime_type,
        size=file_record.size,
        status=file_record.status,
        uploader_id=file_record.uploader_id,
        created_at=str(file_record.created_at),
        updated_at=str(file_record.updated_at),
    )


# ----------------------- User's upload requests list -----------------------
@router.get("/files/requests")
async def list_user_upload_requests(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(FileModel)
        .where(FileModel.uploader_id == user.id, FileModel.uploader_type == "user")
        .order_by(FileModel.created_at.desc())
    )
    files = result.scalars().all()
    return [
        UploadRequestOut(
            id=f.id,
            name=f.name,
            description=f.description,
            mime_type=f.mime_type,
            size=f.size,
            status=f.status,
            uploader_id=f.uploader_id,
            created_at=str(f.created_at),
            updated_at=str(f.updated_at),
        )
        for f in files
    ]

# end of RCA/backend/src/modules/ddm/api/files/upload.py