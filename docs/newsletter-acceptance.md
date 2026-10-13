# RJS-04 email-only newsletter signup

Scope: email-only signup, explicit consent, requested Resend confirmation, private Supabase consent history, duplicate/cooldown handling and unsubscribe. The owner chose this flow instead of requiring a RoamJS account. Monthly campaigns, automatic content generation, contact synchronization and public activation are separate work.

## Behavior

- `/updates` asks for an email and an unchecked consent checkbox. It never signs the visitor in or creates an Auth user.
- Requests are stored as pending. Only a successfully verified confirmation token changes the subscription to subscribed.
- Confirmation uses a random 256-bit token, stored only as a SHA-256 hash, and expires after 24 hours. A replacement email invalidates the previous token. Visiting the email link does not change consent: the visitor chooses Confirm signup on the website, so link scanners do not subscribe people.
- Existing subscribers and requests in the 60-second cooldown receive the same generic response without another email. If Resend rejects or times out, the server releases that request's cooldown so the visitor can retry immediately. The pending token stays valid in case the provider accepted the send but lost its response; a successful retry replaces it. Database limits are three requests per email and twenty per client per UTC hour. Each request incrementally removes expired limit windows in batches of up to 64 per limit check, retaining the current and previous hour. The client identifier is HMAC-hashed from Vercel's platform-provided IP header; missing headers share a fallback limit. These are basic abuse controls, not a promise against distributed attacks.
- Confirmation provides a signed unsubscribe link. The future campaign sender must include that link in every announcement. Opt-out needs no account, is idempotent, records history and invalidates pending confirmations. A new subscription after opt-out requires fresh explicit signup and confirmation.
- Consent links are excluded from PostHog's public-path allowlist; the forms exclude autocapture. Link pages have no-referrer/noindex/no-store headers. Keys, tokens, addresses and provider/database errors are not returned as diagnostics.
- SMTP sign-in configuration is unaffected. This flow uses Resend's email API with the same recognizable `RoamJS <noreply@roamjs.com>` sender. No marketing contacts or broadcasts are created.

## Staged deployment

Use the existing RoamJS project `uxihswugvmdwbbtgxtfl` in organization `jevettuehuhgoesqqhxc`. Confirm both before applying migrations `20261011025930_newsletter_double_opt_in.sql`, `20261013165138_release_failed_newsletter_delivery.sql`, and `20261013170656_prune_expired_newsletter_limits.sql` in order. The first adds three private RLS tables and backend-only invoker RPCs; the second adds a backend-only retry RPC; the third indexes and incrementally prunes expired rate-limit windows. Anonymous and authenticated users cannot execute the functions or read the tables. These migrations do not change Auth accounts, suggestions or the owner allowlist.

The backend needs a modern Supabase secret key because there is no visitor session. Store it as `SUPABASE_NEWSLETTER_SECRET_KEY`, exclusively in server environment settings. A Supabase secret key has project-wide elevated access and bypasses RLS; it is not a narrowly scoped newsletter credential. A separately named key supports revocation but does not reduce that privilege. Never put it in `NEXT_PUBLIC_*`, source, chat or browser storage. The routes call only the fixed newsletter RPCs and never accept a function/table name from the visitor.

Set `NEWSLETTER_LINK_SECRET` to a stable random secret of at least 32 characters. Keep it private and preserve it across deployments: rotating it breaks earlier unsubscribe links. Store `RESEND_API_KEY` server-side and set `NEWSLETTER_SITE_URL` to the exact protected preview origin for testing; use `https://roamjs.com` only for the approved public rollout. Links use this configured origin rather than a supplied Host or form field.

Keep `NEWSLETTER_SIGNUP_ENABLED=false` in production. Enable only the protected test branch after applying the migration and configuring server secrets, then rebuild. Disable the signup flag to pause new requests; preserve the persistence key and link secret so existing confirmation and unsubscribe links continue working. No database rollback or row deletion is needed to pause signup.

## Acceptance and limitations

The local suite tests real PostgreSQL consent transitions, expiry, replay after unsubscribe, resubscription, quotas, RLS and anonymous/authenticated role denial using PGlite. API tests cover validation, explicit consent, absent account sessions, origin checks, hashed token/IP handling, missing persistence/delivery receipts, signed opt-out and opt-out while signup is paused. Provider responses in API tests are fixtures.

The local production-build walkthrough also exercised the real Next.js pages and API against the isolated PostgreSQL fixture: signed-out signup, explicit confirmation, unsubscribe and refusal of the old confirmation after opt-out all passed. Desktop and 390px mobile screenshots were inspected; the mobile page had no horizontal overflow. Link-page privacy headers were checked, and fixture server secret values were absent from browser assets. This walkthrough uses an intercepted email provider and proves no real delivery. Run it with [the local fixture](../tests/newsletter-fixture/README.md).

Hosted acceptance completed October 12, 2026 on the protected `codex/newsletter-signup` preview. Organization `jevettuehuhgoesqqhxc` and project `uxihswugvmdwbbtgxtfl` were confirmed before the migration/configuration work. The original Supabase credential is now scoped to the preview only. The preview Resend credential is sending-only and restricted to the verified `roamjs.com` domain in the correct sender account.

- Two real requested confirmation emails arrived in Gmail Inbox. The actual messages were opened in Gmail; the configured logo image loaded at 40 by 48 pixels, and the confirmation button was available. Gmail trimmed repeated content in the second message; expanding that content exposed the new confirmation button.
- A signed-out browser submitted the email-only form with explicit consent. The first pending record became subscribed only after the website confirmation action.
- Unsubscribe persisted, cleared the pending confirmation and recorded opt-out. Reusing the old confirmation showed the expired/replaced-link error and did not resubscribe the address.
- A fresh signup sent a different confirmation link, remained pending and required a new explicit confirmation. The ledger recorded a second confirmation.
- The test address was unsubscribed again at the end. The private ledger contains two confirmation events and two opt-outs. No marketing contacts or broadcasts were created, and production newsletter signup remains disabled.

Earlier delivery attempts returned HTTP 403 because the sending key belonged to another account. A later credential edit populated the Supabase variable with a Resend value. Both assignments were corrected after explicit approval. Pair `SUPABASE_NEWSLETTER_SECRET_KEY` with a Supabase `sb_secret_` value and `RESEND_API_KEY` with the correct account's Resend value; the display name assigned to a key inside Resend does not change its type. Failed provider requests record only their HTTP status in server logs, never the recipient, key, token, request body or provider error body.

This proves the real hosted newsletter consent flow for the approved test address. It does not activate public signup, approve the PR for merge, verify every mail client or device, or implement campaigns. Review and merge remain separate; an approved public rollout still needs a controlled production check.

RJS-05 must synchronize only currently confirmed, opted-in records to the chosen Resend marketing segment/topic and respect provider suppressions and unsubscribes before every send. Do not bulk-import pending addresses or existing RoamJS accounts. Account deletion/email changes do not silently change this independent newsletter consent. Newsletter-specific data requests still require a verified private follow-up.

Implementation references: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vercel client headers](https://vercel.com/docs/headers/request-headers).
