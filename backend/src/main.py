# RCA/backend/src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.config.settings import settings
from backend.src.api.router import router as core_router
from backend.src.core.middleware.security_headers import SecurityHeadersMiddleware
from backend.src.core.middleware.rate_limit import RateLimitMiddleware
from backend.src.core.middleware.session import SessionMiddleware
from contextlib import asynccontextmanager
from backend.src.core.db.database import engine, async_session
from backend.src.core.models.base import Base
from backend.src.core.db.seed import seed
from backend.src.core.db.redis import redis_client
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text
import asyncio
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def purge_old_audit_logs():
    """Delete audit logs older than the configured retention period."""
    try:
        async with async_session() as db:
            result = await db.execute(
                text("SELECT value FROM system_settings WHERE key = 'audit_log_retention_days'")
            )
            row = result.fetchone()
            retention_days = int(row[0]) if row else 1095

            if retention_days <= 0:
                logger.info("Audit log retention set to indefinite, skipping purge")
                return

            await db.execute(
                text("DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL :days DAY"),
                {"days": retention_days}
            )
            await db.commit()
            logger.info(f"Purged audit logs older than {retention_days} days")
    except Exception as e:
        logger.error(f"Audit log purge failed: {e}")


async def wait_for_redis(retries=10, delay=1):
    """Ping Redis until it responds or retries exhausted."""
    for attempt in range(1, retries + 1):
        try:
            await redis_client.ping()
            logger.info("Redis connection established")
            return
        except Exception as e:
            logger.warning(f"Redis ping attempt {attempt}/{retries} failed: {e}")
            if attempt == retries:
                raise RuntimeError("Could not connect to Redis after multiple attempts") from e
            await asyncio.sleep(delay)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed()

    # Verify database connectivity
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    # Wait for Redis to be ready before accepting requests
    await wait_for_redis()

    scheduler.add_job(purge_old_audit_logs, CronTrigger(hour=3, minute=0), id="audit_purge")
    scheduler.start()
    logger.info("Scheduler started for audit log retention")

    yield

    scheduler.shutdown()
    await engine.dispose()


app = FastAPI(
    title="DDM - Digital Data Management",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ddm_environment == "development" else None,
    redoc_url=None,
)

# CORS – proper configuration with explicit origins (no "*" with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiter (stub)
app.add_middleware(RateLimitMiddleware)

# Session middleware (stub)
app.add_middleware(SessionMiddleware)

app.include_router(core_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.src.main:app", host="0.0.0.0", port=8000, reload=True)
# end of RCA/backend/src/main.py