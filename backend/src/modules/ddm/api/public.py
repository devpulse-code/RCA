# RCA/backend/src/modules/ddm/api/public.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.announcement import Announcement
from backend.src.modules.ddm.models.file import File
from backend.src.modules.ddm.schemas.announcement import AnnouncementOut

router = APIRouter(tags=["public"])

@router.get("/stats")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    # Total documents
    result = await db.execute(select(File))
    total_docs = len(result.scalars().all())

    # Active sessions (fallback to 0 if Redis unreachable)
    from backend.src.core.db.redis import get_redis
    redis = get_redis()
    active_sessions = 0
    try:
        keys = redis.keys("user_session:*")
        active_sessions = len(keys)
    except Exception:
        pass

    # Last updated file
    result = await db.execute(
        select(File).order_by(File.updated_at.desc()).limit(1)
    )
    last_file = result.scalars().first()
    last_update = last_file.updated_at.isoformat() if last_file and last_file.updated_at else None

    return {
        "documents_indexed": total_docs,
        "active_sessions": active_sessions,
        "last_update": last_update
    }

@router.get("/announcements", response_model=list[AnnouncementOut])
async def get_public_announcements(db: AsyncSession = Depends(get_db)):
    """Return all public, non-expired announcements – no authentication required."""
    now = datetime.utcnow()
    result = await db.execute(
        select(Announcement)
        .options(selectinload(Announcement.groups))
        .where(
            Announcement.is_public == True,
            or_(
                Announcement.expiry == None,
                Announcement.expiry > now
            )
        )
    )
    announcements = result.scalars().all()
    out = []
    for a in announcements:
        out.append(AnnouncementOut(
            id=a.id,
            title=a.title,
            body=a.body,
            expiry=a.expiry,
            groups=[],  # public announcements don't need to expose groups
            is_public=True,
            created_at=a.created_at,
            updated_at=a.updated_at,
        ))
    return out