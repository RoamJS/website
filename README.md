# RoamJS website

The RoamJS plugin library, built with Next.js, React, Tailwind CSS, and shadcn/ui. The existing Google/Dropbox OAuth handlers and release-download rewrites are preserved.

## Run locally

```sh
npm ci
npm run dev -- --port 3215
```

Browse `http://localhost:3215`. The catalog, documentation, theme toggle, and public pages work without secrets. Community forms show an explicit unavailable state until authentication and persistence are configured. They never fake a successful submission or save contact details in local storage.

## Supabase Auth (RJS-01)

Use the existing [RoamJS/Cybrarian organization](https://supabase.com/dashboard/org/jevettuehuhgoesqqhxc) and [RoamJS project](https://supabase.com/dashboard/project/uxihswugvmdwbbtgxtfl). Do not create a replacement project. Cybrarian shares the organization, not this project ID.

1. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` to `https://uxihswugvmdwbbtgxtfl.supabase.co` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key. No service-role key is needed for sign-in. Set the same public values in the branch's Vercel preview environment and rebuild.
2. In Supabase Authentication, keep Email enabled, Confirm email enabled, and anonymous sign-in disabled. Configure an authenticated SMTP sender before opening sign-in to the public. Supabase's built-in sender is restricted to project-team addresses and has very low limits.
3. Add exact callback URLs to Authentication → URL Configuration: `http://localhost:3215/auth/callback` and the branch preview's `https://…/auth/callback`. Avoid a wildcard for all Vercel previews. Keep the production site URL and redirect changes separate until launch approval.
4. Open `/account`. Request an email and enter its verification code, or open its link in the same browser that requested it. The configured confirmation and magic-link emails use [`supabase/templates/sign-in.html`](supabase/templates/sign-in.html), with subject “Your RoamJS sign-in code”. Both templates include `{{ .Token }}` and `{{ .ConfirmationURL }}`. The SSR client uses PKCE for links and the callback exchanges the single-use code. A custom token-hash URL requires its own handler and is not interchangeable.
5. Test a new signup, returning sign-in, expired link/code, reload, and sign-out. `/api/auth/session` returns only `{ "verified": true }` for a server-verified email; absent sessions return 401 and signed-in unverified/anonymous identities return 403. Responses cannot be cached.

Identity is revalidated against Supabase on the server. Only `email_confirmed_at` from the returned user is accepted; editable user metadata is not verification. Account controls are excluded from analytics, and public catalog pages remain cacheable. Existing extension OAuth routes keep their original behavior.

### Suggestions and mailing list (RJS-02 onward)

Suggestions use the authenticated Supabase client and `public.submit_suggestion` RPC. Apply `supabase/migrations/20261006223313_suggestion_persistence.sql` to the existing project after inspecting its schema. The additive migration creates private suggestion, plugin-allowlist, and shared hourly-limit tables with RLS and no anonymous or authenticated table access. Public RPC wrappers use invoker permissions; narrowly granted private functions derive the current account and verified email from Auth, validate the plugin/text, and atomically deduplicate and save. No secret or service-role key is needed by the website.

`COMMUNITY_SUBMISSIONS_ENABLED=true` enables suggestions in the chosen environment. It defaults false. `NEWSLETTER_SIGNUP_ENABLED` independently controls the newsletter; keep it false until RJS-04/05. The old Neon database code/schema/script are retained only for that disabled newsletter scaffold; suggestions never use `DATABASE_URL`. Do not apply `db/001-community.sql` to Supabase or provision Neon for this work.

Each account has ten successful new submissions/shared-limit attempts per UTC clock hour. Retries with the same UUID and exact content return the original receipt even after the quota is exhausted; changed content under that UUID receives 409. Requests from concurrent server instances share the database budget. Invalid input and failed transactions do not consume quota. The form preserves text and request identity on service failure and uses the same trimmed Unicode-code-point limits as the API. See [hosted suggestion acceptance](docs/suggestion-acceptance.md) for integration proof and remaining inbox checks.

Account creation and suggestions never subscribe someone to announcements. Newsletter consent stays separate. No campaign sender is connected. RJS-04/05 cover email-only signup, delivery, unsubscribe links, consent synchronization, changed emails, and account deletion. Auth emails are transactional sign-in messages, not newsletter consent.

## Content and provenance

- `content/plugins-source.json`: public GitHub README snapshots with original URLs and blob SHAs.
- `content/plugins-index.json`: metadata only, so full README text is not shipped in the catalog's client bundle.
- `lib/catalog.ts`: edited descriptions and categories.
- Depot metadata is a historical October 4, 2026 snapshot, not live counts or active-user statistics. It includes 20 entries attributed to RoamJS. Three additional public repositories are included without inferred download counts or Depot availability.
- Private repositories and the deprecated Static Site extension are excluded. Plugin reviews and ratings are not part of the website.
- Markdown renders without raw HTML. Images use their original source URLs. Some upstream guides link to further docs or videos, so the README is not necessarily the complete manual.

Refresh public README snapshots with `node scripts/refresh-documentation.mjs` (requires authenticated `gh`). The script refuses private repositories and writes only after every read succeeds. Download data is updated separately from a verified Depot snapshot. Review the diff before publishing refreshed content.

## Verify

```sh
npm test
NEXT_PUBLIC_POSTHOG_ENABLED=true npm run build
npm run typecheck
npm run lint
npm run start -- --port 3215
# In another terminal, with the production server running:
npm run test:browser
```

Tests cover search/category composition, provenance, safe relative documentation links, email verification, request boundaries, service failures, rate limits, consent separation, and mobile/browser flows. API tests mock Supabase Auth/RPC calls; hosted persistence and permission proof is recorded separately. They do not prove inbox delivery. Browser auth tests mock Supabase responses and do not send email. The auth browser suite also needs the public Supabase URL/key in `.env.local`; requests that would send email are mocked. Set `NEXT_PUBLIC_POSTHOG_ENABLED=true` when building for the analytics suite, whose ingestion requests are intercepted. Default browser tests assume community persistence is disabled and run against `http://localhost:3215`.

## Deployment

The existing `RoamJS/website` repository deploys through Vercel. Deploy this branch as a preview before promoting it to the production domain. Preserve all existing OAuth environment variables and the `/releases/:path*` rewrite in `vercel.json`. Deploying the catalog does not require enabling accounts or submissions.

For suggestion form browser regression checks, build with `COMMUNITY_SUBMISSIONS_ENABLED=true NEWSLETTER_SIGNUP_ENABLED=false`, start the server, then run `SUGGESTION_BROWSER_ENABLED=true npx playwright test suggestions.spec.ts`. This suite uses a mocked browser session/API and sends no email; it checks Unicode lengths, preserved text, retry UUIDs, and consent separation.
