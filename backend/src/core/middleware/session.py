# RCA/backend/src/core/middleware/session.py
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.src.core.db.redis import get_redis
import logging

logger = logging.getLogger(__name__)

# Prefixes that do NOT require authentication
PUBLIC_PATH_PREFIXES = (
    "/api/ddm/auth/admin/login",
    "/api/ddm/auth/admin/2fa",
    "/api/ddm/auth/passcode",
    "/api/ddm/auth/session",
    "/api/ddm/public",
    "/api/health",
    "/docs",
    "/openapi.json",
)

class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Allow public paths without any check
        if any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES):
            return await call_next(request)

        # Only enforce authentication for /api/ddm routes and /api/auth routes
        if not path.startswith("/api/ddm") and not path.startswith("/api/auth"):
            return await call_next(request)

        admin_session_id = request.cookies.get("admin_session")
        user_session_id = request.cookies.get("user_session")

        if not admin_session_id and not user_session_id:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

        try:
            redis = await get_redis()
        except Exception as e:
            logger.error(f"Redis connection failed during session check: {e}")
            return JSONResponse(status_code=503, content={"detail": "Session service temporarily unavailable"})

        if admin_session_id:
            try:
                admin_id = await redis.get(f"admin_session:{admin_session_id}")
            except Exception as e:
                logger.error(f"Redis get error for admin session: {e}")
                return JSONResponse(status_code=503, content={"detail": "Session service error"})
            if not admin_id:
                return JSONResponse(status_code=401, content={"detail": "Admin session expired"})

        elif user_session_id:
            try:
                user_id = await redis.hget(f"user_session:{user_session_id}", "user_id")
            except Exception as e:
                logger.error(f"Redis hget error for user session: {e}")
                return JSONResponse(status_code=503, content={"detail": "Session service error"})
            if not user_id:
                return JSONResponse(status_code=401, content={"detail": "User session expired"})

        response = await call_next(request)
        return response
# end of RCA/backend/src/core/middleware/session.py