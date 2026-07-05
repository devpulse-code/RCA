# RCA/backend/src/modules/ddm/api/admin/files.py

import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File as FastAPIFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.models.group import Group
from backend.src.modules.ddm.schemas.file import FileOut
from backend.src.modules.ddm.services.file_service import (
    delete_file,
    create_file,
    update_file_record,
    replace_file_content,
)
from backend.src.modules.ddm.services.audit_service import log_audit
from backend.src.config.settings import settings

router = APIRouter(tags=["admin-files"])


@router.get("/", response_model=List[FileOut])
async def list_files(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    # Eagerly load the groups relationship to avoid DetachedInstanceError
    result = await db.execute(
        select(File).options(selectinload(File.groups))
    )
    files = result.scalars().unique().all()
    out = []
    for f in files:
        # groups is now a loaded list of Group objects; extract names
        group_names = [g.name for g in f.groups]
        out.append(FileOut(
            id=f.id,
            name=f.name,
            description=f.description,
            storage_type=f.storage_type.value,
            mime_type=f.mime_type,
            size=f.size,
            groups=group_names,
            uploader_type=f.uploader_type,
            uploader_id=f.uploader_id,
            status=f.status,
            created_at=str(f.created_at),
            updated_at=str(f.updated_at),
        ))
    return out


@router.post("/", response_model=FileOut, status_code=201)
async def upload_file(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    storage_type: str = Form(...),
    groups: str = Form("[]"),
    file: Optional[UploadFile] = FastAPIFile(None),
    terabox_url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    # Parse groups
    try:
        group_ids_raw = json.loads(groups)
        group_ids = [int(x) for x in group_ids_raw]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid groups format – must be a JSON list of integers")
    if not isinstance(group_ids, list):
        raise HTTPException(status_code=400, detail="groups must be a JSON list")

    # Upload size limit for local files
    if storage_type == "local" and file:
        limit_mb = int(settings.ddm_admin_upload_limit_mb) if hasattr(settings, "ddm_admin_upload_limit_mb") else 500
        if file.size and file.size > limit_mb * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum {limit_mb} MB.")

    new_file = await create_file(
        db,
        name=name,
        description=description,
        storage_type=storage_type,
        group_ids=group_ids,
        uploader_id=admin.id,
        uploader_type="admin",
        file=file,
        terabox_url=terabox_url,
        ip_address=request.client.host,
    )

    # Fetch group names explicitly (the new_file object may have groups loaded, but we do it safely)
    group_names = []
    if group_ids:
        group_result = await db.execute(
            select(Group).where(Group.id.in_(group_ids))
        )
        group_objs = group_result.scalars().all()
        group_names = [g.name for g in group_objs]

    await log_audit(
        db,
        action="upload_file",
        admin_username=admin.username,
        target_type="file",
        target_id=str(new_file.id),
        ip_address=request.client.host,
    )

    return FileOut(
        id=new_file.id,
        name=new_file.name,
        description=new_file.description,
        storage_type=new_file.storage_type.value,
        mime_type=new_file.mime_type,
        size=new_file.size,
        groups=group_names,
        uploader_type=new_file.uploader_type,
        uploader_id=new_file.uploader_id,
        status=new_file.status,
        created_at=str(new_file.created_at),
        updated_at=str(new_file.updated_at),
    )


@router.delete("/{file_id}", status_code=204)
async def delete_file_endpoint(
    file_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await delete_file(db, file_id)
    await log_audit(
        db,
        action="delete_file",
        admin_username=admin.username,
        target_type="file",
        target_id=str(file_id),
        ip_address=request.client.host,
    )
    return


@router.delete("/bulk", status_code=204)
async def bulk_delete_files(
    file_ids: List[int],
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    for fid in file_ids:
        await delete_file(db, fid)
    await log_audit(
        db,
        action="bulk_delete_files",
        admin_username=admin.username,
        target_type="file",
        target_id=",".join(map(str, file_ids)),
        ip_address=request.client.host,
    )
    return


@router.put("/{file_id}/groups")
async def change_file_groups(
    file_id: int,
    group_ids: List[int],
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(Group).where(Group.id.in_(group_ids)))
    groups = result.scalars().all()
    if len(groups) != len(group_ids):
        raise HTTPException(status_code=400, detail="Some groups not found")
    file_record = await db.get(File, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    file_record.groups = groups
    await db.commit()
    await log_audit(
        db,
        action="change_file_groups",
        admin_username=admin.username,
        target_type="file",
        target_id=str(file_id),
        details={"new_group_ids": group_ids},
        ip_address=request.client.host,
    )
    return {"message": "Groups updated"}


@router.put("/{file_id}/content")
async def replace_file(
    file_id: int,
    request: Request,
    storage_type: Optional[str] = Form(None),
    file: UploadFile = FastAPIFile(None),
    terabox_url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    file_record = await replace_file_content(
        db, file_id,
        storage_type=storage_type,
        file=file,
        terabox_url=terabox_url,
        ip_address=request.client.host,
    )
    # Fetch group names explicitly to avoid greenlet error
    group_result = await db.execute(
        select(Group).where(Group.id.in_([g.id for g in file_record.groups]))
    )
    group_objs = group_result.scalars().all()
    group_names = [g.name for g in group_objs]

    await log_audit(
        db,
        action="replace_file_content",
        admin_username=admin.username,
        target_type="file",
        target_id=str(file_id),
        ip_address=request.client.host,
    )
    return FileOut(
        id=file_record.id,
        name=file_record.name,
        description=file_record.description,
        storage_type=file_record.storage_type.value,
        mime_type=file_record.mime_type,
        size=file_record.size,
        groups=group_names,
        uploader_type=file_record.uploader_type,
        uploader_id=file_record.uploader_id,
        status=file_record.status,
        created_at=str(file_record.created_at),
        updated_at=str(file_record.updated_at),
    )
# end of RCA/backend/src/modules/ddm/api/admin/files.py