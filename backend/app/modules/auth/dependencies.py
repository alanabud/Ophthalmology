import uuid
from datetime import UTC, datetime

from fastapi import Depends, Header, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthenticationError, AuthorizationError
from app.core.security import TokenType, decode_token
from app.db.session import get_db_session
from app.modules.audit.schemas import RequestAuditMetadata
from app.modules.auth.constants import RoleCode
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import UserContextSnapshot, UserSummary

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user_context(
    db_session: AsyncSession = Depends(get_db_session),
    token: str = Depends(oauth2_scheme),
    tenant_header: uuid.UUID | None = Header(default=None, alias="X-Tenant-ID"),
    clinic_header: uuid.UUID | None = Header(default=None, alias="X-Clinic-ID"),
) -> UserContextSnapshot:
    token_payload = decode_token(token, expected_type=TokenType.ACCESS)
    repository = AuthRepository(db_session)

    user = await repository.get_user_by_id(token_payload.subject)
    if user is None or not user.is_active or user.deleted_at is not None:
        raise AuthenticationError("User account is unavailable.")

    session = await repository.get_session_by_id(token_payload.session_id)
    if session is None or session.revoked_at is not None or session.expires_at <= datetime.now(UTC):
        raise AuthenticationError("Session is no longer valid.")

    requested_tenant_id = tenant_header or token_payload.tenant_id
    requested_clinic_id = clinic_header or token_payload.clinic_id

    accessible_tenant_ids = [] if user.is_superuser else await repository.list_accessible_tenant_ids(user.id)
    if user.is_superuser:
        active_tenant_id = requested_tenant_id or user.home_tenant_id
        accessible_clinic_ids: list[uuid.UUID] = []
        active_clinic_id = requested_clinic_id
        permissions = []
        role_codes = [RoleCode.PLATFORM_ADMIN.value]
    else:
        if requested_tenant_id is not None and requested_tenant_id not in accessible_tenant_ids:
            raise AuthorizationError("Requested tenant context is not available.")

        active_tenant_id = requested_tenant_id
        if active_tenant_id is None and user.home_tenant_id in accessible_tenant_ids:
            active_tenant_id = user.home_tenant_id
        if active_tenant_id is None and accessible_tenant_ids:
            active_tenant_id = accessible_tenant_ids[0]

        accessible_clinic_ids = []
        if active_tenant_id is not None:
            accessible_clinic_ids = await repository.list_accessible_clinic_ids(user.id, active_tenant_id)
        if requested_clinic_id is not None and requested_clinic_id not in accessible_clinic_ids:
            raise AuthorizationError("Requested clinic context is not available.")
        active_clinic_id = requested_clinic_id
        if active_clinic_id is None and len(accessible_clinic_ids) == 1:
            active_clinic_id = accessible_clinic_ids[0]

        permissions = await repository.list_permission_codes(user.id, active_tenant_id, active_clinic_id)
        role_codes = await repository.list_role_codes(user.id, active_tenant_id, active_clinic_id)

    return UserContextSnapshot(
        user=UserSummary.model_validate(user),
        session_id=session.id,
        active_tenant_id=active_tenant_id,
        active_clinic_id=active_clinic_id,
        accessible_tenant_ids=accessible_tenant_ids,
        accessible_clinic_ids=accessible_clinic_ids,
        permissions=permissions,
        role_codes=role_codes,
    )


def require_permissions(*permission_codes: str):
    async def dependency(
        current_user: UserContextSnapshot = Depends(get_current_user_context),
    ) -> UserContextSnapshot:
        if current_user.user.is_superuser:
            return current_user

        granted_permissions = set(current_user.permissions)
        missing = [code for code in permission_codes if code not in granted_permissions]
        if missing:
            raise AuthorizationError("Missing required permissions.")
        return current_user

    return dependency


async def get_request_audit_metadata(request: Request) -> RequestAuditMetadata:
    return RequestAuditMetadata(
        request_id=getattr(request.state, "request_id", None),
        ip_address=getattr(request.state, "client_ip", None),
        user_agent=getattr(request.state, "user_agent", None),
    )
