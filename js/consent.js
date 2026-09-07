// Consent-first loader for GA4 and advertising measurement.
(function () {
    'use strict';

    const preferenceKey = 'fta_cookie_consent_v1';
    const analyticsId = 'G-MJFKPDR0WN';
    let choice = null;
    let tagLoaded = false;

    try {
        const stored = localStorage.getItem(preferenceKey);
        if (stored === 'granted' || stored === 'denied') choice = stored;
    } catch (_) { /* The banner remains usable when storage is unavailable. */ }

    function hasAnalyticsConsent() {
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
            .filter(name => name === '_ga' || name.startsWith('_ga_'));
        for (const name of names) {
            document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
            document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.fromtheashes.fit; SameSite=Lax`;
        }
    }

    function setChoice(nextChoice) {
        choice = nextChoice;
        try { localStorage.setItem(preferenceKey, choice); } catch (_) { /* Keep in-memory choice. */ }

        const granted = choice === 'granted';
        window.gtag('consent', 'update', consentState(granted));
        if (granted) loadGoogleTag();
        else clearAnalyticsCookies();

        const banner = document.querySelector('.cookie-consent');
        if (banner) banner.hidden = true;
        window.dispatchEvent(new CustomEvent('fta:consent-changed', { detail: { choice } }));
    }

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
    }

    document.addEventListener('DOMContentLoaded', function () {
        const banner = document.createElement('section');
        banner.className = 'cookie-consent';
        banner.setAttribute('aria-label', 'Cookie preferences');
        banner.innerHTML = `
            <div class="cookie-consent__content">
                <h2 class="cookie-consent__title" tabindex="-1">Your privacy choices</h2>
                <p>With your permission, we use Google Analytics and advertising measurement cookies to understand site use, remember campaign sources, and measure consultation requests. We never send your form answers to Analytics. <a href="/privacy.html">Privacy details</a></p>
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
