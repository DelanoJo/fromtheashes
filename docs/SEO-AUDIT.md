# SEO audit — September 7, 2026

Recorded before implementation against the complete tracked-file inventory, local working tree, public pages, and GitHub Pages configuration.

## Architecture and production

- Plain HTML, shared CSS and JavaScript, no framework, package manifest, build script, or existing test suite.
- Repository: `DelanoJo/fromtheashes`; GitHub Pages publishes `main` from `/` using its legacy build pipeline. CNAME is `fromtheashes.fit`.
- Six public pages and `print-review.html`. The latter is an internal content-review document duplicating the marketing pages.
- Existing unrelated working-tree changes: three image deletions and several untracked photos, notes, and local tool settings. None is needed for this work.

## Findings before changes

| Area | Evidence | Action |
| --- | --- | --- |
| Titles and descriptions | All six public pages have distinct titles and descriptions, but none of their titles emphasizes Denver. Homepage title: “From The Ashes Fitness - Personal Training with Mia Johnson.” | Add distinct, natural service/location metadata. |
| Heading hierarchy | Six public pages each have one H1. Homepage H1 is a brand promise without service/location. Print review has ten H1s. Some content skips heading levels. | Descriptive homepage H1; retain brand line; repair meaningful heading skips. |
| Canonicals | No canonical tags. `/` and `/index.html` expose the homepage. | HTTPS non-www canonical URLs; use `/` in internal homepage links. |
| Redirects | HTTPS works. `https://www.fromtheashes.fit/` resolves to non-www. HTTP apex returns 200 rather than redirecting. GitHub API confirms `https_enforced: false`. | Enable HTTPS enforcement on the existing Pages site; verify redirects after publication. |
| Crawl controls | No robots directives, robots.txt, or sitemap.xml. Production robots.txt and sitemap.xml return 404. No accidental noindex found. | Allow public pages, publish sitemap, intentionally noindex the review document and error page. |
| Duplicate content | Print review is public and indexable, duplicating core site content. `/index.html` duplicates `/`. | Exclude review from sitemap, allow crawling so its noindex is read; canonicalize homepage. |
| Social and structured metadata | No Open Graph or JSON-LD. | Add page-specific social metadata using existing photography; truthful LocalBusiness, Person, and Service graph. |
| Internal links | All existing relative page/image targets resolve locally. Services and programs link to Contact. No Denver guide. | Add one substantive guide with contextual links and site-wide footer entry. |
| Images | All existing images have alt text, often only a name. No explicit intrinsic dimensions/lazy loading. Programs reference about 2.4 MB of images; testimonials about 5.3 MB; headshot is 266 KB. | Preserve subjects, improve relevant alt text, generate smaller WebP derivatives, add dimensions and loading hints. |
| Mobile | Headless Chrome at 375×812: testimonials document width 400px; fixed 300px content minimums and large card padding cause overflow. Other pages use fragile fixed grid minimums. | Fix minimum sizing across breakpoints, form spacing, and menu keyboard visibility; test at 320, 375, 768, and 1440px. |
| Motion and accessibility | Automatic testimonial rotation has no pause control. Offscreen mobile menu remains focusable. JS hides cards for reveal animation. | Remove automatic rotation, preserve controls, respect reduced motion, and keep content visible without JS. |
| Contact consistency | Outlook address appears in all six page footers, the Contact email block, and print-review.html (8 lines / 15 literal matches). README and untracked PROJECT_SUMMARY mention a domain-email placeholder, not a verified mailbox. No published business phone. | Ask owner for the domain email; never infer it or invent a phone/address. |
| Form/attribution | Formspree endpoint `/f/xdkqarwv` and public reCAPTCHA key are configured. No UTM retention, lead event, click hooks, GA4, GTM, or Ads IDs. Error strings enter innerHTML and messages disappear after five seconds. | Session attribution; confirmed-success lead event; safe persistent feedback; no real form submission during tests. |
| 404 | Unknown production path correctly returns 404 with generic GitHub content. | Add branded 404.html with absolute-root asset and navigation paths. |

## Important boundaries

LocalBusiness markup describes a service-area business without a street address. Schema.org permits this representation; Google's LocalBusiness rich-result rules require an address, so this implementation does not claim rich-result eligibility. No ratings, review schema, prices, invented locations, or private addresses will be added.

Search Console ownership tokens and analytics identifiers cannot be derived from public HTML. Supply the real values before activating those integrations. Search rankings and indexing are not guaranteed by technical changes.

## Primary references

- [Google: LocalBusiness structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Schema.org: LocalBusiness](https://schema.org/LocalBusiness)
- [Google: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: Verify Search Console ownership](https://support.google.com/webmasters/answer/9008080)
- [Google: generate_lead event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead)
- [GitHub: Custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
