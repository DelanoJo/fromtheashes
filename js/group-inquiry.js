// A narrow service link helps organizers use the existing protected inquiry form.
(function () {
    'use strict';
    const form = document.getElementById('contact-form');
    const service = document.getElementById('service');
    const note = document.getElementById('group-inquiry-note');
    const message = document.getElementById('message');
    if (!form || !service || !note || !message) return;

    const heading = document.getElementById('contact-heading');
    const intro = document.getElementById('contact-intro');
    const title = document.getElementById('inquiry-title');
    const original = { heading: heading.textContent, intro: intro.textContent,
        title: title.textContent, placeholder: message.placeholder };

    function update() {
        const group = service.value === 'corporate-fitness';
        note.hidden = !group;
        heading.textContent = group ? 'Plan a Group Fitness Session' : original.heading;
        intro.textContent = group
            ? 'Talk with Mia about a class for your workplace or community group. We\'ll confirm the format, location, timing, and fee before booking.'
            : original.intro;
        title.textContent = group ? 'Tell Mia About Your Group' : original.title;
        message.placeholder = group
            ? 'Organization, location, approximate group size, preferred times, and the kind of session you have in mind. Please keep participants\' personal health details out of this inquiry.'
            : original.placeholder;
    }

    // Ignore all other parameters. No query text is inserted into the page or form.
    if (new URLSearchParams(window.location.search).get('service') === 'corporate-fitness') {
        service.value = 'corporate-fitness';
    }
    service.addEventListener('change', update);
    form.addEventListener('reset', () => queueMicrotask(update));
    update();
})();
