from types import SimpleNamespace
from fastapi.testclient import TestClient
from app import main
from app.routers import campaigns


def app_client(monkeypatch):
    monkeypatch.setattr(main, "initialize_firebase", lambda: None)
    main.attempts.clear()
    return TestClient(main.app)


def test_frontend_is_served_with_security_headers_and_writes_check_origin(monkeypatch):
    with app_client(monkeypatch) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "Support local ideas" in response.text
        assert "script-src 'self'" in response.headers["content-security-policy"]
        assert client.get("/assets/js/account.js").status_code == 200
        assert (
            client.post(
                "/auth/login",
                headers={"Origin": "https://another-site.example"},
                json={},
            ).status_code
            == 403
        )


def test_private_campaign_is_hidden_from_anonymous_visitors(monkeypatch):
    async def get_campaign(campaign_id):
        return SimpleNamespace(status="PENDING", owner_id="owner1")

    monkeypatch.setattr(campaigns.campaign_service, "get_campaign", get_campaign)
    with app_client(monkeypatch) as client:
        assert client.get("/campaigns/private1").status_code == 404
        assert client.get("/campaigns?status=PENDING").status_code == 400


def test_login_abuse_is_limited_without_contacting_firebase(monkeypatch):
    monkeypatch.delenv("FIREBASE_WEB_API_KEY", raising=False)
    with app_client(monkeypatch) as client:
        for _ in range(10):
            assert (
                client.post(
                    "/auth/login",
                    json={"email": "person@example.com", "password": "wrong-password"},
                ).status_code
                == 401
            )
        assert client.post("/auth/login", json={}).status_code == 429
