/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import FormUtils from '../newsletter/form-utils.es6';

let form;

const UpdatesForm = {
    handleFormError: (errorData) => {
        let error;

        FormUtils.enableFormFields(form);

        form.querySelector('.mzp-c-form-errors').classList.remove('hidden');
        if (errorData && errorData['detail']['email']) {
            error = form.querySelector('.error-email-invalid');
        } else {
            // backend error, tampered form/missing fields
            error = form.querySelector('.error-try-again-later');
        }
        if (error) {
            error.classList.remove('hidden');
        }
    },

    handleFormSuccess: () => {
        const formWrapper = document.getElementById(
            'pocket-updates-form-wrapper'
        );
        const thanksWrapper = document.getElementById('pocket-updates-thanks');
        formWrapper.classList.add('hidden');
        thanksWrapper.classList.remove('hidden');
    },
    postToBackend: (payload, url, successCallback, errorCallback) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = function (e) {
            let response = e.target.response || e.target.responseText;

            if (typeof response !== 'object') {
                response = JSON.parse(response);
            }

            if (response) {
                if (
                    response.status === 'success' &&
                    e.target.status >= 200 &&
                    e.target.status < 300
                ) {
                    successCallback();
                } else {
                    errorCallback(response);
                }
            } else {
                errorCallback();
            }
        };
        xhr.onerror = errorCallback;
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.timeout = 5000;
        xhr.ontimeout = errorCallback;
        xhr.responseType = 'json';
        xhr.send(JSON.stringify(payload));
    },

    subscribe: (e) => {
        const payload = Object.fromEntries(new FormData(form).entries());
        const url = form.getAttribute('action');

        e.preventDefault();
        e.stopPropagation();

        // Disable form fields until POST has completed.
        FormUtils.disableFormFields(form);

        // Clear any prior messages that might have been displayed.
        FormUtils.clearFormErrors(form);

        // Submit to the server
        UpdatesForm.postToBackend(
            payload,
            url,
            UpdatesForm.handleFormSuccess,
            UpdatesForm.handleFormError
        );
    },

    populateFromQuerystring: () => {
        const soughtParams = ['campaign', 'medium', 'source'];
        // Grab the UTM params for the hidden form fields, if we can, set them
        // as default form values
        for (const [key, value] of new URL(window.location.href).searchParams) {
            const strippedKey = key.replace('utm_', '');
            if (soughtParams.includes(strippedKey)) {
                form.elements[strippedKey].value = value;
            }
        }
    },

    init: () => {
        form = document.getElementById('updates-form');
        if (!form) {
            return;
        }
        form.addEventListener('submit', UpdatesForm.subscribe, false);
        UpdatesForm.populateFromQuerystring();
    }
};

export default UpdatesForm;
