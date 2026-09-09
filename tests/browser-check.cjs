// Run with Playwright on NODE_PATH, a local server, and optionally FTA_BASE_URL.
// Third-party form/captcha requests are intercepted: no real leads are submitted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.env.FTA_BASE_URL || 'http://127.0.0.1:4175';
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'fta-seo-review-'));
const routes = ['/', '/programs.html', '/about.html', '/testimonials.html', '/contact.html', '/privacy.html', '/denver-personal-trainer/', '/corporate-fitness/'];

async function run() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        await context.addInitScript(() => {
            try { localStorage.setItem('fta_cookie_consent_v1', 'granted'); } catch (_) {}
        });
        await context.route('https://www.google.com/recaptcha/api.js', route => route.fulfill({
            contentType: 'application/javascript',
            body: 'window.grecaptcha={getResponse:()=>"test-only-token",reset:()=>{}};'
        }));
        await context.route('https://www.googletagmanager.com/gtag/js*', route => route.fulfill({
            contentType: 'application/javascript',
            body: '/* Test fixture: the inline gtag queue is sufficient for event assertions. */'
        }));
        await context.route('https://formspree.io/**', route => route.abort());
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const results = [];
        for (const width of [320, 375, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            for (const route of routes) {
                const response = await page.goto(base + route);
                assert.equal(response.status(), 200);
                await page.evaluate(() => document.fonts.ready);
                const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
                assert.ok(dimensions.scroll <= width + 1, `${route} overflows at ${width}px: ${dimensions.scroll}`);
                assert.equal(await page.locator('h1').count(), 1);
                assert.ok(await page.locator('h1').isVisible());
                const homeLink = page.getByRole('link', { name: 'From The Ashes Fitness home', exact: true });
                assert.equal(await homeLink.count(), 1, 'The brand link has one clear accessible name');
                assert.equal(await homeLink.getAttribute('href'), '/');
                assert.equal(await homeLink.getByRole('img').count(), 0, 'The logo does not repeat the link announcement');
                assert.equal(await page.getByRole('navigation', { name: 'Primary', exact: true }).count(), 1);
                assert.deepEqual(await page.locator('.nav-menu a').allTextContents(), ['Home', 'Personal Training', 'Programs', 'Group Fitness', 'Testimonials', 'About Mia', 'Book Consultation']);
                assert.equal(await page.locator('.nav-menu a[aria-current="page"]').count(), route === '/privacy.html' ? 0 : 1);
                await page.evaluate(async () => {
                    for (let y = 0; y < document.body.scrollHeight; y += 700) {
                        window.scrollTo(0, y);
                        await new Promise(resolve => setTimeout(resolve, 30));
                    }
                    await Promise.all([...document.images].map(image => image.decode().catch(() => null)));
                    window.scrollTo(0, 0);
                });
                assert.equal(await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).length), 0, `Broken image on ${route}`);
                if ((width === 375 && ['/', '/contact.html', '/denver-personal-trainer/'].includes(route)) || (width === 1440 && route === '/')) {
                    await page.screenshot({ path: path.join(artifacts, `${route.replace(/\W+/g, '-') || 'home'}-${width}.png`) });
                }
                results.push({ route, width, horizontalOverflow: false });
            }
        }

        // The wider wordmark must fit at both sides of the navigation breakpoint.
        for (const width of [969, 1024, 1060, 1061, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(base + '/');
            await page.evaluate(() => document.fonts.ready);
            const home = await page.locator('.nav-brand').boundingBox();
            const menu = width <= 1060 ? page.locator('.nav-toggle') : page.locator('.nav-menu');
            const menuBox = await menu.boundingBox();
            assert.ok(home.x + home.width <= menuBox.x, `Header controls overlap at ${width}px`);
            assert.equal(await page.locator('.nav-menu').evaluate(el => el.inert), width <= 1060);
        }
        await page.goto(base + '/');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'From The Ashes Fitness home');
        assert.notEqual(await page.locator(':focus').evaluate(el => getComputedStyle(el).outlineStyle), 'none');

        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(base + '/');
        assert.equal(await page.locator('.nav-menu').evaluate(el => el.inert), true);
        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
        assert.ok(await page.getByRole('link', { name: 'Programs', exact: true }).first().isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
        await page.goto(base + '/services.html?utm_source=legacy&utm_campaign=training#partner');
        await page.waitForURL(base + '/denver-personal-trainer/?utm_source=legacy&utm_campaign=training#partner');
        assert.equal(await page.locator('[data-session="partner"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-session="group"]').click();
        assert.match(await page.locator('[data-session-title]').textContent(), /Big energy/);
        await page.goto(base + '/denver-personal-trainer/');
        await page.getByText('Do I need a home gym?', { exact: true }).click();
        assert.equal(await page.locator('details').first().getAttribute('open'), '');

        // Attribution survives navigation; unrelated/sensitive query fields never become form metadata.
        await page.goto(base + '/?utm_source=google&utm_medium=cpc&utm_campaign=denver_private&gclid=test-click&email=must-not-store@example.test');
        await page.getByRole('link', { name: 'Explore Session Types' }).click();
        await page.locator('.page-header').getByRole('link', { name: 'Book a Complimentary Consultation', exact: true }).click();
        assert.equal(await page.locator('input[name="utm_campaign"]').inputValue(), 'denver_private');
        assert.equal(await page.locator('input[name="gclid"]').inputValue(), 'test-click');
        assert.equal(await page.locator('input[name="landing_page"]').inputValue(), '/');
        assert.ok(!(await page.evaluate(() => sessionStorage.getItem('fta_campaign_session_v1'))).includes('must-not-store'));

        let sends = 0;
        let body;
        let mode = 'failure';
        let release;
        await page.route('https://formspree.io/f/xdkqarwv', async route => {
            sends += 1;
            body = route.request().postData();
            if (mode === 'delayed') await new Promise(resolve => { release = resolve; });
            if (mode === 'network') return route.abort();
            await route.fulfill({ status: mode === 'failure' ? 422 : 200, contentType: 'application/json',
                body: mode === 'failure' ? JSON.stringify({ errors: [{ message: '<img src=x onerror=alert(1)> Test rejection' }] }) : '{"ok":true}' });
        });
        const tracked = eventName => page.evaluate(name => (window.dataLayer || []).filter(item =>
            item?.event === name || (item?.[0] === 'event' && item?.[1] === name)
        ).map(item => item?.event ? item : { event: item[1], ...item[2] }), eventName);
        const leads = () => tracked('generate_lead');
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        assert.equal(sends, 0, 'Native validation must prevent requests');
        await page.locator('#name').fill('Test Only');
        await page.locator('#email').fill('test@example.test');
        await page.locator('#phone').fill('5550000000');
        await page.locator('#service').selectOption('medical-support');
        await page.locator('#message').fill('Private test details, never analytics');
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('Test rejection'));
        assert.equal((await leads()).length, 0, 'Rejected request is not a lead');
        assert.equal(await page.locator('#form-message img').count(), 0, 'Error feedback must escape HTML');
        assert.match(body, /name="utm_campaign"[\s\S]*denver_private/);
        mode = 'network';
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('could not confirm'));
        assert.equal((await leads()).length, 0);
        mode = 'delayed';
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await page.waitForFunction(() => document.querySelector('#contact-form').getAttribute('aria-busy') === 'true');
        await page.evaluate(() => document.getElementById('contact-form').dispatchEvent(new Event('submit', { cancelable: true })));
        while (!release) await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal(sends, 3, 'In-flight double submission is blocked');
        release();
        await page.waitForFunction(() => (window.dataLayer || []).some(item =>
            item?.event === 'generate_lead' || (item?.[0] === 'event' && item?.[1] === 'generate_lead')
        ));
        assert.equal((await leads()).length, 1);
        const lead = (await leads())[0];
        assert.deepEqual(Object.keys(lead).sort(), ['event', 'form_id', 'lead_type', 'page_path']);
        assert.ok(!JSON.stringify(lead).includes('medical-support'));
        assert.equal(await page.locator('#name').inputValue(), '');

        await page.evaluate(() => {
            document.addEventListener('click', event => event.preventDefault());
            document.querySelector('a[href^="mailto:"]').click();
            document.querySelector('a[href^="tel:"]').click();
            document.querySelector('a[href="#contact-form"]').click();
        });
        const events = await page.evaluate(() => window.dataLayer.map(item => item?.event || (item?.[0] === 'event' ? item[1] : undefined)));
        for (const event of ['click_email', 'click_phone', 'consultation_cta']) assert.ok(events.includes(event));

        // Corporate CTAs use the same protected form and success-only lead event.
        await page.goto(base + '/corporate-fitness/?utm_source=outreach&utm_medium=email&utm_campaign=corporate_pilot&utm_content=dtc');
        await page.getByRole('link', { name: 'Plan a Group Session', exact: true }).click();
        assert.equal(await page.locator('#service').inputValue(), 'corporate-fitness');
        assert.ok(await page.locator('#group-inquiry-note').isVisible());
        assert.equal(await page.locator('h1').textContent(), 'Plan a Group Fitness Session');
        assert.equal(await page.locator('input[name="utm_campaign"]').inputValue(), 'corporate_pilot');
        assert.equal(await page.locator('input[name="landing_page"]').inputValue(), '/corporate-fitness/');
        await page.locator('#service').selectOption('individual-training');
        assert.ok(await page.locator('#group-inquiry-note').isHidden());
        assert.match(await page.locator('h1').textContent(), /Personal Training Consultation/);
        await page.locator('#service').selectOption('corporate-fitness');
        await page.locator('#name').fill('Corporate QA');
        await page.locator('#email').fill('qa@example.test');
        await page.locator('#phone').fill('5550000000');
        await page.locator('#message').fill('Private organization and participant details — never send to Analytics');
        const corporateSends = sends;
        mode = 'failure';
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await page.waitForFunction(() => document.querySelector('#form-message').textContent.includes('Test rejection'));
        assert.equal((await leads()).length, 0);
        mode = 'success';
        await page.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await page.waitForFunction(() => document.querySelector('#form-message').classList.contains('success'));
        assert.equal(sends, corporateSends + 2);
        assert.equal((await leads()).length, 1);
        assert.match(body, /name="service"[\s\S]*corporate-fitness/);
        assert.match(body, /name="utm_campaign"[\s\S]*corporate_pilot/);
        assert.deepEqual(Object.keys((await leads())[0]).sort(), ['event', 'form_id', 'lead_type', 'page_path']);
        assert.equal(await page.locator('#name').inputValue(), '');
        assert.ok(await page.locator('#group-inquiry-note').isHidden());
        await page.goto(base + '/contact.html?service=unrecognized');
        assert.equal(await page.locator('#service').inputValue(), '');
        assert.ok(await page.locator('#group-inquiry-note').isHidden());

        // A new campaign starts a clean attribution set, without mixing old click IDs.
        await page.goto(base + '/contact.html?utm_source=newsletter&utm_campaign=autumn');
        assert.equal(await page.locator('input[name="utm_source"]').inputValue(), 'newsletter');
        assert.equal(await page.locator('input[name="gclid"]').count(), 0);
        const blocked = await browser.newContext();
        const blockedErrors = [];
        await blocked.addInitScript(() => {
            try { localStorage.setItem('fta_cookie_consent_v1', 'granted'); } catch (_) {}
            Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } });
        });
        await blocked.route('https://www.googletagmanager.com/**', route => route.abort());
        const blockedPage = await blocked.newPage();
        blockedPage.on('pageerror', error => blockedErrors.push(error.message));
        await blockedPage.goto(base + '/contact.html?utm_source=direct-test');
        assert.equal(await blockedPage.locator('input[name="utm_source"]').inputValue(), 'direct-test');
        assert.ok(await blockedPage.locator('h1').isVisible(), 'Site works when the Google tag is blocked');
        assert.deepEqual(blockedErrors, []);
        await blocked.close();

        // Optional tracking stays off until consent and remains off after decline.
        const declineContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
        let declinedTagLoads = 0;
        await declineContext.route('https://www.googletagmanager.com/**', route => {
            declinedTagLoads += 1;
            return route.abort();
        });
        const declinePage = await declineContext.newPage();
        await declinePage.goto(base + '/?utm_source=declined&utm_campaign=private');
        assert.ok(await declinePage.locator('.cookie-consent').isVisible());
        assert.equal(declinedTagLoads, 0, 'Google tag does not load before consent');
        assert.equal(await declinePage.evaluate(() => sessionStorage.getItem('fta_campaign_session_v1')), null);
        await declinePage.getByRole('button', { name: 'Decline optional tracking' }).click();
        assert.equal(await declinePage.evaluate(() => localStorage.getItem('fta_cookie_consent_v1')), 'denied');
        await declinePage.goto(base + '/contact.html');
        assert.equal(await declinePage.locator('input[name="utm_source"]').count(), 0);
        assert.equal(declinedTagLoads, 0);
        await declinePage.getByText('Cookie preferences', { exact: true }).click();
        assert.ok(await declinePage.locator('.cookie-consent').isVisible());
        await declineContext.close();

        // Consent loads GA4 once and enables invisible, session-scoped attribution.
        const acceptContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
        await acceptContext.route('https://www.google.com/recaptcha/api.js', route => route.fulfill({
            contentType: 'application/javascript',
            body: 'window.grecaptcha={getResponse:()=>"test-only-token",reset:()=>{}};'
        }));
        let acceptedTagLoads = 0;
        await acceptContext.route('https://www.googletagmanager.com/gtag/js*', route => {
            acceptedTagLoads += 1;
            return route.fulfill({ contentType: 'application/javascript', body: '/* Consent test fixture. */' });
        });
        const acceptPage = await acceptContext.newPage();
        await acceptPage.goto(base + '/?utm_source=google&utm_campaign=consent-test&gclid=accepted-click');
        assert.equal(acceptedTagLoads, 0);
        await acceptPage.screenshot({ path: path.join(artifacts, 'cookie-consent-375.png') });
        await acceptPage.getByRole('button', { name: 'Accept optional tracking' }).click();
        await acceptPage.locator('script[data-fta-analytics="true"]').waitFor({ state: 'attached' });
        assert.equal(acceptedTagLoads, 1);
        assert.equal(await acceptPage.evaluate(() => localStorage.getItem('fta_cookie_consent_v1')), 'granted');
        assert.match(await acceptPage.evaluate(() => sessionStorage.getItem('fta_campaign_session_v1')), /consent-test/);
        assert.equal((await acceptPage.evaluate(() => (window.dataLayer || []).filter(item =>
            item?.event === 'generate_lead' || (item?.[0] === 'event' && item?.[1] === 'generate_lead')
        ).length)), 0, 'Ordinary page load is not a conversion');
        await acceptPage.goto(base + '/contact.html');
        assert.equal(await acceptPage.locator('input[name="utm_campaign"]').inputValue(), 'consent-test');

        // Withdrawal is immediate in this tab AND every other open same-origin tab.
        const secondTab = await acceptContext.newPage();
        await secondTab.goto(base + '/contact.html?utm_source=google&utm_campaign=second-tab');
        await secondTab.evaluate(() => { document.cookie = '_ga_test=fixture; Path=/'; });
        await acceptPage.getByText('Cookie preferences', { exact: true }).click();
        await acceptPage.getByRole('button', { name: 'Decline optional tracking' }).click();
        for (const tab of [acceptPage, secondTab]) {
            await tab.waitForFunction(() => window['ga-disable-G-MJFKPDR0WN'] === true);
            assert.equal(await tab.evaluate(() => window.FTAConsent.hasAnalyticsConsent()), false);
            assert.equal(await tab.evaluate(() => sessionStorage.getItem('fta_campaign_session_v1')), null);
            assert.equal(await tab.locator('[data-fta-attribution]').count(), 0);
            assert.ok(!(await tab.evaluate(() => document.cookie)).includes('_ga'));
            const countEvents = () => tab.evaluate(() => window.dataLayer.filter(item => item[0] === 'event').length);
            const before = await countEvents();
            await tab.evaluate(() => window.FTAAnalytics.track('consultation_cta'));
            assert.equal(await countEvents(), before, 'No events may be queued after withdrawal');
            const state = await tab.evaluate(() => [...window.dataLayer].reverse().find(item => item[0] === 'consent')[2]);
            assert.equal(state.analytics_storage, 'denied');
            assert.equal(state.ad_storage, 'denied');
        }
        const loadsBeforeReaccept = acceptedTagLoads;
        await secondTab.route('https://formspree.io/f/xdkqarwv', route => route.fulfill({
            status: 200, contentType: 'application/json', body: '{"ok":true}'
        }));
        await secondTab.locator('#name').fill('Internal QA');
        await secondTab.locator('#email').fill('qa@example.test');
        await secondTab.locator('#phone').fill('5550000000');
        await secondTab.locator('#service').selectOption('medical-support');
        await secondTab.locator('#message').fill('Internal QA — intercepted, never sent.');
        await secondTab.getByRole('button', { name: 'Request Complimentary Consultation' }).click();
        await secondTab.waitForFunction(() => document.querySelector('#form-message').classList.contains('success'));
        assert.equal(await secondTab.evaluate(() => window.dataLayer.filter(item => item[0] === 'event' && item[1] === 'generate_lead').length), 0,
            'A successful form after cross-tab withdrawal remains functional but untracked');
        await secondTab.getByText('Cookie preferences', { exact: true }).click();
        await secondTab.getByRole('button', { name: 'Accept optional tracking' }).click();
        await acceptPage.waitForFunction(() => window['ga-disable-G-MJFKPDR0WN'] === false);
        assert.equal(acceptedTagLoads, loadsBeforeReaccept, 'Reaccepting does not load another tag');
        await secondTab.evaluate(() => localStorage.removeItem('fta_cookie_consent_v1'));
        await acceptPage.waitForFunction(() => window['ga-disable-G-MJFKPDR0WN'] === true);
        assert.ok(await acceptPage.locator('.cookie-consent').isVisible(), 'Clearing the choice defaults to denied');
        await acceptContext.close();

        // Large-text accessibility: grid contents must not force horizontal scrolling.
        await page.setViewportSize({ width: 320, height: 812 });
        for (const route of routes) {
            await page.goto(base + route);
            await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Large text overflows on ${route}`);
        }

        const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
        const plain = await noJS.newPage();
        for (const route of routes) {
            await plain.goto(base + route);
            assert.ok(await plain.locator('h1').isVisible());
            assert.ok(await plain.locator('.nav-menu').isVisible(), 'Navigation remains available without JavaScript');
        }
        await plain.goto(base + '/services.html');
        await plain.waitForURL(base + '/denver-personal-trainer/');
        await noJS.close();
        for (const route of ['/404.html', '/print-review.html']) {
            await page.goto(base + route);
            assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify({ results, formTests: 'passed', runtimeErrors: errors }, null, 2));
        console.log(`PASS: ${results.length} responsive page checks; consent accept/decline, tracking-blocker fallback, menu, session selector, FAQs, no-JS navigation, attribution, storage failure, click hooks, and confirmed lead success/failure checks. Screenshots: ${artifacts}`);
    } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
