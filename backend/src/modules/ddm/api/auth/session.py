# RCA/backend/src/modules/ddm/api/auth/session.py
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from backend.src.core.db.redis import get_redis

router = APIRouter()

@router.get("/session")
async def check_session(request: Request, redis=Depends(get_redis)):
    """
    Lightweight endpoint to verify if a session cookie is valid.
    Returns role and user_id if authenticated, otherwise 401.
    """
    admin_sid = request.cookies.get("admin_session")
    user_sid = request.cookies.get("user_session")

    # Admin session
    if admin_sid:
        admin_id = await redis.get(f"admin_session:{admin_sid}")
        if admin_id:
            return {"authenticated": True, "role": "admin", "user_id": int(admin_id)}

    # User (passcode) session
    if user_sid:
        user_id = await redis.hget(f"user_session:{user_sid}", "user_id")
        if user_id:
            return {"authenticated": True, "role": "user", "user_id": int(user_id)}

    return JSONResponse(status_code=401, content={"authenticated": False})
# end of RCA/backend/src/modules/ddm/api/auth/session.py