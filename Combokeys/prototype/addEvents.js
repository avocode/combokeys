/* eslint-env node, browser */
"use strict";
module.exports = function () {
    var self = this,
        addEvent,
        element = self.element,
        handleKeyEvent,
        boundHandler;

    handleKeyEvent = require("./handleKeyEvent");

    addEvent = require("../../helpers/addEvent");
    boundHandler = handleKeyEvent.bind(self);
    addEvent(element, "keypress", boundHandler);
    addEvent(element, "keydown", boundHandler);
    addEvent(element, "keyup", boundHandler);
};
