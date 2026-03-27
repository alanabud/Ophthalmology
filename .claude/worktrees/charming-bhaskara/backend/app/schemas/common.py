from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str
    type: str | None = None


class ErrorPayload(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorEnvelope(BaseModel):
    error: ErrorPayload


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    checks: dict[str, str] = Field(default_factory=dict)
