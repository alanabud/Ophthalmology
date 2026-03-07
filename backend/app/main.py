import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.system import router as system_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.db.redis import close_redis
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger = logging.getLogger(__name__)
    logger.info("application_starting", extra={"event": "application_starting"})
    yield
    await close_redis()
    await engine.dispose()
    logger.info("application_stopped", extra={"event": "application_stopped"})


def create_application() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level, settings.log_json)

    app = FastAPI(
        title=settings.project_name,
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Clinic-ID",
            "X-Request-ID",
            "X-Tenant-ID",
        ],
    )
    register_exception_handlers(app)
    app.include_router(system_router)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_application()
