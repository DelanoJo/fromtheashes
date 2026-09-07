// Session attribution and integration-ready events. No analytics vendor is loaded here.
(function () {
    'use strict';

    const storageKey = 'fta_campaign_session_v1';
    const campaignKeys = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'utm_id', 'utm_source_platform', 'gclid', 'gbraid', 'wbraid'
    ];
    const canonical = document.querySelector('link[rel="canonical"]');
    const pagePath = canonical ? new URL(canonical.href).pathname : window.location.pathname;
    let attribution = {};

    function clean(value) {
        return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 250) : '';
    }

    // Whitelist fields even when restoring storage. Never store names, contact data,
    // goals, health details, full query strings, or arbitrary URL parameters.
    try {
        const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        for (const key of [...campaignKeys, 'landing_page', 'referrer_origin']) {
            const value = clean(stored && stored[key]);
            if (value) attribution[key] = value;
        }
    } catch (_) {
        // Disabled storage or malformed data must not interfere with booking.
    }

    const params = new URLSearchParams(window.location.search);
    const hasCampaign = campaignKeys.some(key => clean(params.get(key)));
    if (hasCampaign || !attribution.landing_page) {
        attribution = { landing_page: pagePath };
        try {
            const referrer = new URL(document.referrer);
            if (/^https?:$/.test(referrer.protocol) && referrer.origin !== window.location.origin) {
                attribution.referrer_origin = referrer.origin;
            }
        } catch (_) { /* An empty referrer is normal. */ }
        for (const key of campaignKeys) {
            const value = clean(params.get(key));
            if (value) attribution[key] = value;
        }
    }
    try {
        sessionStorage.setItem(storageKey, JSON.stringify(attribution));
    } catch (_) { /* Current-page attribution still works without storage. */ }

    function populateForm(form) {
        for (const [key, value] of Object.entries(attribution)) {
            let input = form.querySelector(`input[name="${key}"]`);
            if (!input) {
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                form.append(input);
            }
            input.value = value;
        }
    }

    function track(name, details = {}) {
        if (!['generate_lead', 'phone_click', 'email_click', 'consultation_cta_click'].includes(name)) return;
        const event = { event: name, page_path: pagePath };
        for (const key of ['form_id', 'lead_type', 'cta_location']) {
            if (details[key]) event[key] = clean(details[key]);
        }
        const parameters = { ...event };
        delete parameters.event;
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', name, parameters);
            } else {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push(event);
            }
            window.dispatchEvent(new CustomEvent('fta:analytics', { detail: event }));
        } catch (_) { /* A tag integration must never break a successful inquiry. */ }
    }

    window.FTAAnalytics = { track, populateForm };
    const form = document.getElementById('contact-form');
    if (form) populateForm(form);

    document.addEventListener('click', function (event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        const ctaLocation = link.closest('.navbar') ? 'navigation'
            : link.closest('.hero') ? 'hero'
            : link.closest('.footer') ? 'footer' : 'content';
        if (href.startsWith('tel:')) track('phone_click', { cta_location: ctaLocation });
        else if (href.startsWith('mailto:')) track('email_click', { cta_location: ctaLocation });
        else {
            const url = new URL(link.href);
            if (url.origin === window.location.origin &&
                (url.pathname === '/contact.html' || url.hash === '#contact-form')) {
                track('consultation_cta_click', { cta_location: ctaLocation });
            }
        }
    });
})();
