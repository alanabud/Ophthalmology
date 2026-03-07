import uuid
from datetime import date
from enum import StrEnum

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ClinicStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Clinic(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "clinics"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_clinics_tenant_code"),
        Index("ix_clinics_tenant_name", "tenant_id", "name"),
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[ClinicStatus] = mapped_column(
        SAEnum(ClinicStatus, native_enum=False),
        nullable=False,
        default=ClinicStatus.ACTIVE,
    )
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="clinics", lazy="joined")
    locations: Mapped[list["ClinicLocation"]] = relationship(back_populates="clinic", lazy="selectin")


class ClinicLocation(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "clinic_locations"
    __table_args__ = (
        Index("ix_clinic_locations_clinic_id", "clinic_id"),
        UniqueConstraint("clinic_id", "name", name="uq_clinic_locations_name"),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    line1: Mapped[str] = mapped_column(String(255), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(80), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="US")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    clinic: Mapped[Clinic] = relationship(back_populates="locations", lazy="joined")


class ProviderClinicAssignment(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    AuditFieldsMixin,
    SoftDeleteMixin,
    TenantScopedMixin,
):
    __tablename__ = "provider_clinic_assignments"
    __table_args__ = (
        UniqueConstraint("tenant_id", "clinic_id", "user_id", name="uq_provider_clinic_assignment"),
        Index("ix_provider_clinic_assignments_user_id", "user_id"),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    npi: Mapped[str | None] = mapped_column(String(20), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class StaffClinicAssignment(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    AuditFieldsMixin,
    SoftDeleteMixin,
    TenantScopedMixin,
):
    __tablename__ = "staff_clinic_assignments"
    __table_args__ = (
        UniqueConstraint("tenant_id", "clinic_id", "user_id", name="uq_staff_clinic_assignment"),
        Index("ix_staff_clinic_assignments_user_id", "user_id"),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
