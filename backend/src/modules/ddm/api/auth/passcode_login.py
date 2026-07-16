# RCA/backend/src/modules/ddm/api/auth/passcode_login.py
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import get_db
from backend.src.core.db.redis import get_redis
from backend.src.modules.ddm.models.user import User
from backend.src.modules.ddm.services.passcode_service import verify_passcode
from backend.src.modules.ddm.schemas.auth import PasscodeLoginResponse

router = APIRouter()


@router.post("/auth/passcode")
async def passcode_login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    data = await request.json()
    passcode = data.get("passcode")
    if not passcode:
        raise HTTPException(status_code=400, detail="Passcode required")

    user = await verify_passcode(db, passcode)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid passcode")

    # Create user session in Redis, now including the user's name
    session_id = str(uuid.uuid4())
    session_key = f"user_session:{session_id}"
    await redis.hset(session_key, mapping={
        "user_id": str(user.id),
        "name": user.name,                              # <-- stored here
        "groups": ",".join([str(g.id) for g in user.groups]),
    })
    await redis.expire(session_key, 8 * 3600)  # 8h default

    resp = JSONResponse(content={
        "message": "Login successful",
        "redirect": "/dashboard"
    })
    resp.set_cookie(
        key="user_session",
        value=session_id,
        httponly=True,
        secure=False,          # Set to True when using HTTPS
        samesite="strict",
        max_age=8 * 3600,
        path="/",
    )
    return resp
# end of RCA/backend/src/modules/ddm/api/auth/passcode_login.py