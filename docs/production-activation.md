# Public account and suggestion activation

## Legacy-table removal — October 11, 2026 (UTC)

The owner approved backing up and removing the pre-existing `public.apps` and `public.oauth_clients` tables before public activation. The website does not use either table; accounts use Supabase Auth and suggestions use private tables and authenticated RPCs.

The backup contains table definitions, column defaults, all rows, indexes, constraints, owners, grants and the owned sequence's value/called state. It is retained privately outside the Git checkout, with restricted filesystem permissions and SHA-256 checksums. It contained one app record and zero OAuth-client records. No backup data, client secrets or recipient addresses belong in this repository.

A rollback-only restoration into an isolated schema passed row equality, three indexes, 56 privilege entries and sequence-state checks. The temporary schema was rolled back, and the original rows were unchanged before removal. The removal transaction locked both tables and compared their contents to the backup before dropping them with `RESTRICT`, without `CASCADE`. No external database dependencies were found. Migration `20261011021241_remove_unused_legacy_oauth_tables.sql` records the change and is safe to replay when the tables are absent.

After removal, both tables and the owned sequence are absent, all four website private tables remain protected, and the legacy public-table RLS/GraphQL advisories are gone. Both existing hosted SQL regression suites passed: suggestion validation/retries/quotas and owner-inbox authorization/review/follow-up. Their synthetic fixtures were rolled back; they do not replace real production acceptance.

## Production configuration

- Supabase organization `jevettuehuhgoesqqhxc`, project `uxihswugvmdwbbtgxtfl` were confirmed before hosted changes.
- Site URL is `https://roamjs.com`; the exact `https://roamjs.com/auth/callback` is added alongside existing preview callbacks.
- Production Vercel settings provide the project URL and **publishable** key, plus `COMMUNITY_SUBMISSIONS_ENABLED=true`. The website has no service-role key.
- Resend SMTP sender, credentials, email templates and limits are unchanged by this activation. Account creation does not grant newsletter consent.
- Newsletter signup remains unconditionally disabled.
- The production rebuild uses reviewed main commit `06a18617edbddce4d59ec6fdca90c260df32fd44`, rather than deploying unreviewed local source.

## Acceptance still to verify on the public domain

- Passed: Vercel production deployment `dpl_FodmurErfthqLMrKYEbuoD1kD8Wm` is Ready and aliased to roamjs.com.
- Passed: the public signed-out session endpoint returns 401; `/admin/suggestions` redirects to `/account?next=inbox` before private content renders. `www.roamjs.com` redirects to the canonical domain.
- Pending: real owner sign-in returns to the owner inbox, survives reload and signs out correctly. The production sign-in email was requested at 02:15:12 UTC and Resend reported delivered; the recipient must complete verification.
- Pending: the approved ordinary test account can submit a controlled idea and cannot access the owner inbox.
- Pending: the owner retrieves the public-domain test submission and saves a review that survives reload.

Protected-preview acceptance is complete: branded confirmation reached Gmail Inbox with a correctly rendered logo, a new account verified its code and submitted an idea, the ordinary account was denied owner access, the owner email link/reload/sign-out checks passed, and a manual Gmail reply was verified and its follow-up persisted. These are separate from the public-domain checks above.

## Rollback

Disable `COMMUNITY_SUBMISSIONS_ENABLED` and remove the production public Supabase settings, then redeploy or restore the prior inactive production deployment. Restore the previous Site URL (`http://localhost:3000`) and remove only the newly added production callback if auth configuration must be rolled back.

The private legacy backup includes `restore.sql`. Restoring it would also restore the former permissive grants and lack of RLS; do not execute it automatically as a security rollback. Investigate the intended integration permissions before bringing those tables back.
