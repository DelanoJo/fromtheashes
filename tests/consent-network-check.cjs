// Uses the real Google tag with debug traffic, but never submits a form or lead.
// Run against a local server or FTA_BASE_URL after deployment.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.FTA_BASE_URL || 'http://127.0.0.1:4175';

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const context = await browser.newContext();
        await context.addInitScript(() => {
            window.dataLayer = [];
            window.dataLayer.push(['set', { debug_mode: true }]);
        });
        const requests = [];
        context.on('request', request => {
            if (/google-analytics\.com\/g\/collect/.test(request.url())) requests.push(request.url());
        });
        const first = await context.newPage();
        await first.goto(base + '/');
        assert.equal(requests.length, 0);
        await first.getByRole('button', { name: 'Accept optional tracking' }).click();
        await first.waitForRequest(/google-analytics\.com\/g\/collect/, { timeout: 20000 });
        const second = await context.newPage();
        await second.goto(base + '/denver-personal-trainer/');
        await second.waitForFunction(() => !!window.google_tag_manager);
        await second.waitForTimeout(7500); // Drain page views collected while consent was granted.
        await first.getByText('Cookie preferences', { exact: true }).click();
        // Clicking a footer link scrolls the page while consent is still granted.
        await first.waitForTimeout(7500); // Drain that legitimate pre-withdrawal scroll batch.
        await first.getByRole('button', { name: 'Decline optional tracking' }).click();
        await second.waitForFunction(() => window['ga-disable-G-MJFKPDR0WN'] === true);
        const afterWithdrawal = requests.length;
        for (const page of [first, second]) {
            await page.evaluate(() => {
                window.FTAAnalytics.track('consultation_cta');
                // Exercise the actual loaded tag as well as the custom gate.
                window.gtag('event', 'page_view', { debug_mode: true });
                window.scrollTo(0, document.body.scrollHeight);
            });
        }
        await second.waitForTimeout(6000); // Covers Google's delayed event batching.
        if (requests.length !== afterWithdrawal) {
            console.log('Post-withdrawal requests:', requests.slice(afterWithdrawal).map(url => {
                const p = new URL(url).searchParams;
                return { event: p.get('en'), consent: p.get('gcs'), path: p.get('dl') };
            }));
        }
        assert.equal(requests.length, afterWithdrawal, 'No Google collection requests after withdrawal in either tab');
        assert.equal((await context.cookies()).filter(cookie => /^_ga|^_gcl_/.test(cookie.name)).length, 0);
        await second.reload();
        await second.waitForTimeout(2000);
        assert.equal(await second.locator('script[data-fta-analytics]').count(), 0);
        assert.equal(requests.length, afterWithdrawal, 'A subsequent page stays untracked');
        console.log(`PASS: real Google tag sent ${afterWithdrawal} pre-withdrawal request(s), zero after same-tab/cross-tab withdrawal, and zero on denied reload. No forms submitted.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
