// Consent-aware campaign attribution and GA4 events.
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

    function hasConsent() {
        return window.FTAConsent?.hasAnalyticsConsent() === true;
    }

    function initializeAttribution() {
        if (!hasConsent()) return clearAttribution();
        attribution = {};

        // Whitelist fields even when restoring storage. Never store names, contact
        // data, goals, health details, full query strings, or arbitrary parameters.
        try {
            const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
            for (const key of [...campaignKeys, 'landing_page', 'referrer_origin']) {
                const value = clean(stored && stored[key]);
                if (value) attribution[key] = value;
            }
        } catch (_) { /* Current-page attribution still works without storage. */ }

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
        try { sessionStorage.setItem(storageKey, JSON.stringify(attribution)); }
        catch (_) { /* Current-page attribution remains available. */ }

        const form = document.getElementById('contact-form');
        if (form) populateForm(form);
    }

    function clearAttribution() {
        attribution = {};
        try { sessionStorage.removeItem(storageKey); } catch (_) { /* Storage may be disabled. */ }
        document.querySelectorAll('[data-fta-attribution]').forEach(input => input.remove());
    }

    function populateForm(form) {
        form.querySelectorAll('[data-fta-attribution]').forEach(input => input.remove());
        if (!hasConsent()) return;
        for (const [key, value] of Object.entries(attribution)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.dataset.ftaAttribution = 'true';
            input.value = value;
            form.append(input);
        }
    }

    function track(name, details = {}) {
        if (!hasConsent()) return;
        if (!['generate_lead', 'click_phone', 'click_email', 'consultation_cta'].includes(name)) return;
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
    initializeAttribution();
    window.addEventListener('fta:consent-changed', function (event) {
        if (event.detail?.choice === 'granted') initializeAttribution();
        else clearAttribution();
    });

    document.addEventListener('click', function (event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        const ctaLocation = link.closest('.navbar') ? 'navigation'
            : link.closest('.hero') ? 'hero'
            : link.closest('.footer') ? 'footer' : 'content';
        if (href.startsWith('tel:')) track('click_phone', { cta_location: ctaLocation });
        else if (href.startsWith('mailto:')) track('click_email', { cta_location: ctaLocation });
        else {
            const url = new URL(link.href);
            if (url.origin === window.location.origin &&
                (url.pathname === '/contact.html' || url.hash === '#contact-form')) {
                track('consultation_cta', { cta_location: ctaLocation });
            }
        }
    });
})();
