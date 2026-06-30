# RCA/backend/src/modules/ddm/api/deps.py
from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis
from backend.src.modules.ddm.models.admin import Admin
from backend.src.modules.ddm.models.user import User
from sqlalchemy import select


async def get_current_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Admin:
    session_id = request.cookies.get("admin_session")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_key = f"admin_session:{session_id}"
    admin_id = await redis.get(session_key)
    if not admin_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    admin = await db.get(Admin, int(admin_id))
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return admin


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> User:
    session_id = request.cookies.get("user_session")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_key = f"user_session:{session_id}"
    user_id = await redis.hget(session_key, "user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Refresh inactivity timer (configurable later)
    await redis.expire(session_key, 8 * 3600)
    return user
# end of RCA/backend/src/modules/ddm/api/deps.py