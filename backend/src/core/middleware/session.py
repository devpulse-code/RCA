# RCA/backend/src/core/middleware/session.py
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from backend.src.core.db.redis import get_redis
from backend.src.modules.ddm.models.admin import Admin
from backend.src.modules.ddm.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.core.db.database import async_session
from sqlalchemy import select

PUBLIC_PATHS = {
    "/api/ddm/auth/admin/login",
    "/api/ddm/auth/admin/2fa",
    "/api/ddm/auth/passcode",
    "/api/health",
    "/docs",
    "/openapi.json",
}

class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Skip public endpoints
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        # Check if path requires user or admin session
        admin_session_id = request.cookies.get("admin_session")
        user_session_id = request.cookies.get("user_session")

        if not admin_session_id and not user_session_id and path.startswith("/api/ddm"):
            # Allow unauthenticated for public API? No, all /api/ddm except auth endpoints require login
            if not any(path.startswith(p) for p in PUBLIC_PATHS):
                raise HTTPException(status_code=401, detail="Not authenticated")

        redis = await get_redis()
        if admin_session_id:
            admin_id = await redis.get(f"admin_session:{admin_session_id}")
            if admin_id:
                # Validate admin exists (optional, but can do a quick check)
                # For performance, we skip DB check here; the actual endpoint will do full validation.
                # We only ensure the session key exists.
                pass
            else:
                raise HTTPException(status_code=401, detail="Admin session expired")
        elif user_session_id:
            user_id = await redis.hget(f"user_session:{user_session_id}", "user_id")
            if not user_id:
                raise HTTPException(status_code=401, detail="User session expired")

        response = await call_next(request)
        return response
# end of RCA/backend/src/core/middleware/session.py