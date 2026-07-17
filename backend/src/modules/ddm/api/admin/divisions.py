# RCA/backend/src/modules/ddm/api/admin/divisions.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.division import Division
from backend.src.modules.ddm.api.deps import get_current_admin
from backend.src.modules.ddm.services.audit_service import log_audit

router = APIRouter(prefix="/divisions", tags=["admin-divisions"])


@router.get("/")
async def list_divisions(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(Division))
    divisions = result.scalars().all()
    return [{"id": d.id, "name": d.name} for d in divisions]


@router.post("/", status_code=201)
async def create_division(
    name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    existing = await db.execute(select(Division).where(Division.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Division already exists")
    division = Division(name=name)
    db.add(division)
    await db.commit()

    await log_audit(
        db,
        action="division_created",
        admin_username=admin.username,
        target_type="division",
        target_id=str(division.id),
        details={"name": name},
        ip_address=request.client.host,
    )

    return {"id": division.id, "name": division.name}


@router.delete("/{division_id}", status_code=204)
async def delete_division(
    division_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    division = await db.get(Division, division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    await db.delete(division)
    await db.commit()

    await log_audit(
        db,
        action="division_deleted",
        admin_username=admin.username,
        target_type="division",
        target_id=str(division_id),
        details={"name": division.name},
        ip_address=request.client.host,
    )
    return
# end of RCA/backend/src/modules/ddm/api/admin/divisions.py