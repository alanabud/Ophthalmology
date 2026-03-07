import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditEventCreate, AuditLogResponse


class AuditService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = AuditRepository(session)

    async def record_event(self, payload: AuditEventCreate, *, commit: bool = False) -> AuditLog:
        audit_log = await self.repository.create(payload)
        if commit:
            await self.session.commit()
            await self.session.refresh(audit_log)
        return audit_log

    async def list_events(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
        clinic_id: uuid.UUID | None = None,
        actor_user_id: uuid.UUID | None = None,
        resource_type: str | None = None,
        action: str | None = None,
        limit: int = 50,
        offset: int = 0,
        allowed_tenant_ids: Sequence[uuid.UUID] | None = None,
    ) -> list[AuditLogResponse]:
        entries = await self.repository.list(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            actor_user_id=actor_user_id,
            resource_type=resource_type,
            action=action,
            limit=limit,
            offset=offset,
            allowed_tenant_ids=allowed_tenant_ids,
        )
        return [AuditLogResponse.model_validate(entry) for entry in entries]
