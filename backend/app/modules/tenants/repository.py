import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tenants.models import Tenant


class TenantRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_all(self) -> list[Tenant]:
        stmt = select(Tenant).where(Tenant.deleted_at.is_(None)).order_by(Tenant.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_ids(self, tenant_ids: list[uuid.UUID]) -> list[Tenant]:
        if not tenant_ids:
            return []
        stmt = (
            select(Tenant)
            .where(Tenant.id.in_(tenant_ids), Tenant.deleted_at.is_(None))
            .order_by(Tenant.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, tenant_id: uuid.UUID) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.id == tenant_id, Tenant.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.slug == slug, Tenant.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, tenant: Tenant) -> Tenant:
        self.session.add(tenant)
        await self.session.flush()
        return tenant
