# RCA/backend/src/modules/ddm/api/auth/admin_login.py
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis
from backend.src.core.utils.encryption import verify_password
from backend.src.modules.ddm.models.admin import Admin
import uuid

router = APIRouter()


@router.post("/admin/login")
async def admin_login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    result = await db.execute(select(Admin).where(Admin.username == username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4())
    await redis.set(f"admin_session:{session_id}", str(admin.id), ex=28800)

    response = {"message": "Login successful"}
    resp = JSONResponse(content=response)
    resp.set_cookie(
        key="admin_session",
        value=session_id,
        httponly=True,
        secure=False,          # set True in production
        samesite="strict",
        max_age=28800,
    )
    return resp
# end of RCA/backend/src/modules/ddm/api/auth/admin_login.py