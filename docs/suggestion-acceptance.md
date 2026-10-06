# RJS-02 suggestion acceptance

Scope: general app ideas and plugin suggestions, private persistence, verified identity, validation, retries and shared limits. Owner review/replies and newsletter flows are RJS-03–05.

The additive `suggestion_persistence` migration is applied to project `uxihswugvmdwbbtgxtfl` in organization `jevettuehuhgoesqqhxc`. Existing tables/data are preserved. Private tables have RLS and no anonymous/authenticated table grants; only the authenticated RPC is callable. Anonymous execution, cross-account reading, and direct inserts are forbidden. The website uses its existing public key and user session, never an admin key.

Local validation: 59 unit/API/rendered-page tests, production build, lint, TypeScript, 14 default browser checks and one enabled-form Unicode/retry check pass. Browser sessions in local regression tests are fixtures.

Hosted service acceptance is in progress. Safe integration procedure: an authorized administrator creates two uniquely named synthetic `@example.invalid` Auth identities, explicitly confirmed for this test only. Admin-generated verification links produce genuine Auth sessions without sending email. Sessions are kept in ignored, mode-600 local files. Submit through the protected hosted website using those user sessions; retrieve only the test records through the authorized SQL connector; test retries, conflicts, validation, quota and unauthorized access. Revoke all test sessions, delete only test records/limits and disposable identities, then remove local session files. This does not prove delivery to an inbox or replace public email verification.

The real inbox sign-in/sign-out acceptance from RJS-01 remains pending. Custom SMTP is still needed before public sign-in. Production account/submission settings remain disabled; newsletter signup remains disabled everywhere for this work.

The existing empty `public.apps` and `public.oauth_clients` tables have RLS disabled and public grants. This is a pre-existing project advisory, left unchanged because their intended access rules are outside RJS-02. Review the [Supabase RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) before public rollout.
