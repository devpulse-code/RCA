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
        # Only apply to /api/ddm routes
        if not request.url.path.startswith("/api/ddm"):
            return await call_next(request)

        # Determine rate‑limit key: prefer session, fall back to IP
        session_cookie = request.cookies.get("user_session") or request.cookies.get("admin_session")
        if session_cookie:
            key = f"rl:session:{session_cookie}"
        else:
            # Safely handle missing client info (e.g., behind misconfigured proxy)
            client_ip = request.client.host if request.client else "unknown"
            key = f"rl:ip:{client_ip}"

        try:
            redis = await get_redis()
        except Exception as e:
            logger.error(f"Redis unavailable for rate limit: {e}")
            # Allow request to proceed if Redis is down
            return await call_next(request)

        try:
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
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Allow request to proceed if rate limit check itself fails

        response = await call_next(request)
        return response

# end of RCA/backend/src/core/middleware/rate_limit.py