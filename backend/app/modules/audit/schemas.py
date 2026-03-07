import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.modules.audit.models import AuditOutcome


class RequestAuditMetadata(BaseModel):
    request_id: str | None = Field(default=None, max_length=64)
    ip_address: str | None = Field(default=None, max_length=64)
    user_agent: str | None = Field(default=None, max_length=512)


class AuditEventCreate(BaseModel):
    actor_user_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    tenant_id: uuid.UUID | None = None
    clinic_id: uuid.UUID | None = None
    event_type: str = Field(min_length=1, max_length=100)
    action: str = Field(min_length=1, max_length=100)
    resource_type: str = Field(min_length=1, max_length=100)
    resource_id: str | None = Field(default=None, max_length=64)
    outcome: AuditOutcome = AuditOutcome.SUCCESS
    request_id: str | None = Field(default=None, max_length=64)
    ip_address: str | None = Field(default=None, max_length=64)
    user_agent: str | None = Field(default=None, max_length=512)
    details: dict[str, Any] = Field(default_factory=dict)


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID | None
    clinic_id: uuid.UUID | None
    actor_user_id: uuid.UUID | None
    session_id: uuid.UUID | None
    event_type: str
    action: str
    resource_type: str
    resource_id: str | None
    outcome: AuditOutcome
    request_id: str | None
    ip_address: str | None
    user_agent: str | None
    details: dict[str, Any]
    occurred_at: datetime
