from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.clinics.models import Clinic, ClinicLocation


class ClinicRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
        allowed_tenant_ids: list[uuid.UUID] | None = None,
    ) -> list[Clinic]:
        if allowed_tenant_ids is not None and len(allowed_tenant_ids) == 0:
            return []

        stmt = select(Clinic).options(selectinload(Clinic.locations)).where(Clinic.deleted_at.is_(None))
        if allowed_tenant_ids is not None:
            stmt = stmt.where(Clinic.tenant_id.in_(allowed_tenant_ids))
        if tenant_id is not None:
            stmt = stmt.where(Clinic.tenant_id == tenant_id)

        stmt = stmt.order_by(Clinic.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_by_id(self, clinic_id: uuid.UUID) -> Clinic | None:
        stmt = (
            select(Clinic)
            .options(selectinload(Clinic.locations))
            .where(Clinic.id == clinic_id, Clinic.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, tenant_id: uuid.UUID, code: str) -> Clinic | None:
        stmt = select(Clinic).where(
            Clinic.tenant_id == tenant_id,
            Clinic.code == code,
            Clinic.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, clinic: Clinic, locations: list[ClinicLocation]) -> Clinic:
        self.session.add(clinic)
        await self.session.flush()
        for location in locations:
            location.clinic_id = clinic.id
            self.session.add(location)
        await self.session.flush()
        return clinic
