document.addEventListener("DOMContentLoaded", function () {
    // The submit button is type="button" (not type="submit") by design: this
    // is a JS-only interaction with no real submission, so there is nothing
    // to prevent-default and no native form submission can ever fire, even
    // without this script running.
    var submitButton = document.getElementById("request-form-submit");
    var result = document.getElementById("request-form-result");

    if (!submitButton || !result) {
        return;
    }

    var contact = document.getElementById("request-contact");
    var contactError = document.getElementById("request-contact-error");

    submitButton.addEventListener("click", function () {
        if (contact && !contact.value.trim()) {
            contactError.hidden = false;
            contact.setAttribute("aria-invalid", "true");
            result.hidden = true;
            contact.focus();
            return;
        }
        if (contact) {
            contactError.hidden = true;
            contact.removeAttribute("aria-invalid");
        }
        // No real submission: this prototype never sends or stores field
        // values, and the message shown below is static regardless of input.
        result.hidden = false;
    });
});

document.addEventListener("DOMContentLoaded", function () {
    var revealEls = document.querySelectorAll(".reveal");

    if (!revealEls.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        // No observer support: show everything immediately rather than
        // leaving content permanently invisible.
        revealEls.forEach(function (el) {
            el.classList.add("is-visible");
        });
        return;
    }

    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealEls.forEach(function (el) {
        observer.observe(el);
    });
});
