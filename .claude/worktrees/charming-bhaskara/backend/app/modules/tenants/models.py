from enum import StrEnum

from sqlalchemy import Enum as SAEnum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class TenantStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class Tenant(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "tenants"
    __table_args__ = (UniqueConstraint("slug", name="uq_tenants_slug"),)

    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[TenantStatus] = mapped_column(
        SAEnum(TenantStatus, native_enum=False),
        nullable=False,
        default=TenantStatus.ACTIVE,
    )
    primary_contact_email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    clinics: Mapped[list["Clinic"]] = relationship(back_populates="tenant", lazy="selectin")
