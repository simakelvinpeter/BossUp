import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from app.services import auth_service as module


@pytest.mark.asyncio
async def test_wrong_password_does_not_issue_a_token(monkeypatch):
    monkeypatch.setenv("FIREBASE_WEB_API_KEY", "test-key")
    response = SimpleNamespace(status_code=400)
    client = AsyncMock()
    client.post.return_value = response
    manager = AsyncMock()
    manager.__aenter__.return_value = client
    monkeypatch.setattr(module.httpx, "AsyncClient", lambda **kwargs: manager)
    issue = MagicMock()
    monkeypatch.setattr(module, "create_access_token", issue)
    with pytest.raises(ValueError, match="Invalid email or password"):
        await module.AuthService.login(
            module.LoginRequest(email="person@example.com", password="wrong-password")
        )
    issue.assert_not_called()


@pytest.mark.asyncio
async def test_correct_password_must_match_firebase_identity(monkeypatch):
    monkeypatch.setenv("FIREBASE_WEB_API_KEY", "test-key")
    response = SimpleNamespace(
        status_code=200, json=lambda: {"localId": "someone-else"}
    )
    client = AsyncMock()
    client.post.return_value = response
    manager = AsyncMock()
    manager.__aenter__.return_value = client
    monkeypatch.setattr(module.httpx, "AsyncClient", lambda **kwargs: manager)
    monkeypatch.setattr(
        module.firebase_auth,
        "get_user_by_email",
        lambda email: SimpleNamespace(uid="user1", disabled=False),
    )
    with pytest.raises(ValueError, match="Invalid email or password"):
        await module.AuthService.login(
            module.LoginRequest(email="person@example.com", password="valid-password")
        )
