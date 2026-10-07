# Private inbox recovery fixture

Run `npm run test:inbox-recovery`. Playwright starts a test-only Vite server on port 3216 and renders the actual inbox, draft provider, AuthProvider and AccountForm. The API and Supabase client are simulated with synthetic suggestions/accounts; Next navigation has a minimal client route/history adapter. No fixture route or auth bypass is added to the Next.js application.

The expiry check leaves the mounted auth provider with its old user while the simulated server session expires. Clicking recovery must reload the provider, display the real sign-in form, and return to the inbox after code verification. A client-only URL change would fail this test. Synthetic session-expiry and auth-call markers live in fixture sessionStorage; private editor drafts still remain only in memory.

These checks prove component behavior, not hosted email delivery or a real owner session. The production route gate is covered separately by server-page tests and the signed-out browser test. Real authenticated preview acceptance still requires the designated owner to sign in.
