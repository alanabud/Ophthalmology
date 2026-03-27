import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.context import get_request_id
from app.schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(
        self,
        message: str,
        *,
        status_code: int = HTTPStatus.BAD_REQUEST,
        code: str = "application_error",
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or []


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication failed.") -> None:
        super().__init__(message, status_code=HTTPStatus.UNAUTHORIZED, code="authentication_error")


class AuthorizationError(AppError):
    def __init__(self, message: str = "Access denied.") -> None:
        super().__init__(message, status_code=HTTPStatus.FORBIDDEN, code="authorization_error")


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, status_code=HTTPStatus.NOT_FOUND, code="not_found")


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict.") -> None:
        super().__init__(message, status_code=HTTPStatus.CONFLICT, code="conflict")


def build_error_response(
    *,
    message: str,
    status_code: int,
    code: str,
    details: list[ErrorDetail] | None = None,
) -> JSONResponse:
    body = ErrorEnvelope(
        error=ErrorPayload(
            code=code,
            message=message,
            request_id=get_request_id(),
            details=details or [],
        )
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return build_error_response(
            message=exc.message,
            status_code=exc.status_code,
            code=exc.code,
            details=exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            ErrorDetail(
                field=".".join(str(segment) for segment in error["loc"]),
                message=error["msg"],
                type=error["type"],
            )
            for error in exc.errors()
        ]
        return build_error_response(
            message="Request validation failed.",
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            code="validation_error",
            details=details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code == HTTPStatus.NOT_FOUND else "http_error"
        return build_error_response(
            message=str(exc.detail),
            status_code=exc.status_code,
            code=code,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unexpected_error")
        return build_error_response(
            message="An unexpected error occurred.",
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            code="internal_server_error",
        )
