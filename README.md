# From The Ashes Fitness

Production: https://fromtheashes.fit

Repository: https://github.com/DelanoJo/fromtheashes

Private, mobile personal training with Mia Johnson in Denver, Colorado. The verified business email is `mia@fromtheashes.fit`.

## Architecture

Plain HTML, CSS, and JavaScript served by GitHub Pages from `main` at the repository root. No framework build, package install, or client-side router is required. Existing page URLs are retained; `denver-personal-trainer/index.html` serves the clean Denver guide route.

- `index.html`: homepage
- `denver-personal-trainer/index.html`: in-home training in Denver
- `services.html`, `programs.html`, `about.html`, `testimonials.html`, `contact.html`: core pages
- `css/styles.css`: shared design and responsive layouts
- `js/main.js`: navigation, session explorer, testimonials, and Formspree submission
- `js/analytics.js`: session attribution and conversion/click hooks
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

The contact form uses the existing Formspree endpoint. Confirm its notification recipient inside Formspree; changing the website email does not change that backend setting. No Google Analytics or Ads identifiers have been invented or enabled. See the launch guide for exactly which values are needed and how to connect the existing tracking hooks.

## Design

Existing Montserrat / Open Sans typography, colors, photography, and layout are retained. Updates support accessible mobile navigation, reduced motion, and readable form feedback.
