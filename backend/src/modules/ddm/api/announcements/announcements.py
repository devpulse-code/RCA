# RCA/backend/src/modules/ddm/api/announcements/announcements.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.announcement import Announcement
from backend.src.modules.ddm.schemas.announcement import AnnouncementOut
from backend.src.modules.ddm.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=list[AnnouncementOut])
async def list_user_announcements(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now = datetime.utcnow()
    user_group_ids = [g.id for g in current_user.groups]

    # Fetch all non-expired announcements
    result = await db.execute(
        select(Announcement)
        .options(selectinload(Announcement.groups))
        .where(
            or_(
                Announcement.expiry == None,
                Announcement.expiry > now
            )
        )
    )
    announcements = result.scalars().all()

    # Filter: either public, or targeted to at least one of the user's groups
    visible = []
    for a in announcements:
        if a.is_public:
            visible.append(a)
        else:
            # Check group intersection
            if any(g.id in user_group_ids for g in a.groups):
                visible.append(a)

    out = []
    for a in visible:
        out.append(AnnouncementOut(
            id=a.id,
            title=a.title,
            body=a.body,
            expiry=a.expiry,
            groups=[g.name for g in a.groups],
            is_public=a.is_public,
            created_at=a.created_at,
            updated_at=a.updated_at,
        ))
    return out
# end of RCA/backend/src/modules/ddm/api/announcements/announcements.py