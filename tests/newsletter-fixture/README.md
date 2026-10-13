# Local newsletter walkthrough

Run `node tests/newsletter-fixture/server.mjs` from the website checkout. It builds the real Next.js app and starts it on `http://localhost:3226/updates`, with a loopback-only PostgreSQL fixture and intercepted Resend transport. No real email, Auth account or hosted database is used. Stop this process with Ctrl+C when finished.

For a response-timing check, set `ROAMJS_NEWSLETTER_FIXTURE_EMAIL_DELAY_MS=2500` before starting the fixture. The fake provider waits 2.5 seconds before writing the email, while the signup API should respond before that wait finishes for both new and existing addresses.

Use an `@example.invalid` address. The fake provider writes the confirmation email to ignored `local/newsletter-fixture-outbox.json`. Open its localhost confirmation link to exercise the real page/API/database transitions, then the unsubscribe link shown after confirmation. The database is in memory and disappears when this fixture stops. Consent is still changed by explicit POST, never GET.

The preload applies only with the explicit fixture marker and loopback database URL. It is not imported by application code or installed in hosted settings. This walkthrough proves local integration and UI, not real email delivery or hosted acceptance.
