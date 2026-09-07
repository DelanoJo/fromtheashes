# Website fonts

Locally served Latin variable-font subsets from Google Fonts, downloaded September 7, 2026. Both are distributed under the SIL Open Font License; the original license notices are included alongside the fonts.

- Montserrat, weights 400–700: https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2
- Open Sans, weights 400–600: https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2

The shared stylesheet uses `font-display: optional`, and public pages preload both fonts. On a slow first visit the browser may keep its fallback font to avoid a late layout shift. The privacy banner always uses a system font so its dimensions do not change when brand fonts load.
