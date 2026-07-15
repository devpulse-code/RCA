# RCA/backend/src/modules/ddm/api/notifications.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.api.deps import get_current_user
from backend.src.modules.ddm.models.notification import Notification

router = APIRouter()


@router.get("/notifications")
async def list_notifications(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "read": n.read,
            "created_at": str(n.created_at),
        }
        for n in notifications
    ]


@router.put("/notifications/read")
async def mark_notifications_read(
    request: Request,
    ids: list[int],
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if not ids:
        return {"ok": True}
    await db.execute(
        update(Notification)
        .where(Notification.id.in_(ids), Notification.user_id == user.id)
        .values(read=True)
    )
    await db.commit()
    return {"ok": True}
# end of RCA/backend/src/modules/ddm/api/notifications.py