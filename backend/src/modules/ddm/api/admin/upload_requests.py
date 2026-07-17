# RCA/backend/src/modules/ddm/api/admin/upload_requests.py
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.schemas.file import UploadRequestOut
from backend.src.modules.ddm.services.file_service import (
    approve_upload_request, reject_upload_request, stream_local_file
)
from backend.src.modules.ddm.services.audit_service import log_audit

router = APIRouter(tags=["admin-upload-requests"])

TEMP_UPLOAD_DIR = "/app/uploads/temp"


@router.get("/upload-requests", response_model=List[UploadRequestOut])
async def list_pending_requests(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(File).where(File.status == "pending"))
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
        ) for f in files
    ]


@router.get("/upload-requests/{file_id}/preview")
async def preview_pending_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Admin can preview/download a pending upload."""
    file_record = await db.get(File, file_id)
    if not file_record or file_record.status != "pending":
        raise HTTPException(status_code=404, detail="File not found or not pending")
    if file_record.storage_type != "local":
        raise HTTPException(status_code=400, detail="Preview only available for local files")
    file_path = os.path.join(TEMP_UPLOAD_DIR, file_record.local_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Temp file missing")
    return FileResponse(
        file_path,
        media_type=file_record.mime_type or "application/octet-stream",
        filename=file_record.name,
    )


@router.post("/upload-requests/{file_id}/approve")
async def approve_request(
    file_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    file_record = await approve_upload_request(db, file_id)
    await log_audit(
        db,
        action="approve_upload",
        admin_username=admin.username,
        target_type="file",
        target_id=str(file_id),
        ip_address=request.client.host,
    )
    return {"message": "Upload approved"}


@router.post("/upload-requests/{file_id}/reject", status_code=204)
async def reject_request(
    file_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    await reject_upload_request(db, file_id)
    await log_audit(
        db,
        action="reject_upload",
        admin_username=admin.username,
        target_type="file",
        target_id=str(file_id),
        ip_address=request.client.host,
    )
    return
# end of RCA/backend/src/modules/ddm/api/admin/upload_requests.py