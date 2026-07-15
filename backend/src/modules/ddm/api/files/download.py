# RCA/backend/src/modules/ddm/api/files/download.py
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.services.file_service import stream_local_file, proxy_terabox
from backend.src.modules.ddm.services.audit_service import log_audit
import os
import mimetypes
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_filename_with_extension(file_record: File) -> str:
    """
    Return a safe filename that always includes an extension.
    For local files, uses the extension from the stored local_path.
    For terabox files, guesses an extension from the MIME type if name has none.
    """
    name = file_record.name
    if '.' in os.path.basename(name):
        return name

    if file_record.storage_type.value == "local" and file_record.local_path:
        ext = os.path.splitext(file_record.local_path)[1]
        if ext:
            return f"{name}{ext}"

    mime = file_record.mime_type
    if mime:
        guessed_ext = mimetypes.guess_extension(mime)
        if guessed_ext:
            return f"{name}{guessed_ext}"

    return f"{name}.bin"


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    inline: bool = Query(False, description="If true, serve the file inline (for thumbnails/previews)"),
):
    result = await db.execute(
        select(File).options(selectinload(File.groups)).where(File.id == file_id)
    )
    file_record = result.scalars().first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    user_group_ids = [g.id for g in user.groups]
    file_group_ids = [g.id for g in file_record.groups]
    if file_group_ids and not any(g in file_group_ids for g in user_group_ids):
        raise HTTPException(status_code=403, detail="Access denied")

    await log_audit(
        db,
        action="file_download",
        admin_username=f"user:{user.id}",
        target_type="file",
        target_id=str(file_id),
        details={"file_name": file_record.name, "user_id": user.id, "inline": inline},
        ip_address=request.client.host,
    )

    filename = get_filename_with_extension(file_record)
    disposition_type = "inline" if inline else "attachment"
    content_disposition = f'{disposition_type}; filename="{filename}"'

    if file_record.storage_type.value == "local":
        path, mime_type, _ = await stream_local_file(file_record)
        def iterfile():
            with open(path, "rb") as f:
                while chunk := f.read(64 * 1024):
                    yield chunk
        headers = {"Content-Disposition": content_disposition}
        return StreamingResponse(iterfile(), media_type=mime_type, headers=headers)
    elif file_record.storage_type.value == "terabox":
        content, mime_type = await proxy_terabox(file_record)
        headers = {"Content-Disposition": content_disposition}
        return StreamingResponse(iter([content]), media_type=mime_type, headers=headers)
    else:
        raise HTTPException(status_code=400, detail="Unknown storage type")
# end of RCA/backend/src/modules/ddm/api/files/download.py