# backend/src/modules/ddm/api/files/list.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.schemas.file import FileOut

router = APIRouter()


@router.get("/files", response_model=list[FileOut])
async def list_user_files(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    user_group_ids = [g.id for g in user.groups]

    result = await db.execute(
        select(File)
        .where(File.status == "active")
        .options(selectinload(File.groups))
    )
    all_files = result.unique().scalars().all()

    out = []
    for f in all_files:
        file_group_ids = [g.id for g in f.groups]
        if file_group_ids and not any(g in file_group_ids for g in user_group_ids):
            continue
        out.append(FileOut(
            id=f.id,
            name=f.name,
            description=f.description,
            storage_type=f.storage_type.value,
            mime_type=f.mime_type,
            size=f.size,
            groups=[g.name for g in f.groups],
            uploader_type=f.uploader_type,
            uploader_id=f.uploader_id,
            status=f.status,
            created_at=str(f.created_at),
            updated_at=str(f.updated_at),
            has_thumbnail=bool(f.thumbnail_path),
            has_preview_clip=bool(f.preview_clip_path),
        ))
    return out
# end of backend/src/modules/ddm/api/files/list.py