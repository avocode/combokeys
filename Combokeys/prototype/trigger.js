/* eslint-env node, browser */
"use strict";
/**
 * triggers an event that has already been bound
 *
 * @param {string} keys
 * @param {string=} action
 * @returns void
 */
module.exports = function(keys, action) {
    if (directMap[keys + ":" + action]) {
        directMap[keys + ":" + action]({}, keys);
    }
    return this;
};
