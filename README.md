# RoamJS website

The RoamJS plugin library, built with Next.js, React, Tailwind CSS, and shadcn/ui. The existing Google/Dropbox OAuth handlers and release-download rewrites are preserved.

## Run locally

```sh
npm ci
npm run dev -- --port 3215
```

Browse `http://localhost:3215`. The catalog, documentation, theme toggle, and public pages work without secrets. Community forms show an explicit unavailable state until Clerk and persistence are configured. They never fake a successful submission or save contact details in local storage.

## Enable Clerk and community submissions

1. Create a Clerk development application. Enable email sign-in and verification; configure its origins for localhost and your Vercel preview.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Use your deployment platform's secret settings for hosted values.
3. Create a Neon Postgres database and set `DATABASE_URL`. This uses Neon's HTTP driver; an arbitrary non-Neon PostgreSQL host is not interchangeable without changing the driver.
4. Apply the schema: `node --env-file=.env.local scripts/migrate.mjs`. This is explicit and is never run at build time.
5. Restart/rebuild. Sign in, verify the primary email, submit an idea, and inspect the `suggestions` table. Test a separate opt-in and opt-out on `/updates`.
6. Before public launch, use Clerk production keys and configure the production domain. Test an actual signed-in submission and persisted record on the deployed domain.

The server reads identity and email from Clerk, never from client-provided fields. Writes enforce same-origin requests, bounded JSON bodies, validated fields, verified primary email, and a shared database rate limit of ten attempts per user per hour. Suggestion retries reuse a request ID and deduplicate by user/request ID. Rate limiting is basic spam mitigation, not a guarantee against abuse. Clerk bot protection can also be enabled in the dashboard. No public endpoint exposes suggestions or email addresses. OAuth routes are excluded from the new Clerk proxy matcher.

### Mailing list

Clerk provides identity, not an email campaign service. The `subscriptions` table stores explicit consent separately from suggestions, including opt-outs and consent timestamps. `/updates` supports subscribing and unsubscribing; opt-out is not rate limited. Account creation and suggestions never opt people in.

**No campaign provider is connected and no emails are sent by this implementation.** Before sending any announcements, connect an email provider, synchronize consent and suppressions, add email-native unsubscribe links, and test delivery. The sender must query current subscribed users at send time, deduplicate email addresses, and respect later opt-outs. Do not use an old export as a send list. Account deletion and changed primary email synchronization also need to be implemented before mail delivery is enabled. Suggestions may be reviewed in the database; an owner dashboard and follow-up sender are future work.

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
npm run build
npm run typecheck
npm run lint
npm run start -- --port 3215
# In another terminal, with the production server running:
npm run test:browser
```

Tests cover search/category composition, provenance, safe relative documentation links, email verification, request boundaries, service failures, rate limits, consent separation, and mobile/browser flows. API tests use mocked Clerk and database calls; they do not prove live Clerk or Neon connectivity. Browser tests assume community services are unconfigured and run against `http://localhost:3215`.

## Deployment

The existing `RoamJS/website` repository deploys through Vercel. Deploy this branch as a preview before promoting it to the production domain. Preserve all existing OAuth environment variables and the `/releases/:path*` rewrite in `vercel.json`. Deploying the catalog does not require enabling accounts or submissions.
