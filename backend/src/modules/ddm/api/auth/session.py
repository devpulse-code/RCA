# RCA/backend/src/modules/ddm/api/auth/session.py
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.core.db.redis import get_redis
from backend.src.core.db.database import get_db
from backend.src.modules.ddm.models.user import User

router = APIRouter()

@router.get("/session")
async def check_session(
    request: Request,
    redis=Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    admin_sid = request.cookies.get("admin_session")
    user_sid = request.cookies.get("user_session")

    # Admin session
    if admin_sid:
        admin_id = await redis.get(f"admin_session:{admin_sid}")
        if admin_id:
            return {
                "authenticated": True,
                "role": "admin",
                "user_id": int(admin_id),
                "name": "Admin",
            }

    # User (passcode) session
    if user_sid:
        user_id = await redis.hget(f"user_session:{user_sid}", "user_id")
        if user_id:
            # Fetch user name
            result = await db.execute(
                select(User).options(selectinload(User.groups)).where(User.id == int(user_id))
            )
            user = result.scalars().first()
            return {
                "authenticated": True,
                "role": "user",
                "user_id": int(user_id),
                "name": user.name if user else "User",
            }

    return JSONResponse(status_code=401, content={"authenticated": False})
# end of RCA/backend/src/modules/ddm/api/auth/session.py