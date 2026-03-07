from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any
from uuid import UUID

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from pydantic import BaseModel, ConfigDict, Field
from pwdlib import PasswordHash

from app.core.config import get_settings
from app.core.errors import AuthenticationError

ALGORITHM = "HS256"
password_hasher = PasswordHash.recommended()


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    subject: UUID = Field(alias="sub")
    session_id: UUID = Field(alias="sid")
    token_type: TokenType = Field(alias="type")
    tenant_id: UUID | None = None
    clinic_id: UUID | None = None
    jti: UUID | None = None
    exp: int
    iat: int
    iss: str
    aud: str


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hasher.verify(password, hashed_password)


def create_token(
    *,
    subject: UUID,
    session_id: UUID,
    token_type: TokenType,
    expires_delta: timedelta,
    tenant_id: UUID | None = None,
    clinic_id: UUID | None = None,
    jti: UUID | None = None,
) -> str:
    settings = get_settings()
    issued_at = datetime.now(UTC)
    expires_at = issued_at + expires_delta
    claims: dict[str, Any] = {
        "sub": str(subject),
        "sid": str(session_id),
        "type": token_type.value,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    if tenant_id:
        claims["tenant_id"] = str(tenant_id)
    if clinic_id:
        claims["clinic_id"] = str(clinic_id)
    if jti:
        claims["jti"] = str(jti)
    return jwt.encode(claims, settings.secret_key.get_secret_value(), algorithm=ALGORITHM)


def decode_token(token: str, *, expected_type: TokenType) -> TokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[ALGORITHM],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except ExpiredSignatureError as exc:
        raise AuthenticationError("Token has expired.") from exc
    except InvalidTokenError as exc:
        raise AuthenticationError("Token is invalid.") from exc

    token_payload = TokenPayload.model_validate(payload)
    if token_payload.token_type != expected_type:
        raise AuthenticationError("Incorrect token type.")
    return token_payload
