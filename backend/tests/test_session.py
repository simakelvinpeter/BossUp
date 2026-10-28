import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers import auth
from app.core.security import TokenResponse


def test_login_sets_an_http_only_session_and_logout_clears_it(monkeypatch):
    async def login(request):
        return TokenResponse(
            access_token="test-signed-token",
            expires_in=3600,
            user_id="user1",
            role="INVESTOR",
        )

    monkeypatch.setattr(auth.auth_service, "login", login)
    monkeypatch.setenv("ENVIRONMENT", "production")
    app = FastAPI()
    app.include_router(auth.router, prefix="/auth")
    client = TestClient(app, base_url="https://testserver")
    response = client.post(
        "/auth/login",
        json={"email": "person@example.com", "password": "correct-password"},
    )
    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    assert client.post("/auth/logout").status_code == 200
    assert "bossup_session" not in client.cookies
