"""Browser contracts with explicit API fixtures; no real money or Firebase calls."""

import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(
    ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT / "frontend"))
)
Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}"
state = {"role": None, "created": None, "approved": False}
campaign = {
    "campaign_id": "campaign1",
    "owner_id": "owner1",
    "title": "Community bakery",
    "description": "We bake fresh bread for our community and need a new oven to expand production and train local apprentices.",
    "country": "KE",
    "currency": "KES",
    "target_amount": 50000,
    "raised_amount": 500,
    "category": "Food",
    "status": "LIVE",
    "created_at": "2026-10-28T12:00:00Z",
    "image_url": None,
}


def api(route):
    path = urlparse(route.request.url).path
    if not path.startswith(("/auth/", "/campaigns", "/payments/", "/admin/")):
        route.continue_()
        return
    status = 200
    body = {}
    data = route.request.post_data_json if route.request.post_data else {}
    if path == "/auth/me":
        if state["role"]:
            body = {
                "user_id": "user1",
                "full_name": "Test User",
                "email": "person@example.com",
                "role": state["role"],
                "country": "KE",
                "kyc_status": "VERIFIED",
                "created_at": "2026-10-28",
            }
        else:
            status, body = 401, {"detail": "Please sign in"}
    elif path == "/auth/login":
        assert data["password"] == "correct-password"
        state["role"] = "INVESTOR"
        body = {"role": "INVESTOR", "user_id": "user1"}
    elif path == "/auth/signup":
        assert data["country"] == "KE" and data["password"] == "correct-password"
        state["role"] = data["role"]
        body = {"role": data["role"], "user_id": "user1"}
    elif path == "/campaigns" and route.request.method == "POST":
        assert data["title"] and data["description"] and data["currency"] == "KES"
        assert "expected_roi" not in data
        state["created"] = data
        body = {**campaign, **data, "status": "PENDING"}
    elif path in ["/campaigns", "/campaigns/my", "/admin/campaigns/pending"]:
        body = {"campaigns": [campaign], "total": 1}
    elif path.startswith("/campaigns/"):
        body = campaign
    elif path == "/payments/initiate":
        assert data["currency"] == "KES" and float(data["amount"]) == 500
        status, body = 400, {"detail": "Donations are not enabled yet"}
    elif path == "/payments/my":
        body = [
            {
                "transaction_id": "donation1",
                "campaign_id": "campaign1",
                "amount": 500,
                "currency": "KES",
                "status": "COMPLETED",
                "created_at": "2026-10-28T12:00:00Z",
            }
        ]
    elif path == "/admin/stats":
        body = {
            "total_campaigns": 1,
            "live_campaigns": 1,
            "total_users": 3,
            "pending_campaigns": 1,
        }
    elif path == "/admin/users":
        body = [
            {
                "user_id": "owner1",
                "email": "owner@example.com",
                "role": "BUSINESS_OWNER",
                "country": "KE",
                "kyc_status": "VERIFIED",
            }
        ]
    elif path == "/admin/audit-logs":
        body = []
    elif path.endswith("/approve"):
        state["approved"] = True
        body = campaign
    route.fulfill(status=status, content_type="application/json", body=json.dumps(body))


try:
    with sync_playwright() as p:
        import os

        channel = os.getenv("BROWSER_CHANNEL")
        browser = p.chromium.launch(
            headless=True, **({"channel": channel} if channel else {})
        )
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.route("**/*", api)
        page.goto(base + "/login.html")
        page.locator("#email").fill("person@example.com")
        page.locator("#password").fill("correct-password")
        page.locator("#submitBtn").click()
        page.wait_for_url("**/investor-dashboard.html")
        page.locator("#dashboard-records").get_by_text("COMPLETED").wait_for()
        assert page.evaluate("localStorage.getItem('bossup_token')") is None
        page.goto(base + "/marketplace.html")
        page.get_by_text("Community bakery", exact=True).wait_for()
        page.get_by_role("link", name="View campaign").click()
        page.locator("#donation-amount").fill("500")
        page.locator("#donation-form button").click()
        page.locator("#donation-message").get_by_text(
            "Donations are not enabled yet"
        ).wait_for()
        state["role"] = None
        page.goto(base + "/signup.html?role=BUSINESS_OWNER")
        page.locator("#fullName").fill("Test Owner")
        page.locator("#email").fill("owner@example.com")
        page.locator("#password").fill("correct-password")
        page.locator("#country").select_option("KE")
        page.locator("#terms").check()
        page.locator("#submitBtn").click()
        page.wait_for_url("**/business-dashboard.html")
        page.goto(base + "/create-campaign.html")
        page.locator("#mainApp").wait_for(state="visible")
        page.locator("#ventureName").fill("Community bakery")
        page.locator("#category").select_option(index=1)
        page.locator("#amountNeeded").fill("50000")
        page.locator("#country").select_option("KE")
        page.locator("#currency").select_option("KES")
        page.locator("#pitch").fill(campaign["description"])
        page.locator("#save-draft").click()
        assert page.evaluate("localStorage.getItem('bossup_campaign_draft')")
        page.locator("#submitBtn").click()
        page.wait_for_url("**/business-dashboard.html")
        assert state["created"] is not None
        state["role"] = "ADMIN"
        page.goto(base + "/admin.html")
        page.locator("[data-approve]").click()
        page.wait_for_function(
            "document.querySelector('#dashboard-title').textContent === 'Admin dashboard'"
        )
        assert state["approved"]
        page.goto(base + "/index.html")
        page.get_by_role("heading", level=1).wait_for()
        page.goto(base + "/learning.html")
        page.locator("summary").first.click()
        assert not errors, errors
        browser.close()
        print(
            "Browser contracts passed: login, signup, dashboards, draft, submission, review and disabled checkout."
        )
finally:
    server.shutdown()
