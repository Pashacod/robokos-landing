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

    submitButton.addEventListener("click", function () {
        // No real submission: this prototype never sends or stores field
        // values, and the message shown below is static regardless of input.
        result.hidden = false;
    });
});
