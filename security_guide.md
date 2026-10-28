# BossUp security boundaries

Passwords are verified by Firebase Authentication through its password sign-in API. Public signup allows donor and business-owner roles only. Administrator promotion is a backend operator command using the Firebase service account.

The browser uses an HttpOnly session cookie. Production cookies are Secure and SameSite=Lax. A fresh database role check protects each authenticated request, so changing a stored role changes permissions immediately. JWT_SECRET_KEY has no built-in development fallback. Session lifetime defaults to one hour; logout clears this browser's cookie.

Campaign drafts are visible only to their owner or an administrator. Public listings show live campaigns. Donors can retrieve only their own transaction records; administrators have explicit review access. Database administration must remain restricted to operators.

Payment success is never taken from browser input. Flutterwave receipts are fetched on the server and matched against reference, amount, currency and provider ID. Campaign credit and receipt recording share a Firestore transaction. The same receipt cannot increase a total twice. Webhooks require the configured v3 secret hash and a separately verified provider receipt. There is no simulated-success checkout.

Sensitive writes check the request origin. Authentication and payment initiation have an in-process attempt limit. CSP permits only this site's scripts; text rendering escapes user input. HTTPS deployments add HSTS. Do not turn on live collection until the provider, Firestore transaction, refund and settlement acceptance steps in README.md are complete.

Limitations: the attempt limiter is intended for one worker. Distributed deployments need shared rate limits. Token revocation after password changes is bounded by the session lifetime unless the operator disables the account in its BossUp profile. There is no automated KYC, owner payout, refund, account-recovery or transaction reconciliation service. These are operator workflows, and must not be presented as automated features.

The tests mock external service boundaries; a green test run is not a production security audit or a live merchant acceptance result. Keep dependencies updated, restrict Firebase client rules and service-account access, back up Firestore, and monitor failed provider notifications.
