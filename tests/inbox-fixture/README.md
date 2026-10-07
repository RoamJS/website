# Private inbox recovery fixture

Run `npm run test:inbox-recovery`. Playwright starts a test-only Vite server on port 3216, renders the actual inbox and draft provider, and intercepts the API with synthetic suggestions. A minimal auth and link adapter models account changes and client route/history transitions. No fixture route or auth bypass is added to the Next.js application.

These checks prove component behavior, not hosted email delivery or a real owner session. The production route gate is covered separately by server-page tests and the signed-out browser test. Real authenticated preview acceptance still requires the designated owner to sign in.
