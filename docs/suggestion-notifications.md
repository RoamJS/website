# Suggestion email notifications

Newly saved plugin and general app suggestions queue one private owner notification in the same transaction as the suggestion. Retries of an existing submission do not enqueue again. The email contains only the suggestion type and a link to the private owner inbox; the author's email and idea text remain in the inbox. A failed email does not undo the suggestion.

The immediate send runs after the submission response. A Vercel cron at 09:00 UTC daily retries due rows, up to 25 per invocation. The cron route requires `CRON_SECRET`; anonymous callers cannot run it. The private outbox and its database functions are inaccessible to anonymous and signed-in website clients. Resend receives a stable idempotency key per suggestion. Retryable failures back off, with at most five attempts. An uncertain send is not retried after 20 hours because Resend's idempotency window is limited. Failed rows remain for owner investigation; this design prefers a missed notice over a duplicate after the provider's deduplication window.

## Activation

This PR does not apply the migration or activate email sending. Confirm Supabase organization `jevettuehuhgoesqqhxc` and project `uxihswugvmdwbbtgxtfl`, then apply `20261014002133_suggestion_notification_outbox.sql`. The migration does not backfill older suggestions. In Vercel's **server-side production environment**, keep the existing `RESEND_API_KEY` and `SUPABASE_NEWSLETTER_SECRET_KEY` (a project-wide elevated secret), and set:

- `SUGGESTION_NOTIFICATION_TO` to the owner mailbox.
- `SUGGESTION_NOTIFICATION_START_AT` to the current UTC ISO timestamp at activation. Outbox rows saved earlier are marked skipped rather than emailed later.
- `CRON_SECRET` to a new random value of at least 16 characters. Vercel sends it as the cron Authorization bearer token.
- `SUGGESTION_NOTIFICATIONS_ENABLED=true` only after the migration, deployment, and recipient are verified.

Redeploy after changing Vercel variables. Test a new general idea and a plugin idea with a verified account, then confirm one email per idea in Resend and the private outbox. Retry the same `requestId` and confirm no second email. Check that an unauthorized GET to `/api/cron/suggestion-notifications` returns 401. Inspect private rows for `state='failed'` and investigate credentials/domain or provider errors without logging suggestion content.

To stop sending, set `SUGGESTION_NOTIFICATIONS_ENABLED=false` and redeploy. The outbox retains rows while disabled; advance `SUGGESTION_NOTIFICATION_START_AT` before re-enabling if those rows should not be sent. Vercel Cron is production-only, so protected previews exercise the immediate path but do not receive automatic retry invocations.
