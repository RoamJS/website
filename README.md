# RoamJS Website

This Next.js app hosts the OAuth callback and token exchange endpoints used by the RoamJS Google extension.

## Endpoints

- `GET /oauth`
  - OAuth callback page.
  - For browser flows, it posts auth params back to the opener.
  - For desktop/poll flows, it also registers callback completion to `/oauth/session`.
- `GET /oauth/session?session=...`
  - Poll endpoint for desktop-safe OAuth handoff.
- `POST /oauth/session`
  - Callback registration endpoint for `{ session, code, state, error }`.
- `POST /google-auth`
  - Exchanges Google auth code or refresh token for access token data.

## Development

1. Install dependencies:
   - `npm install`
2. Create local env:
   - `cp .env.example .env.local`
3. Set required env vars in `.env.local`:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
4. Run:
   - `npm run dev`

## Notes

- `/oauth/session` uses edge cache storage when available, with in-memory fallback.
- If polling misses under heavy scale, move session storage to dedicated shared KV/Redis.

