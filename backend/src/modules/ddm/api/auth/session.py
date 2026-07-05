# RCA/backend/src/modules/ddm/api/auth/session.py
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/session")
async def check_session(request: Request):
    """Lightweight endpoint to verify if a session exists.
    Returns role and session id if authenticated, otherwise 401.
    This endpoint is public and bypasses the session middleware
    (because it starts with /api/ddm/auth/)."""
    admin_sid = request.cookies.get("admin_session")
    user_sid = request.cookies.get("user_session")

    if admin_sid:
        return {"authenticated": True, "role": "admin"}
    elif user_sid:
        return {"authenticated": True, "role": "user"}
    else:
        return JSONResponse(status_code=401, content={"authenticated": False})
# end of RCA/backend/src/modules/ddm/api/auth/session.py