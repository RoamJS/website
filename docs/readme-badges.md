# README badges

Static SVG badges hosted by the RoamJS website. The images contain no scripts, external fonts, remote images, or tracking. Each README supplies the destination link.

After deployment, use:

```markdown
[![Ask DeepWiki](https://roamjs.com/badges/deepwiki.svg)](https://deepwiki.com/RoamJS/dev-on-load)
[![Join Slack](https://roamjs.com/badges/slack.svg)](https://roamresearch.slack.com/archives/C016N2B66JU)
[![roamjs.com](https://roamjs.com/badges/website.svg)](https://roamjs.com/)
```

Replace the DeepWiki destination with the corresponding repository. Keep the three image URLs unchanged. These are custom badges. The DeepWiki badge embeds the official icon declared by https://deepwiki.com/: https://deepwiki.com/icon.png?d5f24a100c40bf32 (verified October 9, 2026). Its white mark is preserved; the badge label uses a neutral dark background rather than an unverified brand blue. Slack uses its original multicolor PNG from https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png, with #4A154B aubergine documented at https://api.slack.com/authentication/sign-in-with-slack. The website badge embeds the existing `public/roamjs-logo.png` as a data URL so the image needs no additional request.

The files live in `public/badges/` and are served as public static assets by Next.js and Vercel. They do not use the authentication proxy or a third-party badge endpoint. Deploy the website and verify all three public URLs return SVG images before updating extension READMEs.

No custom cache headers are configured for badges. Next.js public assets default to `Cache-Control: public, max-age=0` (browser revalidation); Vercel serves static deployment assets through its CDN. These files are part of the website deployment, not Vercel Blob. Verify the production headers after deployment.
