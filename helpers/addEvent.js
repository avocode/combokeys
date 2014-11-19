/* eslint-env node, browser */
"use strict";

/**
 * cross browser add event method
 *
 * @param {Element|HTMLDocument} object
 * @param {string} type
 * @param {Function} callback
 * @returns void
 */
module.exports = function (object, type, callback) {
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
        return;
    }

    object.attachEvent("on" + type, callback);
};
