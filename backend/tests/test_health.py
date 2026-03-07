def test_liveness_returns_ok(client) -> None:
    response = client.get("/health/liveness")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "backend",
        "checks": {"api": "ok"},
    }


def test_validation_errors_use_consistent_error_envelope(client) -> None:
    response = client.post("/api/v1/auth/login", json={})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["request_id"] is not None
    assert len(body["error"]["details"]) >= 1
