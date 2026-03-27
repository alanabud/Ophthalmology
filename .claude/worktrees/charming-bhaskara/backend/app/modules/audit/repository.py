import uuid
from collections.abc import Sequence

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog
from app.modules.audit.schemas import AuditEventCreate


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: AuditEventCreate) -> AuditLog:
        audit_log = AuditLog(**payload.model_dump())
        self.session.add(audit_log)
        await self.session.flush()
        return audit_log

    async def list(
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
    ) -> list[AuditLog]:
        if allowed_tenant_ids is not None and len(allowed_tenant_ids) == 0:
            return []

        stmt = select(AuditLog)
        if allowed_tenant_ids is not None:
            stmt = stmt.where(AuditLog.tenant_id.in_(list(allowed_tenant_ids)))
        if tenant_id is not None:
            stmt = stmt.where(AuditLog.tenant_id == tenant_id)
        if clinic_id is not None:
            stmt = stmt.where(AuditLog.clinic_id == clinic_id)
        if actor_user_id is not None:
            stmt = stmt.where(AuditLog.actor_user_id == actor_user_id)
        if resource_type is not None:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        if action is not None:
            stmt = stmt.where(AuditLog.action == action)

        stmt = stmt.order_by(desc(AuditLog.occurred_at)).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
