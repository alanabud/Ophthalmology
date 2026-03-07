from http import HTTPStatus

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.modules.audit.schemas import RequestAuditMetadata
from app.modules.auth.dependencies import get_current_user_context, get_request_audit_metadata
from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, TokenPairResponse, UserContextSnapshot
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenPairResponse)
async def login(
    payload: LoginRequest,
    request_metadata: RequestAuditMetadata = Depends(get_request_audit_metadata),
    db_session: AsyncSession = Depends(get_db_session),
) -> TokenPairResponse:
    service = AuthService(db_session)
    return await service.login(payload, request_metadata)


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh(
    payload: RefreshRequest,
    request_metadata: RequestAuditMetadata = Depends(get_request_audit_metadata),
    db_session: AsyncSession = Depends(get_db_session),
) -> TokenPairResponse:
    service = AuthService(db_session)
    return await service.refresh(payload.refresh_token, request_metadata)


@router.post("/logout", status_code=HTTPStatus.NO_CONTENT)
async def logout(
    payload: LogoutRequest,
    current_user: UserContextSnapshot = Depends(get_current_user_context),
    request_metadata: RequestAuditMetadata = Depends(get_request_audit_metadata),
    db_session: AsyncSession = Depends(get_db_session),
) -> Response:
    service = AuthService(db_session)
    await service.logout(current_user, request_metadata, payload.refresh_token)
    return Response(status_code=HTTPStatus.NO_CONTENT)


@router.get("/me", response_model=UserContextSnapshot)
async def me(current_user: UserContextSnapshot = Depends(get_current_user_context)) -> UserContextSnapshot:
    return current_user
