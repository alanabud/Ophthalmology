from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class ClaimStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PENDING = "pending"
    PAID = "paid"
    DENIED = "denied"


class Claim(Base, UUIDPrimaryKeyMixin, TimestampMixin, AuditFieldsMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "claims"
    __table_args__ = (
        Index("ix_claims_tenant_clinic_status", "tenant_id", "clinic_id", "status"),
        Index("ix_claims_encounter_id", "encounter_id"),
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
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("encounters.id", ondelete="SET NULL"),
        nullable=True,
    )
    claim_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    payer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[ClaimStatus] = mapped_column(
        SAEnum(ClaimStatus, native_enum=False),
        nullable=False,
        default=ClaimStatus.DRAFT,
    )
    total_amount_cents: Mapped[int] = mapped_column(nullable=False)
    patient_responsibility_cents: Mapped[int] = mapped_column(nullable=False)
    last_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
