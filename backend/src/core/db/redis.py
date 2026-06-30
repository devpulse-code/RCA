# RCA/backend/src/core/db/redis.py
import redis.asyncio as aioredis
from backend.src.config.settings import settings

redis_client = aioredis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
)


async def get_redis():
    return redis_client
# end of RCA/backend/src/core/db/redis.py