# RCA/backend/src/core/middleware/rate_limit.py
import time
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.src.core.db.redis import get_redis
import logging

logger = logging.getLogger("ddm.rate_limit")

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only apply to API endpoints under /api/ddm
        if not request.url.path.startswith("/api/ddm"):
            return await call_next(request)

        session_cookie = request.cookies.get("user_session") or request.cookies.get("admin_session")
        if session_cookie:
            key = f"rl:session:{session_cookie}"
        else:
            key = f"rl:ip:{request.client.host}"

        redis = await get_redis()
        window = 60  # seconds
        current = await redis.incr(key)
        if current == 1:
            await redis.expire(key, window)

        is_admin = request.cookies.get("admin_session") is not None
        limit = 500 if is_admin else 200
        if current > limit:
            retry_after = await redis.ttl(key)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Please wait {retry_after} seconds.",
                    "retry_after": retry_after,
                }
            )

        response = await call_next(request)
        return response
# end of RCA/backend/src/core/middleware/rate_limit.py