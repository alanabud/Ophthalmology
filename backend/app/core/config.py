import json
from functools import lru_cache
from typing import Any, Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="APP_",
        extra="ignore",
        case_sensitive=False,
    )

    project_name: str = "Ophthalmology Enterprise Platform"
    environment: Literal["local", "test", "staging", "production"] = "local"
    api_v1_prefix: str = "/api/v1"

    secret_key: SecretStr
    database_url: str
    redis_url: str

    jwt_issuer: str = "ophthalmology-enterprise-platform"
    jwt_audience: str = "ophthalmology-enterprise-platform-users"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_minutes: int = 60 * 24 * 7

    database_pool_size: int = 10
    database_max_overflow: int = 20

    cors_allowed_origins: list[str] = Field(default_factory=list)
    cors_allow_credentials: bool = True

    log_level: str = "INFO"
    log_json: bool = True

    worker_broker_url: str | None = None
    worker_result_backend: str | None = None

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def parse_cors_allowed_origins(cls, value: Any) -> list[str]:
        if value in (None, ""):
            return []

        if isinstance(value, str):
            cleaned = value.strip()
            if cleaned.startswith("["):
                return [str(item).strip() for item in json.loads(cleaned)]
            return [item.strip() for item in cleaned.split(",") if item.strip()]

        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        raise TypeError("Invalid CORS origin configuration.")

    @property
    def celery_broker_url(self) -> str:
        return self.worker_broker_url or self.redis_url

    @property
    def celery_result_backend(self) -> str:
        return self.worker_result_backend or self.redis_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
