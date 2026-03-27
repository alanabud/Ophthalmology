import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-with-32-bytes-minimum-length")
os.environ.setdefault("APP_DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
os.environ.setdefault("APP_REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("APP_ENVIRONMENT", "test")
os.environ.setdefault("APP_LOG_JSON", "false")

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
