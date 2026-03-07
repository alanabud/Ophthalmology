from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class AppointmentStatus(StrEnum):
    SCHEDULED = "scheduled"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AppointmentType(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "appointment_types"
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_appointment_types_tenant_code"),)

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)


class Appointment(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("ix_appointments_tenant_clinic_start", "tenant_id", "clinic_id", "starts_at"),
        Index("ix_appointments_patient_id", "patient_id"),
    )

    clinic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    appointment_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("appointment_types.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, native_enum=False),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    room_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
