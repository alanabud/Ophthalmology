import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: SecretStr
    tenant_id: uuid.UUID | None = None
    clinic_id: uuid.UUID | None = None


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)


class LogoutRequest(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=20)


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    display_name: str | None
    is_active: bool
    is_superuser: bool
    home_tenant_id: uuid.UUID | None


class UserContextSnapshot(BaseModel):
    user: UserSummary
    session_id: uuid.UUID
    active_tenant_id: uuid.UUID | None = None
    active_clinic_id: uuid.UUID | None = None
    accessible_tenant_ids: list[uuid.UUID] = Field(default_factory=list)
    accessible_clinic_ids: list[uuid.UUID] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)
    role_codes: list[str] = Field(default_factory=list)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime
    context: UserContextSnapshot
