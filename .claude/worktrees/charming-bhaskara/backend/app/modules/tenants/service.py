import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthorizationError, ConflictError, NotFoundError
from app.modules.audit.schemas import AuditEventCreate, RequestAuditMetadata
from app.modules.audit.service import AuditService
from app.modules.auth.schemas import UserContextSnapshot
from app.modules.tenants.models import Tenant
from app.modules.tenants.repository import TenantRepository
from app.modules.tenants.schemas import TenantCreateRequest, TenantResponse


class TenantService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = TenantRepository(session)
        self.audit_service = AuditService(session)

    async def list_tenants(self, current_user: UserContextSnapshot) -> list[TenantResponse]:
        if current_user.user.is_superuser:
            tenants = await self.repository.list_all()
        else:
            tenants = await self.repository.list_by_ids(current_user.accessible_tenant_ids)
        return [TenantResponse.model_validate(tenant) for tenant in tenants]

    async def get_tenant(self, tenant_id: uuid.UUID, current_user: UserContextSnapshot) -> TenantResponse:
        tenant = await self.repository.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found.")
        if not current_user.user.is_superuser and tenant.id not in current_user.accessible_tenant_ids:
            raise AuthorizationError("Requested tenant is not accessible.")
        return TenantResponse.model_validate(tenant)

    async def create_tenant(
        self,
        payload: TenantCreateRequest,
        current_user: UserContextSnapshot,
        request_metadata: RequestAuditMetadata,
    ) -> TenantResponse:
        existing = await self.repository.get_by_slug(payload.slug)
        if existing is not None:
            raise ConflictError("Tenant slug already exists.")

        tenant = Tenant(
            slug=payload.slug,
            name=payload.name,
            status=payload.status,
            primary_contact_email=payload.primary_contact_email,
            created_by=current_user.user.id,
            updated_by=current_user.user.id,
        )
        await self.repository.create(tenant)
        await self.audit_service.record_event(
            AuditEventCreate(
                actor_user_id=current_user.user.id,
                session_id=current_user.session_id,
                event_type="tenant",
                action="create",
                resource_type="tenant",
                resource_id=str(tenant.id),
                request_id=request_metadata.request_id,
                ip_address=request_metadata.ip_address,
                user_agent=request_metadata.user_agent,
                details={"slug": tenant.slug, "name": tenant.name},
            )
        )
        await self.session.commit()
        await self.session.refresh(tenant)
        return TenantResponse.model_validate(tenant)
