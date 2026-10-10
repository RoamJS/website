# RoamJS logo

The website uses the approved 41K symbol in `public/roamjs-logo.svg` and `app/icon.svg`. Keep their geometry and colors identical. The original PNG remains available at its existing URL.

The SVG has a 96 × 96 view box, six round-ended segments, 11-unit strokes, and circle radii of 9, 24, and 39. Both inner end-cap centers lie on the 46° diagonal (46° and 226°). The orange end cap and the lower end cap of the detached right blue segment also lie on the 46° ray. Left-facing ends share an aligned edge.

Colors use Tailwind's predefined sky-500 and orange-400 values, embedded in the assets so they render independently of site styles. The browser icon uses Next.js file-based SVG metadata, with a matching `app/favicon.ico` fallback for browsers without SVG favicon support. The ICO contains 16, 32, 48, 64, 128, and 256px versions rasterized from the same SVG.
