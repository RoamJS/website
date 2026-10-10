# README badges

The static badges are served at `/badges/website.svg`, `/badges/deepwiki.svg`, and
`/badges/slack.svg`. Existing README image URLs remain valid.

All three badges are 22px high. Visible icons begin at x = 8 and are approximately
16px high, retaining their original proportions. Labels share the same font and
vertical placement, with an approximately 8px gap after the visible icon and 11px
of right padding. Text starts at different x positions because the symbols have
different widths. Badge widths are rounded to whole pixels.

## Artwork

- RoamJS uses the six vector paths from `public/roamjs-logo.svg`, the approved 41K
  logo. A tight viewBox removes the surrounding padding without changing its
  geometry or colors.
- DeepWiki uses the vector path from the maintainer-supplied
  `DEVIN_AVATAR_SQUARE_WHITE.svg`. Its background rectangle is omitted and the
  symbol is white. The path geometry is unchanged. This replaces the previous
  filtered PNG favicon, so the symbol remains sharp when enlarged.
- Slack retains the existing embedded PNG artwork. Only label spacing and badge
  width change.

The badges contain no scripts, external image dependencies, or external fonts.
Labels use the Arial/Helvetica/sans-serif system font stack, so small differences
in text metrics across platforms are expected.
