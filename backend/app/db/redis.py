from collections.abc import AsyncIterator

from redis.asyncio import Redis
from redis.asyncio import from_url as redis_from_url

from app.core.config import get_settings

_redis_client: Redis | None = None


def get_redis_client() -> Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis_from_url(settings.redis_url, encoding="utf-8", decode_responses=False)
    return _redis_client


async def ping_redis() -> bool:
    return bool(await get_redis_client().ping())


async def redis_dependency() -> AsyncIterator[Redis]:
    yield get_redis_client()


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
