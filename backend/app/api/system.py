from http import HTTPStatus

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.redis import ping_redis
from app.db.session import check_database_health
from app.schemas.common import HealthCheckResponse

router = APIRouter(tags=["System"])


@router.get("/health/liveness", response_model=HealthCheckResponse)
async def liveness() -> HealthCheckResponse:
    return HealthCheckResponse(status="ok", service="backend", checks={"api": "ok"})


@router.get("/health/readiness", response_model=HealthCheckResponse)
async def readiness() -> JSONResponse:
    checks: dict[str, str] = {}
    status = HTTPStatus.OK

    try:
        await check_database_health()
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"
        status = HTTPStatus.SERVICE_UNAVAILABLE

    try:
        redis_ok = await ping_redis()
        checks["redis"] = "ok" if redis_ok else "error"
        if not redis_ok:
            status = HTTPStatus.SERVICE_UNAVAILABLE
    except Exception:
        checks["redis"] = "error"
        status = HTTPStatus.SERVICE_UNAVAILABLE

    body = HealthCheckResponse(
        status="ok" if status == HTTPStatus.OK else "degraded",
        service="backend",
        checks=checks,
    )
    return JSONResponse(status_code=status.value, content=body.model_dump(mode="json"))
