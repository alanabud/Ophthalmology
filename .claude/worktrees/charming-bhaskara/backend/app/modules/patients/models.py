from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Date, DateTime, Enum as SAEnum, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditFieldsMixin, OptionalClinicScopedMixin, SoftDeleteMixin, TenantScopedMixin, TimestampMixin, UUIDPrimaryKeyMixin


class PatientStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class AdministrativeSex(StrEnum):
    FEMALE = "female"
    MALE = "male"
    OTHER = "other"
    UNKNOWN = "unknown"


class Patient(
    Base,
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    AuditFieldsMixin,
    SoftDeleteMixin,
    TenantScopedMixin,
    OptionalClinicScopedMixin,
):
    __tablename__ = "patients"
    __table_args__ = (
        UniqueConstraint("tenant_id", "medical_record_number", name="uq_patients_tenant_mrn"),
        Index("ix_patients_tenant_last_name", "tenant_id", "last_name"),
        Index("ix_patients_tenant_dob", "tenant_id", "date_of_birth"),
    )

    medical_record_number: Mapped[str] = mapped_column(String(50), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    administrative_sex: Mapped[AdministrativeSex] = mapped_column(
        SAEnum(AdministrativeSex, native_enum=False),
        nullable=False,
    )
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(80), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(80), nullable=True)
    primary_insurance: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[PatientStatus] = mapped_column(
        SAEnum(PatientStatus, native_enum=False),
        nullable=False,
        default=PatientStatus.ACTIVE,
    )
    last_encounter_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
