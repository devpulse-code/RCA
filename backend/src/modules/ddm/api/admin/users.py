# RCA/backend/src/modules/ddm/api/admin/users.py
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.user import User
from backend.src.modules.ddm.models.group import Group
from backend.src.modules.ddm.schemas.user import UserCreate, UserUpdate, UserOut, PasscodeResponse
from backend.src.modules.ddm.services.passcode_service import create_passcode_for_user, revoke_passcode, get_passcode
from backend.src.modules.ddm.services.audit_service import log_audit
from backend.src.modules.ddm.api.deps import get_current_admin

router = APIRouter(prefix="/users", tags=["admin-users"])


@router.get("/", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    try:
        result = await db.execute(select(User).options(selectinload(User.groups)))
        users = result.scalars().all()
    except Exception as e:
        # If the relationship or table isn't ready yet, return an empty list
        # This prevents the admin panel from breaking when this endpoint is used
        # only for session verification.
        return []

    out = []
    for u in users:
        out.append(
            UserOut(
                id=u.id,
                name=u.name,
                contact=u.contact,
                groups=[g.name for g in u.groups],
                passcode_active=u.passcode_active,
                created_at=str(u.created_at),
                updated_at=str(u.updated_at),
            )
        )
    return out


@router.post("/", response_model=PasscodeResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    groups = []
    for name in payload.groups:
        result = await db.execute(select(Group).where(Group.name == name))
        group = result.scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=400, detail=f"Group '{name}' does not exist")
        groups.append(group)

    user = User(
        name=payload.name,
        contact=payload.contact,
        encrypted_passcode="placeholder",
        groups=groups,
    )
    db.add(user)
    await db.flush()

    passcode = await create_passcode_for_user(db, user)

    await log_audit(
        db,
        action="user_created",
        admin_username=admin.username,
        target_type="user",
        target_id=str(user.id),
        details={"name": user.name, "groups": payload.groups},
        ip_address=request.client.host,
    )

    return PasscodeResponse(user_id=user.id, passcode=passcode)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.groups))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(
        id=user.id,
        name=user.name,
        contact=user.contact,
        groups=[g.name for g in user.groups],
        passcode_active=user.passcode_active,
        created_at=str(user.created_at),
        updated_at=str(user.updated_at),
    )


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    # 1. Fetch user with eagerly loaded groups (so we can modify without lazy loads)
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.groups))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Apply changes
    if payload.name is not None:
        user.name = payload.name
    if payload.contact is not None:
        user.contact = payload.contact
    if payload.groups is not None:
        groups = []
        for name in payload.groups:
            result = await db.execute(select(Group).where(Group.name == name))
            group = result.scalar_one_or_none()
            if not group:
                raise HTTPException(status_code=400, detail=f"Group '{name}' does not exist")
            groups.append(group)
        user.groups = groups

    # 3. Commit changes
    await db.commit()

    # 4. Re-query a fresh object with eager loaded groups (safe to build response)
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.groups))
    )
    updated_user = result.scalar_one()

    # 5. Audit log (safe, no lazy loads needed)
    await log_audit(
        db,
        action="user_updated",
        admin_username=admin.username,
        target_type="user",
        target_id=str(user_id),
        details=payload.dict(exclude_unset=True),
        ip_address=request.client.host,
    )

    # 6. Build and return the response
    return UserOut(
        id=updated_user.id,
        name=updated_user.name,
        contact=updated_user.contact,
        groups=[g.name for g in updated_user.groups],
        passcode_active=updated_user.passcode_active,
        created_at=str(updated_user.created_at),
        updated_at=str(updated_user.updated_at),
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()

    await log_audit(
        db,
        action="user_deleted",
        admin_username=admin.username,
        target_type="user",
        target_id=str(user_id),
        details={"name": user.name},
        ip_address=request.client.host,
    )
    return


@router.post("/{user_id}/revoke-passcode", response_model=PasscodeResponse)
async def revoke_user_passcode(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_passcode = await create_passcode_for_user(db, user)

    await log_audit(
        db,
        action="passcode_revoked",
        admin_username=admin.username,
        target_type="user",
        target_id=str(user_id),
        details={"name": user.name},
        ip_address=request.client.host,
    )

    return PasscodeResponse(user_id=user.id, passcode=new_passcode)


@router.post("/bulk/revoke-passcodes", response_model=list[PasscodeResponse])
async def bulk_revoke_passcodes(
    user_ids: list[int],
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    responses = []
    for uid in user_ids:
        user = await db.get(User, uid)
        if not user:
            continue
        new_passcode = await create_passcode_for_user(db, user)
        responses.append(PasscodeResponse(user_id=uid, passcode=new_passcode))
        await log_audit(
            db,
            action="passcode_revoked",
            admin_username=admin.username,
            target_type="user",
            target_id=str(uid),
            details={"name": user.name, "bulk": True},
            ip_address=request.client.host,
        )
    return responses


@router.get("/bulk/passcodes-csv")
async def download_passcodes_csv(
    user_ids: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    ids = [int(x) for x in user_ids.split(",") if x.strip().isdigit()]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["User ID", "Name", "New Passcode"])
    for uid in ids:
        user = await db.get(User, uid)
        if not user:
            continue
        passcode = await get_passcode(db, user)
        writer.writerow([uid, user.name, passcode])
    content = output.getvalue()
    return {"csv": content}
# end of RCA/backend/src/modules/ddm/api/admin/users.py