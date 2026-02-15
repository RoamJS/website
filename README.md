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

## Local Development

1. Install dependencies:
   - `npm install`
2. Create local env:
   - `cp .env.example .env.local`
3. Set env vars in `.env.local`:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/oauth?auth=true`
4. Run:
   - `npm run dev`

## Local OAuth Testing Strategy

1. In Google Cloud Console (OAuth client), add this redirect URI exactly:
   - `http://localhost:3000/oauth?auth=true`
2. Start this website locally on port `3000`.
3. In the RoamJS Google extension settings, set:
   - `OAuth API Origin (Advanced)` -> `http://localhost:3000`
4. Reload the extension.
5. Run login from Roam (browser or desktop).
6. Confirm local routes are hit:
   - callback: `http://localhost:3000/oauth?...`
   - desktop polling: `http://localhost:3000/oauth/session`
   - token exchange: `http://localhost:3000/google-auth`

## Notes

- `/oauth/session` uses edge cache storage when available, with in-memory fallback for local dev.
- If your deployment still shows intermittent polling misses under heavy scale, move session storage to a dedicated shared KV/Redis backend.
