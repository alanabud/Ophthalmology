import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AuthenticationError, AuthorizationError
from app.core.security import TokenType, create_token, decode_token, verify_password
from app.modules.audit.models import AuditOutcome
from app.modules.audit.schemas import AuditEventCreate, RequestAuditMetadata
from app.modules.audit.service import AuditService
from app.modules.auth.constants import RoleCode
from app.modules.auth.models import User
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import LoginRequest, TokenPairResponse, UserContextSnapshot, UserSummary


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = AuthRepository(session)
        self.audit_service = AuditService(session)
        self.settings = get_settings()

    async def login(self, payload: LoginRequest, request_metadata: RequestAuditMetadata) -> TokenPairResponse:
        user = await self.repository.get_user_by_email(payload.email.lower())
        if user is None or not verify_password(payload.password.get_secret_value(), user.hashed_password):
            await self.audit_service.record_event(
                AuditEventCreate(
                    event_type="auth",
                    action="login",
                    resource_type="user_session",
                    outcome=AuditOutcome.FAILURE,
                    request_id=request_metadata.request_id,
                    ip_address=request_metadata.ip_address,
                    user_agent=request_metadata.user_agent,
                    details={"email": payload.email},
                ),
                commit=True,
            )
            raise AuthenticationError("Invalid credentials.")

        if not user.is_active or user.deleted_at is not None:
            raise AuthenticationError("User account is unavailable.")

        session_id = uuid.uuid4()
        context = await self._build_context(
            user=user,
            session_id=session_id,
            requested_tenant_id=payload.tenant_id,
            requested_clinic_id=payload.clinic_id,
        )
        now = datetime.now(UTC)
        access_expires_at = now + timedelta(minutes=self.settings.access_token_ttl_minutes)
        refresh_expires_at = now + timedelta(minutes=self.settings.refresh_token_ttl_minutes)
        refresh_jti = uuid.uuid4()

        await self.repository.create_session(
            session_id=session_id,
            user_id=user.id,
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
            refresh_token_jti=refresh_jti,
            expires_at=refresh_expires_at,
            user_agent=request_metadata.user_agent,
            ip_address=request_metadata.ip_address,
        )
        await self.repository.touch_user_login(user, now)

        access_token = create_token(
            subject=user.id,
            session_id=session_id,
            token_type=TokenType.ACCESS,
            expires_delta=timedelta(minutes=self.settings.access_token_ttl_minutes),
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
        )
        refresh_token = create_token(
            subject=user.id,
            session_id=session_id,
            token_type=TokenType.REFRESH,
            expires_delta=timedelta(minutes=self.settings.refresh_token_ttl_minutes),
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
            jti=refresh_jti,
        )

        await self.audit_service.record_event(
            AuditEventCreate(
                actor_user_id=user.id,
                session_id=session_id,
                tenant_id=context.active_tenant_id,
                clinic_id=context.active_clinic_id,
                event_type="auth",
                action="login",
                resource_type="user_session",
                resource_id=str(session_id),
                request_id=request_metadata.request_id,
                ip_address=request_metadata.ip_address,
                user_agent=request_metadata.user_agent,
                details={"email": user.email},
            )
        )
        await self.session.commit()

        return TokenPairResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            context=context,
        )

    async def refresh(self, refresh_token: str, request_metadata: RequestAuditMetadata) -> TokenPairResponse:
        token_payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
        if token_payload.jti is None:
            raise AuthenticationError("Refresh token is invalid.")

        session = await self.repository.get_session_by_id(token_payload.session_id)
        if (
            session is None
            or session.revoked_at is not None
            or session.refresh_token_jti != token_payload.jti
            or session.expires_at <= datetime.now(UTC)
        ):
            raise AuthenticationError("Session is no longer valid.")

        user = await self.repository.get_user_by_id(token_payload.subject)
        if user is None or not user.is_active or user.deleted_at is not None:
            raise AuthenticationError("User account is unavailable.")

        context = await self._build_context(
            user=user,
            session_id=session.id,
            requested_tenant_id=token_payload.tenant_id,
            requested_clinic_id=token_payload.clinic_id,
        )
        now = datetime.now(UTC)
        access_expires_at = now + timedelta(minutes=self.settings.access_token_ttl_minutes)
        refresh_expires_at = now + timedelta(minutes=self.settings.refresh_token_ttl_minutes)
        new_refresh_jti = uuid.uuid4()

        await self.repository.rotate_session_refresh(
            session,
            refresh_token_jti=new_refresh_jti,
            expires_at=refresh_expires_at,
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
            refreshed_at=now,
        )

        next_access_token = create_token(
            subject=user.id,
            session_id=session.id,
            token_type=TokenType.ACCESS,
            expires_delta=timedelta(minutes=self.settings.access_token_ttl_minutes),
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
        )
        next_refresh_token = create_token(
            subject=user.id,
            session_id=session.id,
            token_type=TokenType.REFRESH,
            expires_delta=timedelta(minutes=self.settings.refresh_token_ttl_minutes),
            tenant_id=context.active_tenant_id,
            clinic_id=context.active_clinic_id,
            jti=new_refresh_jti,
        )

        await self.audit_service.record_event(
            AuditEventCreate(
                actor_user_id=user.id,
                session_id=session.id,
                tenant_id=context.active_tenant_id,
                clinic_id=context.active_clinic_id,
                event_type="auth",
                action="refresh",
                resource_type="user_session",
                resource_id=str(session.id),
                request_id=request_metadata.request_id,
                ip_address=request_metadata.ip_address,
                user_agent=request_metadata.user_agent,
            )
        )
        await self.session.commit()

        return TokenPairResponse(
            access_token=next_access_token,
            refresh_token=next_refresh_token,
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
            context=context,
        )

    async def logout(
        self,
        current_user: UserContextSnapshot,
        request_metadata: RequestAuditMetadata,
        refresh_token: str | None = None,
    ) -> None:
        session_id = current_user.session_id
        if refresh_token is not None:
            token_payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
            if token_payload.subject != current_user.user.id:
                raise AuthorizationError("Refresh token does not belong to the authenticated user.")
            session_id = token_payload.session_id

        session = await self.repository.get_session_by_id(session_id)
        if session is not None and session.revoked_at is None:
            await self.repository.revoke_session(session, datetime.now(UTC))

        await self.audit_service.record_event(
            AuditEventCreate(
                actor_user_id=current_user.user.id,
                session_id=session_id,
                tenant_id=current_user.active_tenant_id,
                clinic_id=current_user.active_clinic_id,
                event_type="auth",
                action="logout",
                resource_type="user_session",
                resource_id=str(session_id),
                request_id=request_metadata.request_id,
                ip_address=request_metadata.ip_address,
                user_agent=request_metadata.user_agent,
            )
        )
        await self.session.commit()

    async def _build_context(
        self,
        *,
        user: User,
        session_id: uuid.UUID,
        requested_tenant_id: uuid.UUID | None,
        requested_clinic_id: uuid.UUID | None,
    ) -> UserContextSnapshot:
        accessible_tenant_ids = [] if user.is_superuser else await self.repository.list_accessible_tenant_ids(user.id)
        active_tenant_id = self._resolve_active_tenant(user, accessible_tenant_ids, requested_tenant_id)

        accessible_clinic_ids: list[uuid.UUID] = []
        if active_tenant_id is not None and not user.is_superuser:
            accessible_clinic_ids = await self.repository.list_accessible_clinic_ids(user.id, active_tenant_id)

        if user.is_superuser:
            active_clinic_id = requested_clinic_id
            permissions = []
            role_codes = [RoleCode.PLATFORM_ADMIN.value]
        else:
            if requested_clinic_id is not None and requested_clinic_id not in accessible_clinic_ids:
                raise AuthorizationError("Requested clinic context is not available.")
            active_clinic_id = requested_clinic_id
            if active_clinic_id is None and len(accessible_clinic_ids) == 1:
                active_clinic_id = accessible_clinic_ids[0]
            permissions = await self.repository.list_permission_codes(user.id, active_tenant_id, active_clinic_id)
            role_codes = await self.repository.list_role_codes(user.id, active_tenant_id, active_clinic_id)

        return UserContextSnapshot(
            user=UserSummary.model_validate(user),
            session_id=session_id,
            active_tenant_id=active_tenant_id,
            active_clinic_id=active_clinic_id,
            accessible_tenant_ids=accessible_tenant_ids,
            accessible_clinic_ids=accessible_clinic_ids,
            permissions=permissions,
            role_codes=role_codes,
        )

    def _resolve_active_tenant(
        self,
        user: User,
        accessible_tenant_ids: list[uuid.UUID],
        requested_tenant_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        if user.is_superuser:
            return requested_tenant_id or user.home_tenant_id

        if requested_tenant_id is not None:
            if requested_tenant_id not in accessible_tenant_ids:
                raise AuthorizationError("Requested tenant context is not available.")
            return requested_tenant_id

        if user.home_tenant_id is not None and user.home_tenant_id in accessible_tenant_ids:
            return user.home_tenant_id

        if accessible_tenant_ids:
            return accessible_tenant_ids[0]

        return None
