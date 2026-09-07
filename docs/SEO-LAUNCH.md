# Search and conversion setup

## What's implemented

The existing GitHub Pages site remains plain static HTML/CSS/JavaScript. Six pages are intended for indexing: homepage, Personal Training, Programs, About Mia, Testimonials, and Contact. Each has a unique title and description, HTTPS non-www canonical, social metadata, and static JSON-LD. Personal Training is `/denver-personal-trainer/` and includes the session selector, group programs, session inclusions, mobile-training guide, and FAQs.

The homepage establishes the service, city, trainer, certification, experience, and background in visible text. The business email is `mia@fromtheashes.fit`, confirmed by the owner on September 7, 2026. No public phone or street address has been supplied. Do not add either without confirmation.

The review document and 404 page are intentionally `noindex, follow` and excluded from the sitemap. They remain crawlable so bots can read their directives. `/index.html` stays available for old links but canonicalizes to `/`. `/services.html` now redirects to `/denver-personal-trainer/`; all site links and Service schema point directly to the combined page, and the sitemap excludes the retired Services URL. Other `.html` routes are preserved. `robots.txt` permits public content and points to the sitemap. Jekyll excludes maintenance documents, scripts, tests, and internal artifacts through `_config.yml`.

GitHub Pages serves the Services redirect as a small HTML page: an instant meta refresh with the destination canonical and a fallback link. JavaScript forwards campaign parameters and section bookmarks (`#personal`, `#partner`, `#group`) to preserved anchors on the new page. This is not an HTTP 301. Google treats zero-second meta refreshes as permanent-redirect signals when server-side redirects are unavailable; see [Google's redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects). Keep this legacy entry point available for existing links.

LocalBusiness, Person, and Service markup uses only supported facts. LocalBusiness has `areaServed: Denver, Colorado` without `address`, `geo`, ratings, reviews, or price fields. This is valid Schema.org modeling of a service-area business, but Google's LocalBusiness rich-result eligibility requires an address; do not fabricate one to satisfy that test. No FAQ rich-result eligibility is claimed.

## Google Search Console: domain verification

1. Open [Search Console](https://search.google.com/search-console) using the Google account that should own the property. Add a **Domain** property and enter `fromtheashes.fit` without a protocol or path.
2. Choose TXT verification and copy the **complete, unique value Google displays**. It will look like `google-site-verification=...`; the actual token must come from that screen.
3. In the domain's authoritative DNS provider (historically Namecheap in the repository), add:

   | Field | Value |
   | --- | --- |
   | Record type | TXT |
   | Host/name | `@` (zone apex, `fromtheashes.fit`) |
   | Value/content | Paste Google's entire `google-site-verification=...` value unchanged |
   | TTL | Automatic/default |

   Add this as a separate record. Preserve existing TXT records, including SPF, DKIM and DMARC. If the nameservers point elsewhere, add the record at that provider instead. No DNS records were changed by this implementation.
4. Return to Search Console and select **Verify** after the DNS change is visible. Keep the TXT record after verification.
5. Submit `https://fromtheashes.fit/sitemap.xml` under **Sitemaps**. Use URL Inspection on the homepage and Denver guide, run a live test, and request indexing.
6. Review Page indexing and Google-selected canonical URLs after recrawling. Watch query/page performance for the intended services and city; technical readiness does not guarantee indexing or ranking.

Reference: [Google's verification instructions](https://support.google.com/webmasters/answer/9008080), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Local search / Google Business Profile

Use the real business name, website, confirmed email, actual services, and real operating service area consistently. If Mia has a [Google Business Profile](https://support.google.com/business/answer/9157481), confirm that it is configured as a service-area business with any private home address hidden. Verify actual service availability and phone details in the account. Do not create neighborhood listings, fabricated offices, or review ratings. Account verification and profile edits require access to the owner's Google account.

## Formspree readiness

The existing endpoint remains `https://formspree.io/f/xdkqarwv`. The existing public reCAPTCHA site key remains unchanged; its compact widget fits narrow screens. Native required-field validation and the AJAX handler remain in place. Feedback is persistent, accessible, and inserted as text. A missing/uncompleted verification widget, failed response, or network error never counts as a lead; an in-flight guard prevents simultaneous duplicate sends.

Confirm inside Formspree that this endpoint belongs to Mia, delivers to `mia@fromtheashes.fit`, has the intended spam protection, and accepts submissions from the production domain. The destination mailbox is not revealed by the public form action, and editing HTML does not change it. Confirm the reCAPTCHA key's allowed domains in the owner's Google reCAPTCHA settings. Automated checks intercept Formspree and reCAPTCHA; they do not create live inquiries. An owner should complete one real production inquiry and confirm receipt and spam filtering.

## Campaign attribution

`js/analytics.js` records an allowlist of `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `utm_source_platform`, `gclid`, `gbraid`, and `wbraid` in sessionStorage. It also records the canonical landing path and external referring origin, excluding full query strings and referrer paths. These values become hidden fields in the consultation form and are sent to Formspree with the inquiry.

Attribution survives same-tab navigation and refreshes. Direct/internal page visits preserve the current campaign. A visit containing new campaign values replaces the campaign as a set, preventing stale click IDs from being mixed into a later source. It ends with the browser tab/session. If sessionStorage is unavailable, current-page attribution still works, but it cannot persist between pages. Cross-device attribution is not provided. Campaign URLs should never contain personal or health information.

## Tracking hooks and identifiers needed

Google Analytics 4 is installed using web stream `From The Ashes Fitness Website` and measurement ID `G-MJFKPDR0WN`. Events send through the direct Google tag and remain available as `fta:analytics` CustomEvents for local integrations. Do not add a duplicate GTM forwarding rule for the same events. The GA4 account and property use Denver Time, US dollars, Beauty & Fitness, 1–10 employees, and the lead-generation and website-traffic objectives.

| Event | Trigger | Non-personal payload |
| --- | --- | --- |
| `generate_lead` | Formspree responds successfully to the consultation request | canonical `page_path`, `form_id: contact-form`, `lead_type: complimentary_consultation` |
| `consultation_cta_click` | A same-site contact/consultation link is activated | canonical `page_path`, `cta_location` |
| `email_click` | A `mailto:` link is activated | canonical `page_path`, `cta_location` |
| `phone_click` | A `tel:` link is activated | canonical `page_path`, `cta_location` |

There is no public telephone link because no real business phone was supplied. The hook will work when one is added. Clicks are not leads or completed calls. The form submit button itself does not trigger a conversion. Names, emails, telephone numbers, message text, health information, and the selected service are not included in these event payloads.

Google Analytics reporting is active. Supply these only if the advertising setup later requires them:

- **Google Tag Manager (optional):** a real `GTM-...` container ID only if the direct Google tag is intentionally replaced.
- **Google Ads (for direct Ads conversions):** the real `AW-...` conversion ID **and the conversion label** for the confirmed consultation-lead action.

Mark `generate_lead` as a GA4 key event after the first confirmed event appears. If Tag Manager is adopted later, replace the direct Google tag and configure equivalent Custom Event triggers; do not deploy both transports for the same events.

For Ads: either import the GA4 lead key event into Ads or use the actual Ads ID/label on the `generate_lead` trigger. Choose one primary conversion path. Review account auto-tagging/Conversion Linker settings and the site's consent requirements before enabling production collection. Hidden click IDs in a Formspree inquiry alone do not upload conversions to Google Ads. Do not assign an invented lead value or treat generic `form_submit` auto-measurement as a confirmed lead.

Use GA4 DebugView / GTM Preview and a controlled successful submission to verify one lead event, with none on validation errors or failed submissions. Reference: [Google's generate_lead definition](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead).

## Local checks and maintenance

No framework build is required. From the repository:

```sh
python3 -m http.server 4175 --bind 127.0.0.1
python3 scripts/check-seo.py http://127.0.0.1:4175
node --check js/main.js
node --check js/analytics.js
node tests/browser-check.cjs
git diff --check
```

The browser check requires Playwright on Node's module search path and an installed Chrome; those are QA tools, not site dependencies. It checks all six public pages at 320, 375, 768, and 1440 pixels, images, navigation with and without JavaScript, the legacy redirect, session selection, FAQs, attribution persistence, blocked storage, click hooks, and simulated success/failure/duplicate submission cases. Its screenshots/results are saved in a temporary directory printed when it finishes. The simple local HTTP server returns generic 404 responses; GitHub Pages uses the branded `404.html` for missing production paths.

Add future public pages to the sitemap and provide matching unique metadata and root-safe internal links. Keep entity IDs stable (`/#business` and `/#mia-johnson`). Reuse the same confirmed facts in visible content and JSON-LD. WebP files in `images/optimized/` are resized copies; original photographs are preserved.
