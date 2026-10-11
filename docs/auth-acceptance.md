# RJS-01: Supabase Auth acceptance

Current rollout: branded templates are installed and real protected-preview acceptance is complete. Public account configuration and remaining production checks are recorded in [production activation](production-activation.md). The dated sections below retain the evidence and limitations at each earlier stage.

Initial implementation: [website PR #5](https://github.com/RoamJS/website/pull/5). Email delivery configuration and hosted checks updated October 10, 2026. Public account activation remains separate.

## Initial preview configuration — October 6, 2026

- Existing organization `jevettuehuhgoesqqhxc`, project `uxihswugvmdwbbtgxtfl` (RoamJS). Project was healthy when checked.
- Supabase Email provider and Confirm email are enabled; anonymous sign-in is disabled.
- Confirmation and returning sign-in emails include a one-time code and a same-browser link.
- Added exact redirect URLs `http://localhost:3215/auth/callback` and `https://roamjs-website-git-codex-supabase-auth-michael-gartner-projects.vercel.app/auth/callback`.
- Vercel project `roamjs-website`, branch `codex/supabase-auth`: public Supabase URL/key configured for this preview branch only. `COMMUNITY_SUBMISSIONS_ENABLED=false`.
- [Hosted account preview](https://roamjs-website-git-codex-supabase-auth-michael-gartner-projects.vercel.app/account) renders its email form. Vercel preview protection still applies. An authenticated Vercel CLI request to `/api/auth/session` returned 401 with the expected sign-in message.
- Production environment values, Supabase Site URL, existing extension OAuth credentials, database tables, and newsletter delivery were not changed.

## Initial local verification

47 unit tests and 14 Playwright checks pass, plus production build, TypeScript, lint, and diff checks. Tests cover verified-email enforcement against the server-returned user, rejection of editable metadata as proof, anonymous/unverified sessions, callback errors, same-origin redirects, refreshed cookies and cache headers, email-send failure/invalid-code feedback, resend throttling, session reload/sign-out, mobile tap targets, and analytics exclusion. Public catalog regressions also pass.

Auth responses in browser tests are mocked. These tests do not prove real email delivery or a real hosted authenticated session.

## Resend delivery configuration — October 10, 2026

- Organization/project confirmed before configuration: `jevettuehuhgoesqqhxc` / `uxihswugvmdwbbtgxtfl`.
- Resend verifies `roamjs.com` and `auth.roamjs.com` for sending. The owner selected `noreply@roamjs.com`; the sender name is RoamJS. Open and click tracking are disabled.
- Required DKIM and return-path authentication records were published in the existing RoamJS Route 53 zone. Return paths use dedicated child records; existing root mailbox routing was preserved. DMARC monitoring policies (`p=none`) were added where no policy existed.
- Supabase custom SMTP is enabled with `smtp.resend.com`, port 465 and username `resend`. The owner entered the API key directly; it is not in this repository. Vercel stores its Resend key as a non-exportable secret.
- Protected previews now have the public Supabase URL and publishable key. The current inbox preview was rebuilt, and its exact `/auth/callback` is allowlisted. Production public Supabase settings were not activated.
- Current preview: https://roamjs-website-git-codex-inbox-370a64-michael-gartner-projects.vercel.app/account?next=inbox. Source is the PR #8 merge-ready snapshot `efefa6c1e7fbf06b10aefd21f5575d806aa7c76e`.

## Real delivery evidence

The website requested a sign-in email through Supabase on October 10 at 22:15:56 UTC. Resend reported **delivered** for “Your RoamJS sign-in code.” This is a real provider event, not an intercepted browser request. It confirms recipient-server acceptance; placement in the recipient's inbox or spam folder still requires the recipient's check. No newsletter contacts or broadcasts were created.

The signed-out preview session endpoint returned 401, and the owner route redirected to `/account?next=inbox` before rendering inbox controls. The account page displayed the verification-code form after the real email request.

The recipient supplied the received code, which was entered in the prepared browser without recording it in this repository. The real hosted checks passed:

- Code verification returned to `/admin/suggestions`, and the verified owner saw the private inbox, filters, pagination and genuine empty state.
- A full reload retained the authenticated owner session and re-rendered the server-protected inbox.
- The account page showed “You’re signed in” and “Your email is verified.”
- Local sign-out removed the session. Navigating directly to `/admin/suggestions` then redirected to `/account?next=inbox` and showed the sign-in form with no inbox controls.

The browser client blocked direct top-level navigation to the JSON session endpoint. A signed-in `/api/auth/session` status is therefore not separately claimed; authenticated owner access was established through the server-protected page and its live inbox fetch instead. The initial signed-out endpoint check returned 401.

This proves real owner code sign-in and session recovery on the protected preview. It does not prove a new-account flow, a completed same-browser email-link flow, public production activation or manual reply delivery.

## Still required to close RJS-01

1. Exercise the same-browser email-link flow and a new-account/unverified-email boundary with controlled test identities.
2. Capture an authenticated session endpoint result through a supported request context if separate API proof is needed.
3. Before public activation, configure the intended production site URL/callback and public environment values, then repeat sign-in acceptance on the public domain. Public suggestion submission acceptance is tracked separately under [RJS-02](suggestion-acceptance.md).

Account creation never grants newsletter consent. Suggestion submission, public community activation and campaigns remain separate checks.

## Branded email templates proposed in PR #14

`supabase/email-templates/magic-link.html` and `confirmation.html` add the current RoamJS mark, a selectable code and one authentication button. The existing authentication placeholders are preserved. The source, deployment prerequisite, installation and rollback steps are in [the template guide](../supabase/email-templates/README.md).

The new email-compatible PNG must be deployed at `https://roamjs.com/email/roamjs-mark.png` before the hosted templates are saved. The branded templates are not yet applied in Supabase, and no branded test email has been sent. The successful October 10 email/session checks above used the earlier plain template. Local layout and template invariant checks do not establish branded-email delivery, inbox placement or mail-client rendering.
