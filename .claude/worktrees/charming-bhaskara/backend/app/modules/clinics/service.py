import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthorizationError, ConflictError, NotFoundError
from app.modules.audit.schemas import AuditEventCreate, RequestAuditMetadata
from app.modules.audit.service import AuditService
from app.modules.auth.schemas import UserContextSnapshot
from app.modules.clinics.models import Clinic, ClinicLocation
from app.modules.clinics.repository import ClinicRepository
from app.modules.clinics.schemas import ClinicCreateRequest, ClinicResponse


class ClinicService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = ClinicRepository(session)
        self.audit_service = AuditService(session)

    async def list_clinics(
        self,
        current_user: UserContextSnapshot,
        tenant_id: uuid.UUID | None,
    ) -> list[ClinicResponse]:
        if tenant_id is not None and not current_user.user.is_superuser and tenant_id not in current_user.accessible_tenant_ids:
            raise AuthorizationError("Requested tenant is not accessible.")

        clinics = await self.repository.list(
            tenant_id=tenant_id,
            allowed_tenant_ids=None if current_user.user.is_superuser else current_user.accessible_tenant_ids,
        )
        return [ClinicResponse.model_validate(clinic) for clinic in clinics]

    async def get_clinic(self, clinic_id: uuid.UUID, current_user: UserContextSnapshot) -> ClinicResponse:
        clinic = await self.repository.get_by_id(clinic_id)
        if clinic is None:
            raise NotFoundError("Clinic not found.")
        if not current_user.user.is_superuser and clinic.tenant_id not in current_user.accessible_tenant_ids:
            raise AuthorizationError("Requested clinic is not accessible.")
        return ClinicResponse.model_validate(clinic)

    async def create_clinic(
        self,
        payload: ClinicCreateRequest,
        current_user: UserContextSnapshot,
        request_metadata: RequestAuditMetadata,
    ) -> ClinicResponse:
        if not current_user.user.is_superuser and payload.tenant_id not in current_user.accessible_tenant_ids:
            raise AuthorizationError("Requested tenant is not accessible.")
        if sum(1 for location in payload.locations if location.is_primary) > 1:
            raise ConflictError("Only one clinic location can be marked as primary.")

        existing = await self.repository.get_by_code(payload.tenant_id, payload.code)
        if existing is not None:
            raise ConflictError("Clinic code already exists for this tenant.")

        clinic = Clinic(
            tenant_id=payload.tenant_id,
            code=payload.code,
            name=payload.name,
            timezone=payload.timezone,
            phone=payload.phone,
            email=payload.email,
            status=payload.status,
            created_by=current_user.user.id,
            updated_by=current_user.user.id,
        )
        locations = [
            ClinicLocation(
                tenant_id=payload.tenant_id,
                name=location.name,
                line1=location.line1,
                line2=location.line2,
                city=location.city,
                state=location.state,
                postal_code=location.postal_code,
                country=location.country,
                is_primary=location.is_primary,
                created_by=current_user.user.id,
                updated_by=current_user.user.id,
            )
            for location in payload.locations
        ]
        await self.repository.create(clinic, locations)
        await self.audit_service.record_event(
            AuditEventCreate(
                actor_user_id=current_user.user.id,
                session_id=current_user.session_id,
                tenant_id=payload.tenant_id,
                clinic_id=clinic.id,
                event_type="clinic",
                action="create",
                resource_type="clinic",
                resource_id=str(clinic.id),
                request_id=request_metadata.request_id,
                ip_address=request_metadata.ip_address,
                user_agent=request_metadata.user_agent,
                details={"code": clinic.code, "name": clinic.name},
            )
        )
        await self.session.commit()
        created = await self.repository.get_by_id(clinic.id)
        if created is None:
            raise NotFoundError("Clinic not found after creation.")
        return ClinicResponse.model_validate(created)
