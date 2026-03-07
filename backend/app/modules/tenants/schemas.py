import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.tenants.models import TenantStatus


class TenantCreateRequest(BaseModel):
    slug: str = Field(min_length=3, max_length=100, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=2, max_length=200)
    primary_contact_email: EmailStr | None = None
    status: TenantStatus = TenantStatus.ACTIVE


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    status: TenantStatus
    primary_contact_email: str | None
    created_at: datetime
    updated_at: datetime
