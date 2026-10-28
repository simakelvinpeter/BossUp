# BossUp — East African campaign donations

BossUp helps people support administrator-reviewed business campaigns through donations. Tanzania is the launch country, and new campaigns default to TZS. Donations do not buy shares, interest, ownership or promised financial returns.

## Current status

The application connects signup, password login, campaign drafts/submission, administrator review, donor receipts and hosted checkout. Backend tests cover password rejection, blocked administrator signup, receipt validation, repeated payment confirmation and secure session cookies. Browser tests use explicit API fixtures; they do not prove a live Firebase or merchant integration.

**Live launch is not yet verified.** Configure your Firebase project and approved Tanzanian Flutterwave merchant account, complete the sandbox acceptance steps below, and verify deployment before accepting real donations. Payments remain disabled by default. Campaign disbursements and refunds require manual operator review through the payment provider; there is no automatic wallet withdrawal or owner payout system.

## Run locally

Use Python 3.13. From the repository root:

```sh
python -m venv .venv
```

Activate with `.venv\Scripts\Activate.ps1` in PowerShell, or `source .venv/bin/activate` on Linux/macOS.

```sh
python -m pip install -r backend/requirements.txt
```

Copy backend/.env.example to backend/.env. Configure:

- JWT_SECRET_KEY: generate a random value with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- GOOGLE_APPLICATION_CREDENTIALS: absolute path to your Firebase service-account JSON. Keep it outside frontend/ and out of Git.
- FIREBASE_WEB_API_KEY: your Firebase project's web API key. Enable Email/Password sign-in in Firebase Authentication and create the Firestore database.

```sh
python -m uvicorn app.main:app --app-dir backend --env-file backend/.env --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. The same server serves the original HTML/CSS interface and API. There is no second frontend server to configure.

## Accounts and administrator access

Create your own account on signup.html. There are no shared production demo passwords. Donors support campaigns; business owners submit them. The legacy API role name INVESTOR is retained internally for compatibility, while the interface uses donation language.

To make your existing account an administrator, run this locally with your backend Firebase administrator credentials:

```sh
python tools/promote_admin.py your-email@example.com
```

Sign in with that account's existing password. Public signup cannot grant administrator access. Administrators verify owners, approve/reject campaigns and review audit logs. Verification is a manual check, not an automated identity-verification service.

## Flutterwave for Tanzania

The integration uses Flutterwave v3 hosted checkout. TZS offers card and mobilemoneytanzania; the code also supports KES/M-Pesa, UGX/mobilemoneyuganda and RWF/mobilemoneyrwanda when enabled for your merchant account. Provider availability and merchant approval must be confirmed for your business model and registration country.

1. Complete merchant onboarding for the Tanzanian business and obtain approval to collect campaign donations. Confirm settlement/disbursement arrangements for campaign owners.
2. Start with a test-mode FLW_SECRET_KEY in the backend environment.
3. Set an HTTPS PAYMENT_RETURN_URL ending in /payment-complete.html on your deployment.
4. Set a random FLW_SECRET_HASH and configure that same value in the Flutterwave v3 webhook settings. The webhook URL is https://your-domain/payments/webhook. Enable webhook retries.
5. Set PAYMENTS_ENABLED=true only for the configured environment. Never place secret keys in HTML or JavaScript.

The server ignores submitted success statuses. It verifies provider status, reference, amount, currency and transaction ID. A Firestore transaction credits a receipt once, even if a webhook repeats. Campaign currencies are never added together as if they were the same money.

Provider references:

- [Hosted checkout](https://developer.flutterwave.com/docs/flutterwave-standard-1)
- [Supported payment methods](https://developer.flutterwave.com/docs/payment-methods)
- [Receipt verification](https://developer.flutterwave.com/docs/transaction-verification)
- [v3 webhooks](https://developer.flutterwave.com/docs/webhooks)

## Acceptance before live launch

Use a separate test Firebase project and Flutterwave test environment. Check a business signup, owner verification, campaign submission and approval, then a donor checkout. Confirm successful, cancelled, pending and declined payments. Repeat the same webhook and confirmation; the campaign total must increase only once. Confirm that a different account cannot access private campaign drafts or another donor's receipt.

The automated unit tests mock provider and database boundaries. They do not replace this sandbox test, Firestore transaction validation, a real settlement/refund rehearsal, or a small approved live payment test. Publish operator contact details and reviewed donation/refund/privacy terms before taking live donations.

## Deployment

A Dockerfile is included. Supply the same environment settings securely, set ENVIRONMENT=production and use HTTPS. Mount credentials read-only or use FIREBASE_CREDENTIALS as a secret JSON environment value. No credential file is copied into the image.

Firestore is the persistent database; back it up and restrict client access because the browser talks only to this backend. Run one application worker: the simple abuse limiter is kept in process memory. A deployment with several workers/replicas needs a shared limiter. Do not publish the application without configuring its operator policies and completing merchant acceptance.

## Checks

```sh
python -m pytest -q
python -m pip install playwright
python -m playwright install chromium
python tests/browser_smoke.py
```

On this Windows workstation, set BROWSER_CHANNEL=msedge to use installed Edge instead of downloading Chromium. Browser fixtures never charge a card or contact Firebase. GitHub Actions runs both suites.

## Code map

- frontend/assets/js/api.js: calls the same-origin API; it does not store login tokens.
- frontend/assets/js/app.js: shared display helpers and current user.
- account.js, marketplace.js, campaign.js, create-campaign.js, dashboard.js and receipt.js: one small file per page flow.
- backend/app/services/auth_service.py: Firebase password verification and signup.
- backend/app/services/flutterwave.py: provider HTTP requests and receipt checks.
- backend/app/services/payment_service.py: donation records and atomic campaign credit.
- backend/app/core/security.py: signed sessions and database-backed roles.
- backend/tests: backend regression checks.
- tests/browser_smoke.py: complete frontend contracts using explicit fixtures.
