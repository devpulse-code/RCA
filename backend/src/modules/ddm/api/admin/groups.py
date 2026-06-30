# RCA/backend/src/modules/ddm/api/admin/groups.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.group import Group
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.services.audit_service import log_audit

router = APIRouter(prefix="/groups", tags=["admin-groups"])


@router.get("/")
async def list_groups(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(Group))
    groups = result.scalars().all()
    return [{"id": g.id, "name": g.name} for g in groups]


@router.post("/", status_code=201)
async def create_group(
    name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    existing = await db.execute(select(Group).where(Group.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Group already exists")
    group = Group(name=name)
    db.add(group)
    await db.commit()

    await log_audit(
        db,
        action="group_created",
        admin_username=admin.username,
        target_type="group",
        target_id=str(group.id),
        details={"name": name},
        ip_address=request.client.host,
    )

    return {"id": group.id, "name": group.name}


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    await db.delete(group)
    await db.commit()

    await log_audit(
        db,
        action="group_deleted",
        admin_username=admin.username,
        target_type="group",
        target_id=str(group_id),
        details={"name": group.name},
        ip_address=request.client.host,
    )

    return
# end of RCA/backend/src/modules/ddm/api/admin/groups.py