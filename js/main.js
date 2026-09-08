// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        if (!navMenu.id) navMenu.id = 'primary-navigation';
        navToggle.setAttribute('aria-controls', navMenu.id);
        navToggle.setAttribute('aria-expanded', 'false');
        const mobileNavigation = window.matchMedia('(max-width: 1060px)');

        function setMenuState(isOpen) {
            navMenu.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navMenu.inert = mobileNavigation.matches && !isOpen;

            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = isOpen ? 'rotate(45deg) translateY(8px)' : 'none';
            spans[1].style.opacity = isOpen ? '0' : '1';
            spans[2].style.transform = isOpen ? 'rotate(-45deg) translateY(-8px)' : 'none';
        }

        setMenuState(false);
        mobileNavigation.addEventListener('change', () => setMenuState(false));

        navToggle.addEventListener('click', function() {
            setMenuState(!navMenu.classList.contains('active'));
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                setMenuState(false);
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                setMenuState(false);
                navToggle.focus();
            }
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                setMenuState(false);
            });
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
                if (this.classList.contains('skip-link')) targetElement.focus({ preventScroll: true });
            }
        });
    });

    // Add scroll feedback and an easy way back to the top.
    const navbar = document.querySelector('.navbar');
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.prepend(progressBar);

    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.type = 'button';
    backToTop.setAttribute('aria-label', 'Back to top');
    backToTop.innerHTML = '↑';
    document.body.append(backToTop);

    function updateScrollUI() {
        const currentScroll = window.pageYOffset;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = totalHeight > 0 ? currentScroll / totalHeight : 0;

        progressBar.style.transform = `scaleX(${progress})`;
        if (navbar) {
            navbar.classList.toggle('is-scrolled', currentScroll > 12);
        }
        backToTop.classList.toggle('is-visible', currentScroll > 500);
        backToTop.tabIndex = currentScroll > 500 ? 0 : -1;
    }

    updateScrollUI();
    window.addEventListener('scroll', updateScrollUI, { passive: true });
    window.addEventListener('resize', updateScrollUI);

    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    // Form validation and submission for contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        let submitting = false;
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (submitting || !contactForm.reportValidity()) return;

            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value.trim();

            // Basic validation
            let errors = [];

            if (!name) errors.push('Please enter your name');
            if (!email || !isValidEmail(email)) errors.push('Please enter a valid email address');
            if (!phone) errors.push('Please enter your phone number');
            if (!service) errors.push('Please select a service');
            if (!message) errors.push('Please enter a message');

            // Check reCAPTCHA
            if (contactForm.querySelector('.g-recaptcha')) {
                if (typeof grecaptcha === 'undefined' || typeof grecaptcha.getResponse !== 'function') {
                    errors.push('The verification widget could not load. Please reload the page or email Mia using the address below.');
                } else if (!grecaptcha.getResponse()) {
                    errors.push('Please complete the reCAPTCHA verification');
                }
            }

            if (errors.length > 0) {
                showFormMessage(errors.join('\n'), 'error');
                return;
            }

            // Disable submit button while processing
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitting = true;
            contactForm.setAttribute('aria-busy', 'true');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                // Submit to Formspree
                window.FTAAnalytics?.populateForm(contactForm);
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Only Formspree's successful response counts as a lead.
                    // No name, email, phone, goals, or selected health-related service
                    // is sent to analytics. No event on clicks, validation errors, or failures.
                    window.FTAAnalytics?.track('generate_lead', {
                        form_id: 'contact-form',
                        lead_type: 'complimentary_consultation'
                    });
                    showFormMessage('Thank you for your inquiry! I will contact you within 24 hours to schedule your complimentary consultation.', 'success');
                    contactForm.reset();
                    window.FTAAnalytics?.populateForm(contactForm);
                    // Reset reCAPTCHA
                    if (typeof grecaptcha !== 'undefined') {
                        try { grecaptcha.reset(); } catch (_) { /* Inquiry already accepted. */ }
                    }
                } else {
                    const data = await response.json().catch(() => ({}));
                    if (Array.isArray(data.errors) && data.errors.length) {
                        showFormMessage(data.errors.map(err => String(err.message || 'Please check your form.')).join('\n'), 'error');
                    } else {
                        showFormMessage('There was a problem submitting your form. Please try again.', 'error');
                    }
                }
            } catch (error) {
                showFormMessage('We could not confirm receipt of your inquiry. Please check your connection or email Mia using the address below.', 'error');
            } finally {
                // Re-enable submit button
                submitting = false;
                contactForm.removeAttribute('aria-busy');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Email validation helper
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Show form message helper
    function showFormMessage(message, type) {
        const messageDiv = document.getElementById('form-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `form-message ${type}`;
            messageDiv.style.display = 'block';

            messageDiv.focus({ preventScroll: true });
            messageDiv.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = !reduceMotion && 'IntersectionObserver' in window ? new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions) : null;

    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.service-card, .testimonial-card, .feature, .session-card');
    animatedElements.forEach(el => {
        if (!observer) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Session type explorer on the services page
    const sessionSelectors = document.querySelectorAll('[data-session]');
    const sessionDetail = document.querySelector('.session-detail');
    if (sessionSelectors.length && sessionDetail) {
        const sessionOptions = {
            individual: {
                kicker: 'Individual training',
                title: 'Dedicated, one-on-one support',
                description: 'Build confidence with coaching that adapts to your goals, experience, and progress.',
                benefits: ['Personalized programming', 'Focused form feedback', 'Clear next steps for your goals']
            },
            partner: {
                kicker: 'Partner training',
                title: 'Progress is more fun together',
                description: 'Move alongside a friend or family member while each of you receives coaching tailored to your needs.',
                benefits: ['Shared accountability', 'Partner-focused workouts', 'Individualized guidance for both']
            },
            group: {
                kicker: 'Small group training',
                title: 'Big energy in a supportive setting',
                description: 'Train with 3–8 people through scalable workouts that keep every participant moving with confidence.',
                benefits: ['Welcoming all fitness levels', 'Community motivation', 'Shared momentum and support']
            }
        };

        const detailKicker = sessionDetail.querySelector('.detail-kicker');
        const detailTitle = sessionDetail.querySelector('[data-session-title]');
        const detailDescription = sessionDetail.querySelector('[data-session-description]');
        const detailBenefits = sessionDetail.querySelector('[data-session-benefits]');

        function selectSession(key) {
            const session = sessionOptions[key];
            if (!session) return;

            sessionSelectors.forEach(selector => {
                const isSelected = selector.dataset.session === key;
                selector.classList.toggle('is-selected', isSelected);
                selector.setAttribute('aria-pressed', String(isSelected));
            });

            detailKicker.textContent = session.kicker;
            detailTitle.textContent = session.title;
            detailDescription.textContent = session.description;
            detailBenefits.replaceChildren(...session.benefits.map(benefit => {
                const item = document.createElement('li');
                item.textContent = benefit;
                return item;
            }));
        }

        sessionSelectors.forEach(selector => {
            selector.addEventListener('click', () => selectSession(selector.dataset.session));
        });
        if (window.location.hash === '#partner') selectSession('partner');
    }

    // Testimonial Carousel
    const carousel = document.querySelector('.testimonial-carousel');
    if (carousel) {
        const panels = carousel.querySelectorAll('.carousel-panel');
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const dotsContainer = document.querySelector('.carousel-dots');
        let currentPanel = 0;

        panels.forEach((panel, index) => {
            panel.setAttribute('role', 'group');
            panel.setAttribute('aria-roledescription', 'slide');
            panel.setAttribute('aria-label', `${index + 1} of ${panels.length}`);
        });

        const dots = dotsContainer ? Array.from(panels, (_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Show testimonial group ${index + 1}`);
            dot.addEventListener('click', () => {
                showPanel(index);
            });
            dotsContainer.append(dot);
            return dot;
        }) : [];

        function showPanel(n) {
            if (n >= panels.length) {
                currentPanel = 0;
            } else if (n < 0) {
                currentPanel = panels.length - 1;
            } else {
                currentPanel = n;
            }

            panels.forEach((panel, index) => {
                const isActive = index === currentPanel;
                panel.classList.toggle('active', isActive);
                panel.setAttribute('aria-hidden', String(!isActive));
            });

            dots.forEach((dot, index) => {
                dot.setAttribute('aria-current', String(index === currentPanel));
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                showPanel(currentPanel - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                showPanel(currentPanel + 1);
            });
        }

        showPanel(0);
    }
});

// Add animation class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    .form-message {
        padding: 1rem;
        border-radius: 5px;
        margin-bottom: 1rem;
        display: none;
        white-space: pre-line;
    }

    .form-message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .form-message.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
`;
document.head.appendChild(style);
