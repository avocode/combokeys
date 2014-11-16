/* eslint-env node, browser */
/**
 * adds a pause and unpause method to Combokeys
 * this allows you to enable or disable keyboard shortcuts
 * without having to reset Combokeys and rebind everything
 */
Combokeys = (function(Combokeys) {
    "use strict";
    var self = Combokeys,
        originalStopCallback = self.stopCallback,
        enabled = true;

    self.stopCallback = function(e, element, combo) {
        if (!enabled) {
            return true;
        }

        return originalStopCallback(e, element, combo);
    };

    self.pause = function() {
        enabled = false;
    };

    self.unpause = function() {
        enabled = true;
    };

    return self;
})(Combokeys);
