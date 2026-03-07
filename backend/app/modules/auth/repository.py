import uuid
from datetime import datetime

from sqlalchemy import distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Permission, Role, RolePermission, User, UserRole, UserSession
from app.modules.clinics.models import ProviderClinicAssignment, StaffClinicAssignment


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_by_email(self, email: str) -> User | None:
        stmt = select(User).where(func.lower(User.email) == email.lower(), User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_accessible_tenant_ids(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        tenant_ids: set[uuid.UUID] = set()
        statements = [
            select(UserRole.tenant_id).where(UserRole.user_id == user_id, UserRole.deleted_at.is_(None)),
            select(ProviderClinicAssignment.tenant_id).where(
                ProviderClinicAssignment.user_id == user_id,
                ProviderClinicAssignment.deleted_at.is_(None),
            ),
            select(StaffClinicAssignment.tenant_id).where(
                StaffClinicAssignment.user_id == user_id,
                StaffClinicAssignment.deleted_at.is_(None),
            ),
        ]

        for stmt in statements:
            result = await self.session.execute(stmt)
            tenant_ids.update(result.scalars().all())

        return sorted(tenant_ids, key=str)

    async def list_accessible_clinic_ids(
        self,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        clinic_ids: set[uuid.UUID] = set()
        statements = [
            select(UserRole.clinic_id).where(
                UserRole.user_id == user_id,
                UserRole.tenant_id == tenant_id,
                UserRole.clinic_id.is_not(None),
                UserRole.deleted_at.is_(None),
            ),
            select(ProviderClinicAssignment.clinic_id).where(
                ProviderClinicAssignment.user_id == user_id,
                ProviderClinicAssignment.tenant_id == tenant_id,
                ProviderClinicAssignment.deleted_at.is_(None),
            ),
            select(StaffClinicAssignment.clinic_id).where(
                StaffClinicAssignment.user_id == user_id,
                StaffClinicAssignment.tenant_id == tenant_id,
                StaffClinicAssignment.deleted_at.is_(None),
            ),
        ]

        for stmt in statements:
            result = await self.session.execute(stmt)
            clinic_ids.update(result.scalars().all())

        return sorted(clinic_ids, key=str)

    async def list_role_codes(
        self,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID | None,
        clinic_id: uuid.UUID | None,
    ) -> list[str]:
        if tenant_id is None:
            return []

        stmt = (
            select(distinct(Role.code))
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                UserRole.tenant_id == tenant_id,
                UserRole.deleted_at.is_(None),
                Role.deleted_at.is_(None),
            )
        )
        if clinic_id is not None:
            stmt = stmt.where(or_(UserRole.clinic_id.is_(None), UserRole.clinic_id == clinic_id))
        else:
            stmt = stmt.where(UserRole.clinic_id.is_(None))

        result = await self.session.execute(stmt)
        return sorted(result.scalars().all())

    async def list_permission_codes(
        self,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID | None,
        clinic_id: uuid.UUID | None,
    ) -> list[str]:
        if tenant_id is None:
            return []

        stmt = (
            select(distinct(Permission.code))
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                UserRole.tenant_id == tenant_id,
                UserRole.deleted_at.is_(None),
                Role.deleted_at.is_(None),
                Permission.deleted_at.is_(None),
                RolePermission.deleted_at.is_(None),
            )
        )
        if clinic_id is not None:
            stmt = stmt.where(or_(UserRole.clinic_id.is_(None), UserRole.clinic_id == clinic_id))
        else:
            stmt = stmt.where(UserRole.clinic_id.is_(None))

        result = await self.session.execute(stmt)
        return sorted(result.scalars().all())

    async def create_session(
        self,
        *,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID | None,
        clinic_id: uuid.UUID | None,
        refresh_token_jti: uuid.UUID,
        expires_at: datetime,
        user_agent: str | None,
        ip_address: str | None,
    ) -> UserSession:
        user_session = UserSession(
            id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            refresh_token_jti=refresh_token_jti,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
            created_by=user_id,
            updated_by=user_id,
        )
        self.session.add(user_session)
        await self.session.flush()
        return user_session

    async def get_session_by_id(self, session_id: uuid.UUID) -> UserSession | None:
        stmt = select(UserSession).where(UserSession.id == session_id, UserSession.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_session(self, session: UserSession, revoked_at: datetime) -> None:
        session.revoked_at = revoked_at
        session.updated_by = session.user_id
        await self.session.flush()

    async def rotate_session_refresh(
        self,
        session: UserSession,
        *,
        refresh_token_jti: uuid.UUID,
        expires_at: datetime,
        tenant_id: uuid.UUID | None,
        clinic_id: uuid.UUID | None,
        refreshed_at: datetime,
    ) -> None:
        session.refresh_token_jti = refresh_token_jti
        session.expires_at = expires_at
        session.tenant_id = tenant_id
        session.clinic_id = clinic_id
        session.last_seen_at = refreshed_at
        session.updated_by = session.user_id
        await self.session.flush()

    async def touch_user_login(self, user: User, at: datetime) -> None:
        user.last_login_at = at
        user.updated_by = user.id
        await self.session.flush()
