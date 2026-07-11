# RCA/backend/src/modules/ddm/api/admin/announcements.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.announcement import Announcement
from backend.src.modules.ddm.models.group import Group
from backend.src.modules.ddm.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementOut
from backend.src.modules.ddm.services.audit_service import log_audit
from backend.src.modules.ddm.api.deps import get_current_admin

router = APIRouter(prefix="/announcements", tags=["admin-announcements"])

@router.get("/", response_model=list[AnnouncementOut])
async def list_announcements(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Announcement).options(selectinload(Announcement.groups))
    )
    announcements = result.scalars().all()
    out = []
    for a in announcements:
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

@router.post("/", response_model=AnnouncementOut, status_code=201)
async def create_announcement(
    payload: AnnouncementCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    announcement = Announcement(
        title=payload.title,
        body=payload.body,
        expiry=payload.expiry,
        is_public=payload.is_public,
    )
    # Resolve groups
    if payload.group_ids:
        result = await db.execute(select(Group).where(Group.id.in_(payload.group_ids)))
        groups = result.scalars().all()
        if len(groups) != len(payload.group_ids):
            raise HTTPException(status_code=400, detail="Some group IDs are invalid")
        announcement.groups = groups

    db.add(announcement)
    await db.commit()
    # Refetch with eager loading to return groups
    await db.refresh(announcement, attribute_names=["groups"])
    # Re-query with selectinload to get groups names
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement.id).options(selectinload(Announcement.groups))
    )
    announcement = result.scalar_one()

    await log_audit(
        db,
        action="announcement_created",
        admin_username=admin.username,
        target_type="announcement",
        target_id=str(announcement.id),
        details={"title": announcement.title},
        ip_address=request.client.host,
    )

    return AnnouncementOut(
        id=announcement.id,
        title=announcement.title,
        body=announcement.body,
        expiry=announcement.expiry,
        groups=[g.name for g in announcement.groups],
        is_public=announcement.is_public,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )

@router.put("/{announcement_id}", response_model=AnnouncementOut)
async def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id).options(selectinload(Announcement.groups))
    )
    announcement = result.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if payload.title is not None:
        announcement.title = payload.title
    if payload.body is not None:
        announcement.body = payload.body
    if payload.expiry is not None:
        announcement.expiry = payload.expiry
    if payload.is_public is not None:
        announcement.is_public = payload.is_public
    if payload.group_ids is not None:
        groups = []
        if payload.group_ids:
            result = await db.execute(select(Group).where(Group.id.in_(payload.group_ids)))
            groups = result.scalars().all()
            if len(groups) != len(payload.group_ids):
                raise HTTPException(status_code=400, detail="Invalid group IDs")
        announcement.groups = groups

    await db.commit()
    # Refetch with eager loading
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id).options(selectinload(Announcement.groups))
    )
    announcement = result.scalar_one()

    await log_audit(
        db,
        action="announcement_updated",
        admin_username=admin.username,
        target_type="announcement",
        target_id=str(announcement_id),
        details={"title": announcement.title},
        ip_address=request.client.host,
    )

    return AnnouncementOut(
        id=announcement.id,
        title=announcement.title,
        body=announcement.body,
        expiry=announcement.expiry,
        groups=[g.name for g in announcement.groups],
        is_public=announcement.is_public,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )

@router.delete("/{announcement_id}", status_code=204)
async def delete_announcement(
    announcement_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    announcement = await db.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    await db.delete(announcement)
    await db.commit()

    await log_audit(
        db,
        action="announcement_deleted",
        admin_username=admin.username,
        target_type="announcement",
        target_id=str(announcement_id),
        details={"title": announcement.title},
        ip_address=request.client.host,
    )
    return

@router.delete("/bulk", status_code=204)
async def bulk_delete_announcements(
    ids: list[int],
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    for aid in ids:
        announcement = await db.get(Announcement, aid)
        if not announcement:
            continue
        await db.delete(announcement)
        await log_audit(
            db,
            action="announcement_deleted",
            admin_username=admin.username,
            target_type="announcement",
            target_id=str(aid),
            details={"title": announcement.title, "bulk": True},
            ip_address=request.client.host,
        )
    await db.commit()
    return
# end of RCA/backend/src/modules/ddm/api/admin/announcements.py