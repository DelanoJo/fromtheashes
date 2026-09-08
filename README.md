# From The Ashes Fitness

Production: https://fromtheashes.fit

Repository: https://github.com/DelanoJo/fromtheashes

Private, mobile personal training with Mia Johnson in Denver, Colorado. The verified business email is `mia@fromtheashes.fit`.

## Architecture

Plain HTML, CSS, and JavaScript served by GitHub Pages from `main` at the repository root. No framework build, package install, or client-side router is required. Existing page URLs are retained; `denver-personal-trainer/index.html` serves the clean Denver guide route.

- `index.html`: homepage
- `denver-personal-trainer/index.html`: in-home training in Denver
- `programs.html`, `about.html`, `testimonials.html`, `contact.html`: other core pages
- `services.html`: legacy redirect to the combined personal training page, preserving campaign parameters and section bookmarks when JavaScript is available
- `css/styles.css`: shared design and responsive layouts
- `js/main.js`: navigation, session explorer, testimonials, and Formspree submission
- `js/consent.js`: cookie preferences and consent-first Google tag loading
- `js/analytics.js`: consent-aware session attribution and conversion/click hooks
- `privacy.html`: analytics, form, attribution, and cookie disclosures
- `images/optimized/`: smaller WebP copies of the existing photos
- `robots.txt`, `sitemap.xml`: crawl controls and canonical page inventory
- `404.html`: branded error page; GitHub Pages preserves HTTP 404 status
- `print-review.html`: internal review document, intentionally noindexed
- `_config.yml`: excludes maintenance material from GitHub Pages output

## Check locally

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

In another terminal:

```sh
python3 scripts/check-seo.py http://127.0.0.1:4175
node --check js/main.js
node --check js/analytics.js
git diff --check
```

`node tests/browser-check.cjs` additionally checks mobile/desktop layouts and form/attribution behavior. It requires Playwright available to Node and an installed Chrome. These are development-only tools. All test form requests are intercepted.

## Publish and maintain

Commit the intended site files and push to `origin/main`; monitor the GitHub Pages build before declaring the changes live. Keep `CNAME` set to `fromtheashes.fit`. Use HTTPS and the non-www domain consistently. New indexable pages need unique metadata, an HTML link from an existing page, and a sitemap entry.

Do not publish private addresses, local tool settings, certification documents, or unrelated files. The original photos remain unchanged; use the optimized copies in public page markup.

## Search and measurement

- [Pre-change SEO audit](docs/SEO-AUDIT.md)
- [Search Console, Formspree, attribution, and analytics setup](docs/SEO-LAUNCH.md)
- [Conversion browser testing and Google Ads handoff](docs/CONVERSION-TESTING.md)

The contact form uses the existing Formspree endpoint. Confirm its notification recipient inside Formspree; changing the website email does not change that backend setting. Google Analytics 4 is installed using measurement ID `G-MJFKPDR0WN`; the confirmed lead and click hooks send directly through the Google tag after consent. `generate_lead` is configured as a key event without a default monetary value. No Google Ads conversion ID or label has been added.

## Design

Existing Montserrat / Open Sans typography, colors, photography, and layout are retained. Updates support accessible mobile navigation, reduced motion, and readable form feedback.

The approved Open Wing logo is `images/from-the-ashes-logo.svg`; the separate mark is `images/open-wing-icon.svg`. The brand links use `aria-label="From The Ashes Fitness home"` and a decorative image to avoid duplicate announcements. Keep the navigation breakpoint at 1060px in both CSS and JavaScript when adjusting the header.

Favicons use `images/open-wing-favicon.svg`, with PNG/ICO fallbacks and an Apple touch icon. The pale favicon tile preserves contrast on light and dark browser tabs. The header's lettering is outlined vector artwork; the retained wing is embedded as a web-sized raster image.
