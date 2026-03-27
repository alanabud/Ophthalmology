from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class EncounterStatus(StrEnum):
    OPEN = "open"
    SIGNED = "signed"
    CLOSED = "closed"


class Encounter(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "encounters"
    __table_args__ = (
        Index("ix_encounters_tenant_clinic_started", "tenant_id", "clinic_id", "started_at"),
        Index("ix_encounters_patient_id", "patient_id"),
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
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[EncounterStatus] = mapped_column(
        SAEnum(EncounterStatus, native_enum=False),
        nullable=False,
        default=EncounterStatus.OPEN,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    chief_complaint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    diagnosis_summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    visual_acuity_od: Mapped[str | None] = mapped_column(String(30), nullable=True)
    visual_acuity_os: Mapped[str | None] = mapped_column(String(30), nullable=True)
    iop_od: Mapped[str | None] = mapped_column(String(20), nullable=True)
    iop_os: Mapped[str | None] = mapped_column(String(20), nullable=True)
    follow_up_plan: Mapped[str | None] = mapped_column(String(255), nullable=True)
