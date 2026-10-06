# RJS-01: Supabase Auth acceptance

Checked October 6, 2026. Implementation is in [website PR #5](https://github.com/RoamJS/website/pull/5). This is a preview, not a production account launch.

## Configured

- Existing organization `jevettuehuhgoesqqhxc`, project `uxihswugvmdwbbtgxtfl` (RoamJS). Project was healthy when checked.
- Supabase Email provider and Confirm email are enabled; anonymous sign-in is disabled.
- Confirmation and returning sign-in emails include a one-time code and a same-browser link.
- Added exact redirect URLs `http://localhost:3215/auth/callback` and `https://roamjs-website-git-codex-supabase-auth-michael-gartner-projects.vercel.app/auth/callback`.
- Vercel project `roamjs-website`, branch `codex/supabase-auth`: public Supabase URL/key configured for this preview branch only. `COMMUNITY_SUBMISSIONS_ENABLED=false`.
- [Hosted account preview](https://roamjs-website-git-codex-supabase-auth-michael-gartner-projects.vercel.app/account) renders its email form. Vercel preview protection still applies. An authenticated Vercel CLI request to `/api/auth/session` returned 401 with the expected sign-in message.
- Production environment values, Supabase Site URL, existing extension OAuth credentials, database tables, and newsletter delivery were not changed.

## Verified locally

47 unit tests and 14 Playwright checks pass, plus production build, TypeScript, lint, and diff checks. Tests cover verified-email enforcement against the server-returned user, rejection of editable metadata as proof, anonymous/unverified sessions, callback errors, same-origin redirects, refreshed cookies and cache headers, email-send failure/invalid-code feedback, resend throttling, session reload/sign-out, mobile tap targets, and analytics exclusion. Public catalog regressions also pass.

Auth responses in browser tests are mocked. These tests do not prove real email delivery or a real hosted authenticated session.

## Still required to close RJS-01

1. Select a test inbox belonging to a project-team member, or configure a custom SMTP sender first. The current Supabase sender is the built-in test service.
2. Request an email from the hosted preview; verify the new-account and returning-account flows, reload, sign-out, and `/api/auth/session` returning 200 only while verified and signed in.
3. Exercise hosted unverified-email rejection using a controlled test identity. Local API tests already cover this boundary, but hosted acceptance remains outstanding.
4. Configure and prove SMTP delivery to an ordinary non-team visitor before public account launch. Do not disable email confirmation to bypass delivery limitations.

Suggestion persistence is RJS-02 and remains disabled. Account creation never grants newsletter consent. No account or email was created/sent during this acceptance pass.
