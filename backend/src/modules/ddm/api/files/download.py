# RCA/backend/src/modules/ddm/api/files/download.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.services.file_service import stream_local_file, proxy_terabox
from backend.src.modules.ddm.services.audit_service import log_audit
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/files/{file_id}/download")
async def download_file(
    file_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    file_record = await db.get(File, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    user_group_ids = [g.id for g in user.groups]
    file_group_ids = [g.id for g in file_record.groups]
    if file_group_ids and not any(g in file_group_ids for g in user_group_ids):
        raise HTTPException(status_code=403, detail="Access denied")

    # Log the download
    await log_audit(
        db,
        action="file_download",
        admin_username=f"user:{user.id}",  # distinguish user from admin
        target_type="file",
        target_id=str(file_id),
        details={"file_name": file_record.name, "user_id": user.id},
        ip_address=request.client.host,
    )

    if file_record.storage_type.value == "local":
        path, mime_type, file_name = await stream_local_file(file_record)
        def iterfile():
            with open(path, "rb") as f:
                while chunk := f.read(64 * 1024):
                    yield chunk
        headers = {"Content-Disposition": f'attachment; filename="{file_name}"'}
        return StreamingResponse(iterfile(), media_type=mime_type, headers=headers)
    elif file_record.storage_type.value == "terabox":
        content, mime_type = await proxy_terabox(file_record)
        headers = {"Content-Disposition": f'attachment; filename="{file_record.name}"'}
        return StreamingResponse(iter([content]), media_type=mime_type, headers=headers)
    else:
        raise HTTPException(status_code=400, detail="Unknown storage type")
# end of RCA/backend/src/modules/ddm/api/files/download.py