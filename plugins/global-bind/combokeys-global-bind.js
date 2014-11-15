/**
 * adds a bindGlobal method to Combokeys that allows you to
 * bind specific keyboard shortcuts that will still work
 * inside a text input field
 *
 * usage:
 * Combokeys.bindGlobal('ctrl+s', _saveChanges);
 */
/* global Combokeys:true */
Combokeys = (function(Combokeys) {
    var _globalCallbacks = {},
        _originalStopCallback = Combokeys.stopCallback;

    Combokeys.stopCallback = function(e, element, combo, sequence) {
        if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
            return false;
        }

        return _originalStopCallback(e, element, combo);
    };

    Combokeys.bindGlobal = function(keys, callback, action) {
        Combokeys.bind(keys, callback, action);

        if (keys instanceof Array) {
            for (var i = 0; i < keys.length; i++) {
                _globalCallbacks[keys[i]] = true;
            }
            return;
        }

        _globalCallbacks[keys] = true;
    };

    return Combokeys;
}) (Combokeys);
