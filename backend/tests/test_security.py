from datetime import timedelta
from uuid import uuid4

from app.core.security import TokenType, create_token, decode_token, hash_password, verify_password


def test_password_hashing_round_trip() -> None:
    hashed_password = hash_password("StrongPassword!123")

    assert hashed_password != "StrongPassword!123"
    assert verify_password("StrongPassword!123", hashed_password) is True
    assert verify_password("WrongPassword!123", hashed_password) is False


def test_access_token_round_trip() -> None:
    user_id = uuid4()
    session_id = uuid4()
    tenant_id = uuid4()

    token = create_token(
        subject=user_id,
        session_id=session_id,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=5),
        tenant_id=tenant_id,
    )
    payload = decode_token(token, expected_type=TokenType.ACCESS)

    assert payload.subject == user_id
    assert payload.session_id == session_id
    assert payload.tenant_id == tenant_id
    assert payload.token_type == TokenType.ACCESS
