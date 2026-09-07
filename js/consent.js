// Consent-first loader for GA4 and advertising measurement.
(function () {
    'use strict';

    const preferenceKey = 'fta_cookie_consent_v1';
    const analyticsId = 'G-MJFKPDR0WN';
    let choice = null;
    let tagLoaded = false;
    let storageAvailable = true;

    function readChoice() {
        if (!storageAvailable) return choice;
        try {
            const stored = localStorage.getItem(preferenceKey);
            return stored === 'granted' || stored === 'denied' ? stored : null;
        } catch (_) { return choice; }
    }

    choice = readChoice();
    window[`ga-disable-${analyticsId}`] = choice !== 'granted';

    function hasAnalyticsConsent() {
        // Re-check before each custom event, even if the storage event from a
        // different tab has not been delivered yet (or this page was suspended).
        syncChoice();
        return choice === 'granted';
    }

    function consentState(granted) {
        return {
            analytics_storage: granted ? 'granted' : 'denied',
            ad_storage: granted ? 'granted' : 'denied',
            ad_user_data: granted ? 'granted' : 'denied',
            ad_personalization: 'denied'
        };
    }

    function loadGoogleTag() {
        if (tagLoaded) return;
        tagLoaded = true;

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
        script.dataset.ftaAnalytics = 'true';
        document.head.append(script);

        window.gtag('js', new Date());
        window.gtag('config', analyticsId, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
    }

    function clearAnalyticsCookies() {
        const names = document.cookie.split(';').map(part => part.split('=')[0].trim())
            .filter(name => name === '_ga' || name.startsWith('_ga_') || name.startsWith('_gcl_'));
        for (const name of names) {
            document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
            document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.fromtheashes.fit; SameSite=Lax`;
        }
    }

    function applyChoice(nextChoice) {
        choice = nextChoice;
        const granted = choice === 'granted';
        // Consent Mode alone can allow cookieless pings after withdrawal.
        // Google's opt-out flag also stops the already-loaded tag's automatic
        // measurement. Set it BEFORE updating consent or deleting cookies.
        window[`ga-disable-${analyticsId}`] = !granted;
        window.gtag('consent', 'update', consentState(granted));
        if (granted) loadGoogleTag();
        else clearAnalyticsCookies();

        const banner = document.querySelector('.cookie-consent');
        if (banner) banner.hidden = choice !== null;
        window.dispatchEvent(new CustomEvent('fta:consent-changed', { detail: { choice } }));
    }

    function setChoice(nextChoice) {
        if (nextChoice !== 'granted' && nextChoice !== 'denied') return;
        try { localStorage.setItem(preferenceKey, nextChoice); }
        catch (_) { storageAvailable = false; /* Keep this page usable without storage. */ }
        applyChoice(nextChoice);
    }

    function syncChoice() {
        const current = readChoice();
        if (current !== choice) applyChoice(current);
    }

    window.addEventListener('storage', function (event) {
        if (event.key === preferenceKey || event.key === null) syncChoice();
    });
    window.addEventListener('pageshow', syncChoice);
    window.addEventListener('focus', syncChoice);
    document.addEventListener('visibilitychange', syncChoice);

    function showPreferences() {
        const banner = document.querySelector('.cookie-consent');
        if (banner) {
            banner.hidden = false;
            banner.querySelector('.cookie-consent__title').focus();
        }
    }

    window.FTAConsent = { hasAnalyticsConsent, setChoice, showPreferences };

    if (choice === 'granted') {
        window.gtag('consent', 'update', consentState(true));
        loadGoogleTag();
    } else clearAnalyticsCookies();

    document.addEventListener('DOMContentLoaded', function () {
        const banner = document.createElement('section');
        banner.className = 'cookie-consent';
        banner.setAttribute('aria-label', 'Cookie preferences');
        banner.innerHTML = `
            <div class="cookie-consent__content">
                <h2 class="cookie-consent__title" tabindex="-1">Your privacy choices</h2>
                <p>Allow cookies to measure site use, ad campaigns, and consultation requests? Form answers are never sent to Analytics. Your choice won't affect booking. <a href="/privacy.html">Privacy details</a></p>
            </div>
            <div class="cookie-consent__actions">
                <button type="button" class="btn btn-secondary" data-consent="denied">Decline optional tracking</button>
                <button type="button" class="btn btn-primary" data-consent="granted">Accept optional tracking</button>
            </div>`;
        banner.hidden = choice !== null;
        document.body.append(banner);

        banner.addEventListener('click', function (event) {
            const button = event.target.closest('[data-consent]');
            if (button) setChoice(button.dataset.consent);
        });

        document.addEventListener('click', function (event) {
            const link = event.target.closest('[data-cookie-preferences]');
            if (!link) return;
            event.preventDefault();
            showPreferences();
        });
    });
})();
