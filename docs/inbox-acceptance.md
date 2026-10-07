# RJS-03 private suggestion inbox

The owner workspace is `/admin/suggestions`. It supports search, status filters, 25-item pages, full suggestion/contact details, statuses (new, reviewing, planned, completed), private follow-up notes, and manual email replies. Opening an email draft does not record a sent message. The owner explicitly checks “I sent a reply” and saves to record the server timestamp. This is a manual follow-up log, not proof of email delivery.

## Access and data

Migration `20261007020345_suggestion_owner_inbox.sql` extends the existing private suggestions table and creates `private.website_owners`. It is applied to the existing project `uxihswugvmdwbbtgxtfl` in organization `jevettuehuhgoesqqhxc`. The user-designated owner email was configured privately, outside source control. No email was sent and no real user account was created.

An administrator manages the exact lowercase verified-email allowlist using the authorized database connection. It is intentionally empty on fresh migration; populate it separately after confirming the intended owner. Membership follows the current verified email in `auth.users`: changing away from that email removes access. No user metadata claim grants ownership. Never expose owner-list writes to website clients. Remove the allowlist row to revoke access.

The application verifies the session using Supabase Auth. Database functions independently derive the current verified, non-anonymous email and check the private owner table on every read/write. Public wrappers are security invoker; narrowly scoped private functions use security definer with an empty search path to access tables that clients cannot access directly. Both tables have RLS and no anonymous/authenticated table grants. Authenticated function execution alone does not grant access to data. No service-role key is used by the website.

All API responses are private/no-store. The route is excluded by the analytics public-path allowlist, private UI elements are marked to prevent capture, and search terms/contact details are not stored in browser storage. Private pages are noindex and carry session-refresh/no-store handling. Updates use a version check to reject stale writes; failed saves preserve the draft.

## Verification

- 76 unit/API tests cover verified identity, owner denial, private caching, bounded filters/pagination, CSRF, invalid/spoofed writes, stale/missing rows, unavailable storage, missing receipts, and safe mailto headers.
- Hosted `supabase/tests/inbox-security.sql` passed before and after applying the migration. Actual Postgres `authenticated`/`anon` roles prove owner list/update, explicit contact timestamp, conflicts, validation, denied direct table access, denied self-promotion, and denied ordinary/unverified/anonymous accounts. Synthetic Auth users, owner grants, and suggestions are transactionally rolled back.
- Four browser checks passed; production build, lint and typecheck passed. Browser tests use API fixtures for the owner workflow, failed-save retry, follow-up checkbox, search/filter/pagination, denied/signed-out states, and mobile width. They do not establish real owner email delivery.
- Existing `public.apps` and `public.oauth_clients` RLS/GraphQL advisories are unchanged and remain outside this task. RLS-without-policies information notices on private tables reflect deliberate default-deny table access.

## Hosted preview

Preview: https://roamjs-website-git-codex-sugges-81c6b1-michael-gartner-projects.vercel.app/admin/suggestions. Branch-only Supabase public configuration is present; public suggestion submission remains disabled on this branch. The exact branch `/auth/callback` URL is allowlisted. The protected deployed API returned 401 with “Please sign in to continue” when checked without an account session. Vercel checks passed.

## User acceptance

Sign in with the designated verified owner email on the protected preview, then open `/admin/suggestions`. Review a real idea, change its status, open a reply in your mail app, and record follow-up only after sending. Real inbox sign-in still depends on the RJS-01 email acceptance/custom SMTP work. Production sign-in and public community activation are not part of this PR. Newsletter signup remains unavailable.
