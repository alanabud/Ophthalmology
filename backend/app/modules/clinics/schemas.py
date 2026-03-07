import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.clinics.models import ClinicStatus


class ClinicLocationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=80)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(default="US", min_length=2, max_length=2)
    is_primary: bool = False


class ClinicCreateRequest(BaseModel):
    tenant_id: uuid.UUID
    code: str = Field(min_length=2, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    name: str = Field(min_length=2, max_length=200)
    timezone: str = Field(min_length=1, max_length=64)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    status: ClinicStatus = ClinicStatus.ACTIVE
    locations: list[ClinicLocationCreateRequest] = Field(default_factory=list)


class ClinicLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    clinic_id: uuid.UUID
    name: str
    line1: str
    line2: str | None
    city: str
    state: str
    postal_code: str
    country: str
    is_primary: bool
    created_at: datetime
    updated_at: datetime


class ClinicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    code: str
    name: str
    timezone: str
    phone: str | None
    email: str | None
    status: ClinicStatus
    created_at: datetime
    updated_at: datetime
    locations: list[ClinicLocationResponse] = Field(default_factory=list)
