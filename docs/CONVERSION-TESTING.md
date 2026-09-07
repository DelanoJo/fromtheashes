# Conversion testing and Google Ads handoff

## Current measurement

GA4 web stream: **From The Ashes Fitness Website**

Measurement ID: **G-MJFKPDR0WN**

| Event | Trigger | GA4 key event | Intended Ads role |
| --- | --- | --- | --- |
| `generate_lead` | Formspree returns a successful response | Yes | Primary |
| `click_phone` | Visitor activates a real `tel:` link | Yes | Secondary |
| `click_email` | Visitor activates a `mailto:` link | Yes | Secondary |
| `consultation_cta` | Visitor activates a same-site consultation/contact CTA | Yes | Secondary |

All four use once-per-event counting in GA4 and have no default monetary value. The code prevents duplicate in-flight form submissions. `generate_lead` is not called on button click, native validation failure, reCAPTCHA failure, rejected Formspree response, or network failure.

## Browser test: consent and page views

Use a private/incognito Chrome window so an old consent choice does not affect the test.

1. Open `https://fromtheashes.fit/?utm_source=qa&utm_medium=test&utm_campaign=conversion-check&utm_term=trainer&utm_content=consent-banner&gclid=test-click-id`.
2. Open Chrome DevTools → **Network**, enable **Preserve log**, and filter for `collect` or `gtag/js`.
3. Before choosing a banner option, confirm no `gtag/js` or `g/collect` request is made. In DevTools → **Application**, the site should have no `_ga` cookie and no `fta_campaign_session_v1` session-storage value.
4. Choose **Decline optional tracking**. Navigate around the site and open the consultation page. The site and form should work, but the Google tag should remain unloaded and the form should have no hidden `utm_*` or `gclid` inputs.
5. In the footer, select **Cookie preferences**, then **Accept optional tracking**. A `gtag/js?id=G-MJFKPDR0WN` request and a GA4 `collect` request should appear. The consent choice is stored as `fta_cookie_consent_v1=granted` in local storage.
6. Reload the original campaign URL after accepting. Navigate to Personal Training and then Contact. In DevTools → Elements, search for `utm_campaign`; the hidden input should contain `conversion-check`. Search for `gclid`; it should contain `test-click-id`. These fields are invisible in the page and should arrive with an accepted Formspree inquiry.
7. A normal page load may produce `page_view`, session, and enhanced-measurement events. It must not produce `generate_lead`, `click_phone`, `click_email`, or `consultation_cta` until the matching action occurs.

## Browser test: secondary events

Keep DevTools Network open with Preserve log enabled and optional tracking accepted. Filter GA4 collection requests by the event-name query parameter (`en`). You can also keep GA4 **Reports → Realtime** open in another tab; events can take a short time to appear.

- Select a consultation CTA. Expect one request containing `en=consultation_cta`. A page view on the destination is separate and expected.
- Select the phone number `(720) 336-9665`, then cancel the operating-system call prompt if you are only testing. Expect `en=click_phone`.
- Select `mia@fromtheashes.fit`, then close the new email draft if you are only testing. Expect `en=click_email`.

One click should create one custom event. GA4 Enhanced Measurement may also record a generic `click`; do not import that generic event as a conversion.

## Browser test: consultation lead

1. With optional tracking accepted, open `https://fromtheashes.fit/contact.html` and keep GA4 Realtime open separately.
2. First select **Request Complimentary Consultation** with required fields empty. Browser validation should stop the request; no Formspree request and no `generate_lead` event should occur.
3. For the live success test, submit a clearly labeled internal inquiry, such as “Conversion QA — please ignore,” using contact details that Mia controls. Complete reCAPTCHA. This sends a real Formspree inquiry and should only be done intentionally.
4. Confirm the website displays its success message and the form resets. In Network, expect exactly one Formspree success response and one GA4 request containing `en=generate_lead`. Confirm `generate_lead` appears once in GA4 Realtime/Key events.
5. Confirm the Formspree notification includes the expected hidden campaign fields when the visit started from the campaign URL above.

Rejected and network-failure paths are tested safely in the automated browser suite by intercepting Formspree; it never submits a live inquiry:

```sh
python3 -m http.server 4175 --bind 127.0.0.1
NODE_PATH=/Users/delanojohnson/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser-check.cjs
```

The suite verifies native validation, a 422 rejection, a network failure, an in-flight duplicate attempt, and a simulated success. Only the simulated success produces one `generate_lead`. It also verifies consent acceptance/decline, ordinary page loads, session attribution, unavailable storage, the three secondary events, and operation when the Google tag is blocked.

## Google Ads: remaining steps

The recommended path is to import GA4 key events rather than add a second Ads tag:

1. Create or select the real Google Ads account for From The Ashes Fitness.
2. In GA4 Admin → **Product links → Google Ads links**, link that Ads account. Keep personalized advertising disabled unless the business intentionally adopts it and the privacy/consent language is reviewed.
3. In Google Ads → **Goals → Conversions**, create conversion actions by importing the four GA4 key events.
4. Configure `generate_lead` as **Primary**, with the lead category and **One** conversion per ad interaction. Leave its value unset until the business chooses a defensible lead value.
5. Configure `click_phone`, `click_email`, and `consultation_cta` as **Secondary** actions used for observation, not bidding. These are intent signals, not confirmed leads.
6. Enable Google Ads auto-tagging so ad visits receive a `gclid`. Test an ad-preview URL, accept optional tracking, navigate to Contact, and confirm the hidden `gclid` input survives.
7. Confirm there is only one Primary consultation conversion. Do not also deploy a direct `AW-...` form-success tag unless the GA4 import is deliberately replaced.

No Google Ads conversion ID or conversion label is currently installed. They are not required when importing GA4 key events. If the business instead chooses direct Google Ads conversion tracking, provide the real `AW-...` conversion ID and the confirmed-lead conversion label; remove or exclude the GA4-imported duplicate before enabling it.
