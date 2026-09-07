# SEO implementation and validation — September 7, 2026

## Follow-up: Google Analytics and Business Profile

The Google Analytics account/property and web stream `From The Ashes Fitness Website` were created under `mia.burkhardt@outlook.com`. The reporting time zone is Denver, currency is USD, industry is Beauty & Fitness, business size is 1–10 employees, and the selected objectives are lead generation and website traffic. Measurement ID `G-MJFKPDR0WN` is installed on the six canonical public pages. The existing `generate_lead`, consultation CTA, email, and phone click hooks now send through the direct Google tag.

The active NextDNS profile `8787f5` now allows the three GA4 domains required by this setup: `analytics.google.com`, `www.googletagmanager.com`, and `www.google-analytics.com`. The Google tag installation test succeeded, the tag and collection endpoints returned normally, and the GA4 Home dashboard reported live active users. Google notes that full property processing can take up to 48 hours.

The `generate_lead` event is sent only after Formspree confirms a successful consultation request. GA4's current Events screen can mark an event as a key event after it has been received; because no fake production inquiry was submitted, mark `generate_lead` with the star after the first real successful submission appears.

The Google Business Profile is managed by Mia's Google account and is fully customized pending Google's verification. Added ten truthful custom services, the website, a 666-character business description, and the site's main portrait stripped of location metadata. Google currently shows public phone `(720) 336-9665`, weekday hours 6 AM–6 PM, weekends closed, and Denver plus nearby areas; these pre-existing fields were not changed in this workflow and should be confirmed by the owner.

GA4 installation files changed in this follow-up: `index.html`, `denver-personal-trainer/index.html`, `programs.html`, `testimonials.html`, `about.html`, `contact.html`, `js/analytics.js`, `tests/browser-check.cjs`, `README.md`, `docs/SEO-LAUNCH.md`, and this report.

## Follow-up: navigation and training-page consolidation

The Services content is now merged into `/denver-personal-trainer/`, the main **Personal Training** navigation destination. Navigation is Home, Personal Training, Programs, Testimonials, About Mia, and Book Consultation. About Mia remains a separate biography page.

The combined page includes the session selector, all four group programs, session inclusions, mobile-training information, service-area guidance, and FAQs. Repeated descriptions were consolidated. Existing service links and structured-data URLs now point directly to this page; the sitemap lists six canonical indexable pages.

`/services.html` is an instant HTML redirect with a destination canonical and a fallback link. JavaScript retains query parameters and section bookmarks, including the old `#personal`, `#partner`, and `#group` anchors. This is a static-hosting redirect, not a server-level HTTP 301.

Follow-up checks: all six pages passed at 320, 375, 768, and 1440 pixels (24 viewport checks); the crawl checker passed six indexable pages, one redirect, and two noindexed utility pages. Navigation labels/active states, absence of links to the retired page, mobile menu, the moved session selector, group-program count, and a legacy campaign URL with `#partner` were checked in the browser. The form and attribution implementation is unchanged from the tests recorded below.

Changed in this follow-up: `index.html`, `denver-personal-trainer/index.html`, `services.html`, `programs.html`, `about.html`, `testimonials.html`, `contact.html`, `404.html`, `css/styles.css`, `sitemap.xml`, `scripts/check-seo.py`, `tests/browser-check.cjs`, `README.md`, `docs/SEO-LAUNCH.md`, and this report.

The sections below retain the original SEO release's audit and validation record.

## Result

The original static GitHub Pages architecture and visual design are retained. Added one substantial Denver landing page; updated homepage messaging, metadata, internal links, confirmed business email, crawl controls, social metadata, and truthful structured data. Added attribution and conversion hooks without installing a marketing framework or inventing account IDs.

## Verified locally

- Seven canonical indexable pages; two intentionally noindexed utility pages.
- 32 local HTTP targets: pages, styles, scripts, images, robots, and sitemap.
- Unique titles/descriptions, matching HTTPS non-www canonicals and social URLs.
- All JSON-LD parses; business email matches the owner-confirmed mailbox; no street address, coordinates, ratings, reviews, or prices introduced.
- No broken local assets, page links, or fragment links; no outdated Outlook address in public HTML.
- All seven public pages checked at 320, 375, 768, and 1440 pixels: **28 responsive checks passed**, with no horizontal overflow.
- All referenced images load; mobile navigation, Escape handling, partner deep link, session selector, FAQs, and navigation without JavaScript passed.
- JavaScript syntax and Git whitespace checks passed. No framework build exists.
- Form tests intercept third parties: valid field handling, rejected responses, network failures, duplicate submission guard, successful response reset, and exactly one lead event after success passed.
- Campaign fields survive navigation; arbitrary query fields are excluded; a new campaign clears prior click IDs; blocked storage has a safe current-page fallback.
- Email, phone, and consultation click hooks passed. Lead payloads exclude personal data and health-related service selection.
- Inspected phone screenshots of the homepage, Denver guide, and Contact page, plus the desktop homepage. Adjusted the longer homepage headline to keep the consultation button comfortably visible.

Test screenshots and machine-readable results for the final run are available locally at:

`/var/folders/gs/81kl72v91176rryr06zdjw4c0000gn/T/fta-seo-review-UTK1Wu/`

The tests use an isolated headless Chrome profile. They do not submit live inquiries, operate the user's browser session, verify actual mailbox delivery, or claim field Core Web Vitals scores. GitHub's production build/status and HTTP checks are separate publication verification.

## Image performance

Fifteen existing photographs now use resized WebP derivatives, with intrinsic dimensions. Offscreen images lazy-load; the homepage portrait stays eager with high fetch priority. Originals are unchanged.

- Headshot: 265,935 → 44,102 bytes.
- All fifteen photographs combined: 7,949,320 → 747,992 bytes (**91% smaller**).
- Programs: about 2.4 MB → 0.49 MB in referenced images.
- Testimonials: about 5.3 MB → 0.22 MB in referenced images.
- No new runtime package dependencies.

## Hosting and remaining owner tasks

GitHub Pages HTTPS enforcement was enabled and verified through GitHub's API; the existing hostname, branch, and source folder are unchanged. No DNS records were changed.

See [SEO-LAUNCH.md](SEO-LAUNCH.md) for exact Search Console TXT record fields, sitemap submission, service-area Business Profile guidance, Formspree notification checks, and analytics activation requirements. Needed account details: real GA4 Measurement ID, optional GTM container ID, and Ads conversion ID plus label if Ads conversion tracking is desired. No public business phone was supplied.

## Complete changed-file inventory

The following 36 files belong to this implementation. Pre-existing image deletions, untracked original photos, local tool settings, and historical PROJECT_SUMMARY.md are outside this change.

- `404.html`
- `README.md`
- `_config.yml`
- `about.html`
- `contact.html`
- `css/styles.css`
- `denver-personal-trainer/index.html`
- `docs/SEO-AUDIT.md`
- `docs/SEO-LAUNCH.md`
- `docs/SEO-RESULTS.md`
- `images/optimized/first-responder.webp`
- `images/optimized/functional-training.webp`
- `images/optimized/gai.webp`
- `images/optimized/hal-bruno.webp`
- `images/optimized/kat-swearingen.webp`
- `images/optimized/katerina.webp`
- `images/optimized/lori-mcgehee.webp`
- `images/optimized/max-gad.webp`
- `images/optimized/mia-johnson.webp`
- `images/optimized/miriam-goldstein.webp`
- `images/optimized/prenatal-strength.webp`
- `images/optimized/sandy-lowdermilk.webp`
- `images/optimized/senior-strength.webp`
- `images/optimized/wesley-mcgehee.webp`
- `images/optimized/women-on-weights.webp`
- `index.html`
- `js/analytics.js`
- `js/main.js`
- `print-review.html`
- `programs.html`
- `robots.txt`
- `scripts/check-seo.py`
- `services.html`
- `sitemap.xml`
- `testimonials.html`
- `tests/browser-check.cjs`
