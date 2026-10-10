# RoamJS authentication emails

These are Supabase-native HTML templates. Supabase substitutes the authentication values and sends through the configured Resend SMTP connection. A Resend dashboard template is not used by this flow. No new email rendering dependency is needed by the website.

| Supabase template | Source              | Subject                   |
| ----------------- | ------------------- | ------------------------- |
| Magic link or OTP | `magic-link.html`   | Your RoamJS sign-in code  |
| Confirm sign up   | `confirmation.html` | Confirm your RoamJS email |

The sign-in template retains the current subject. The signup subject explicitly describes verification. Both retain the existing `{{ .Token }}` and `{{ .ConfirmationURL }}` values. The code is the primary action; the optional link must be opened in the browser that requested it. No token is placed in the subject, preheader or image URL. No expiry duration is hardcoded; it remains governed by Supabase settings.

## Appearance and delivery

Use the current RoamJS mark, a text wordmark, a light single-column layout, a large selectable code and one blue authentication button. The text remains usable when a mail client blocks images. The 160px PNG is a raster version of `public/roamjs-logo.svg`, displayed at 40px; its OKLCH strokes are converted to sRGB for email compatibility. HTML uses inline styles, presentational tables, system fonts and a desktop Outlook width fallback. No JavaScript, forms, webfonts, image-only text, attachments, promotional links or tracking pixels are included. Resend open/click tracking stays disabled; authenticated sending and sender reputation still matter. Branding cannot guarantee inbox placement.

## Install after the PR asset is deployed

These files are proposed templates, not an automatic hosted configuration change. The previous real sign-in test used the earlier plain template. Its delivery result does not establish delivery or rendering of this branded version.

1. Merge and deploy the approved PR so `https://roamjs.com/email/roamjs-mark.png` is publicly reachable without preview authentication, returns `image/png`, and shows the current mark. Do not save the templates before this dependency is available.
2. Confirm organization `jevettuehuhgoesqqhxc` and project `uxihswugvmdwbbtgxtfl`. In Authentication → Emails, retain a copy of the current subject/body for Magic link or OTP and Confirm sign up before replacing either.
3. Paste the corresponding source HTML and subject from the table, preview it, then save each template. Saving is an external Supabase configuration update; merging this repository does not apply it. Preserve existing sender, SMTP credentials, callback allowlist, rate limits, and account/submission activation flags.
4. Request a controlled real sign-in email on the protected preview using the designated test inbox. Check code verification, same-browser link behavior, inbox/spam placement, images blocked and mobile rendering. Test signup confirmation separately with an approved new test identity. Do not put codes, links or session values in source or screenshots shared publicly.

If rendering or delivery regresses, restore the saved previous subject/body in Supabase. The image asset can remain; it does not affect authentication or grant access.

## Verification

Run `npm test -- tests/email-templates.test.ts` for auth placeholder preservation, bounded resources, image-independent content and PNG checks. Local desktop/mobile browser previews validate layout only; they do not prove Gmail/Outlook/Apple Mail rendering or real delivery. Hosted application, email and public activation acceptance remain in `docs/auth-acceptance.md`.

References: [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Resend deliverability guidance](https://resend.com/docs/dashboard/emails/deliverability).
