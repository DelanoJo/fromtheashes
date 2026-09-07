// Run with Playwright on NODE_PATH, a local server, and optionally FTA_BASE_URL.
// Third-party form/captcha requests are intercepted: no real leads are submitted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.env.FTA_BASE_URL || 'http://127.0.0.1:4175';
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'fta-seo-review-'));
const routes = ['/', '/services.html', '/programs.html', '/about.html', '/testimonials.html', '/contact.html', '/denver-personal-trainer/'];

async function run() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        await context.route('https://www.google.com/recaptcha/api.js', route => route.fulfill({
            contentType: 'application/javascript',
            body: 'window.grecaptcha={getResponse:()=>"test-only-token",reset:()=>{}};'
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

        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(base + '/');
        assert.equal(await page.locator('.nav-menu').evaluate(el => el.inert), true);
        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
        assert.ok(await page.getByRole('link', { name: 'Programs', exact: true }).first().isVisible());
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
        await page.goto(base + '/services.html#partner');
        assert.equal(await page.locator('[data-session="partner"]').getAttribute('aria-pressed'), 'true');
        await page.locator('[data-session="group"]').click();
        assert.match(await page.locator('[data-session-title]').textContent(), /Big energy/);
        await page.goto(base + '/denver-personal-trainer/');
        await page.getByText('Do I need a home gym?', { exact: true }).click();
        assert.equal(await page.locator('details').first().getAttribute('open'), '');

        // Attribution survives navigation; unrelated/sensitive query fields never become form metadata.
        await page.goto(base + '/?utm_source=google&utm_medium=cpc&utm_campaign=denver_private&gclid=test-click&email=must-not-store@example.test');
        await page.getByRole('link', { name: 'Explore Session Types' }).click();
        await page.getByRole('link', { name: 'Book Your Complimentary Consultation', exact: true }).click();
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
        const leads = () => page.evaluate(() => (window.dataLayer || []).filter(e => e.event === 'generate_lead'));
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
        await page.waitForFunction(() => (window.dataLayer || []).some(e => e.event === 'generate_lead'));
        assert.equal((await leads()).length, 1);
        const lead = (await leads())[0];
        assert.deepEqual(Object.keys(lead).sort(), ['event', 'form_id', 'lead_type', 'page_path']);
        assert.ok(!JSON.stringify(lead).includes('medical-support'));
        assert.equal(await page.locator('#name').inputValue(), '');

        await page.evaluate(() => {
            document.addEventListener('click', event => event.preventDefault());
            document.querySelector('a[href^="mailto:"]').click();
            const phone = document.createElement('a'); phone.href = 'tel:+15550000000';
            document.body.append(phone); phone.click(); phone.remove();
            document.querySelector('a[href="#contact-form"]').click();
        });
        const events = await page.evaluate(() => window.dataLayer.map(e => e.event));
        for (const event of ['email_click', 'phone_click', 'consultation_cta_click']) assert.ok(events.includes(event));

        // A new campaign starts a clean attribution set, without mixing old click IDs.
        await page.goto(base + '/contact.html?utm_source=newsletter&utm_campaign=autumn');
        assert.equal(await page.locator('input[name="utm_source"]').inputValue(), 'newsletter');
        assert.equal(await page.locator('input[name="gclid"]').count(), 0);
        const blocked = await browser.newContext();
        await blocked.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } }));
        const blockedPage = await blocked.newPage();
        await blockedPage.goto(base + '/contact.html?utm_source=direct-test');
        assert.equal(await blockedPage.locator('input[name="utm_source"]').inputValue(), 'direct-test');
        await blocked.close();

        const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
        const plain = await noJS.newPage();
        for (const route of routes) {
            await plain.goto(base + route);
            assert.ok(await plain.locator('h1').isVisible());
            assert.ok(await plain.locator('.nav-menu').isVisible(), 'Navigation remains available without JavaScript');
        }
        await noJS.close();
        for (const route of ['/404.html', '/print-review.html']) {
            await page.goto(base + route);
            assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(artifacts, 'results.json'), JSON.stringify({ results, formTests: 'passed', runtimeErrors: errors }, null, 2));
        console.log(`PASS: ${results.length} responsive page checks; menu, session selector, FAQs, no-JS navigation, attribution, storage failure, click hooks, and confirmed lead success/failure checks. Screenshots: ${artifacts}`);
    } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
