# RJS-02 suggestion acceptance

Scope: general app ideas and plugin suggestions, private persistence, verified identity, validation, retries and shared limits. Owner review/replies and newsletter flows are RJS-03–05.

The additive `suggestion_persistence`, `pin_community_rate_limit_timezone`, and `align_suggestion_whitespace_validation` migrations are applied to project `uxihswugvmdwbbtgxtfl` in organization `jevettuehuhgoesqqhxc`. Existing tables/data are preserved. Private tables have RLS and no anonymous/authenticated table grants; only the authenticated RPC is callable. Anonymous execution, cross-account reading, and direct inserts are forbidden. The website uses its existing public key and user session, never an admin key.

Local validation after the newsletter scaffold cleanup: 60 unit/API/rendered-page tests, production build, lint and TypeScript pass. The earlier suggestion implementation also passed 14 default browser checks and one enabled-form Unicode/retry check; those browser checks were not rerun for the cleanup. Browser sessions in local regression tests are fixtures.

The unused Neon dependency, schema, migration script and newsletter write code are removed. Newsletter signup is unconditionally unavailable, including with obsolete environment flags present. The subscription endpoint returns 503 without accessing persistence. Supabase newsletter persistence, explicit consent and unsubscribe handling remain RJS-04/05 work.

## Hosted evidence (October 6, 2026)

Protected preview: https://roamjs-website-git-codex-sugges-50e40d-michael-gartner-projects.vercel.app. Tested deployment `roamjs-website-2i2n5q4p8-michael-gartner-projects.vercel.app`, revision `186a99a`. The exact branch callback is allowlisted alongside the existing localhost/auth preview callbacks. Preview protection remains enabled. Branch-only configuration enables suggestions and keeps newsletter signup disabled.

| Type             | Saved receipt                          | Retrieved fields                                                                 | Server timestamp (UTC)     |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------- | -------------------------- |
| General app idea | `4c29eb0a-5c1a-4abb-af01-2423f5d7da95` | Null plugin; matching title/body; synthetic account ID and verified email        | 2026-10-06 22:42:07.419831 |
| SmartBlocks idea | `67144ef5-27ac-42ed-9dec-4b331c8f7e84` | `smartblocks`; matching title/body; same synthetic account ID and verified email | 2026-10-06 22:42:10.160121 |

Both went through the deployed website's `/api/suggestions` with genuine Supabase user sessions, returned 201, and were retrieved using the authorized SQL connector. A retry returned 200 with the same receipt; changed content under the same UUID returned 409; an invalid plugin and short emoji title returned 400. Eight direct shared-limit attempts plus the two new ideas exhausted the same ten-attempt budget; the next new idea returned 429 while a retry still returned its original receipt. A second account using the same UUID received its own distinct record rather than the first account's receipt. Anonymous RPC execution failed with `42501`; direct unverified RPC failed with `RW403`; the website rejected that genuine signed-in unverified account with 403. Signed-out requests returned 401 and other-origin requests 403.

Database grants were queried directly: anonymous/signed-in SELECT and signed-in INSERT on `private.suggestions` are false; anonymous RPC EXECUTE is false; authenticated RPC EXECUTE is true. Attempts to retrieve private records through the Data API failed. Service-outage and missing-receipt behavior are covered by API/browser regression tests; no artificial production outage was introduced.

After retrieval, all three synthetic records and their rate-limit rows were removed. Both sessions were globally revoked (204); both disposable Auth users were removed; follow-up SQL confirmed zero remaining test users and suggestion rows. The ignored session file was deleted. Nonsensitive run evidence remains in `local/suggestion-hosted-evidence.json`.

The final hosted SQL regression `supabase/tests/suggestion-security.sql` passes quota reset, Unicode boundaries and trimmed-whitespace parity, duplicate receipts without quota consumption, conflicting payloads, plugin/unverified validation and private grants. It also tests half-hour and quarter-hour caller timezones. The rate-limit function pins UTC because [PostgREST permits a caller-selected timezone](https://docs.postgrest.org/en/stable/references/api/preferences.html#timezone); changing timezone cannot shift or reset the shared budget. SQL test identities and data are transactionally rolled back.

## Repeat safely

Run `SUGGESTION_TEST_DEPLOYMENT=https://… node --env-file=.env.local scripts/verify-suggestions.mjs` only against the protected preview with two disposable, verified sessions in the ignored `local/test-session.private.json` file (`{accounts:[{email,session},{email,session}],run}`). The script restricts identities to `@example.invalid`, consumes their shared quota, and writes only a nonsensitive receipt report. Use fresh identities for each run and perform the cleanup below.

Safe integration procedure: an authorized administrator creates two uniquely named synthetic `@example.invalid` Auth identities, explicitly confirmed for this test only. Admin-generated verification links produce genuine Auth sessions without sending email. Sessions are kept in ignored, mode-600 local files. Submit through the protected hosted website using those user sessions; retrieve only the test records through the authorized SQL connector; test retries, conflicts, validation, quota and unauthorized access. Revoke all test sessions, delete only test records/limits and disposable identities, then remove local session files. This does not prove delivery to an inbox or replace public email verification.

The real inbox sign-in/sign-out acceptance from RJS-01 remains pending. Custom SMTP is still needed before public sign-in. Production account/submission settings remain disabled; newsletter signup remains disabled everywhere for this work.

The existing empty `public.apps` and `public.oauth_clients` tables have RLS disabled and public grants. This is a pre-existing project advisory, left unchanged because their intended access rules are outside RJS-02. Review the [Supabase RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) before public rollout.
