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
        session_key = f"user_session:{user_sid}"
        # First try to get name directly from Redis (fast path)
        name = await redis.hget(session_key, "name")
        user_id = await redis.hget(session_key, "user_id")

        if user_id:
            # If name not in Redis (old session), fetch from DB and store it
            if not name:
                result = await db.execute(
                    select(User).options(selectinload(User.groups)).where(User.id == int(user_id))
                )
                user = result.scalars().first()
                if user:
                    name = user.name
                    # Save it back to Redis for future requests
                    await redis.hset(session_key, "name", name)
                else:
                    name = "User"
            return {
                "authenticated": True,
                "role": "user",
                "user_id": int(user_id),
                "name": name,
            }

    return JSONResponse(status_code=401, content={"authenticated": False})
# end of RCA/backend/src/modules/ddm/api/auth/session.py