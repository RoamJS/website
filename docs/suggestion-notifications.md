# Suggestion email notifications

When a verified user saves a new plugin or general app suggestion, the website schedules one best-effort owner email after returning the saved receipt. A repeated submission with the same request ID does not schedule another email. The message contains only the suggestion type and a link to the private owner inbox; the author's email and idea text stay in that inbox.

Email delivery does not affect whether the suggestion is saved. If Resend is unavailable, the owner can still review the suggestion in the private inbox, but there is no automatic retry or notification backlog. A generic server error marker records a delivery failure without logging the recipient, suggestion content, or provider response. The stable Resend idempotency key limits duplicates if the same saved suggestion is sent again within the provider's window.

## Activation

This PR does not enable notifications. No new Supabase migration, elevated database key, cron secret, or scheduled worker is needed. In Vercel's **server-side production environment**, keep the existing `RESEND_API_KEY` and set:

- `SUGGESTION_NOTIFICATION_TO` to the owner mailbox.
- `SUGGESTION_NOTIFICATIONS_ENABLED=true` only after the recipient and sending key are verified.

Redeploy after changing Vercel variables. Submit a new general app idea and a plugin idea from a verified account, then confirm one email per idea in Resend and the owner mailbox. Repeat a submission with the same request ID and confirm no additional email. Notifications begin only for submissions made while enabled; older suggestions are not emailed. To stop sending, set `SUGGESTION_NOTIFICATIONS_ENABLED=false` and redeploy. Check the private inbox directly if an email is missing.
