/* eslint-env node, browser */
"use strict";
var SPECIAL_KEYS_MAP = require("./constants/special-keys-map"),
    SPECIAL_CHARACTERS_MAP = require("./constants/special-characters-map"),
    SHIFT_MAP = require("./constants/shift-map.js"),
    SPECIAL_ALIASES = require("./constants/special-aliases.js"),

    /**
     * variable to store the flipped version of MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     *
     * @type {Object|undefined}
     */
    REVERSE_MAP,

    /**
     * a list of all the callbacks setup via Combokeys.bind()
     *
     * @type {Object}
     */
    callbacks = {},

    /**
     * direct map of string combinations to callbacks used for trigger()
     *
     * @type {Object}
     */
    directMap = {},

    /**
     * keeps track of what level each sequence is at since multiple
     * sequences can start out with the same sequence
     *
     * @type {Object}
     */
    sequenceLevels = {},

    /**
     * variable to store the setTimeout call
     *
     * @type {null|number}
     */
    resetTimer,

    /**
     * temporary state where we will ignore the next keyup
     *
     * @type {boolean|string}
     */
    ignoreNextKeyup = false,

    /**
     * temporary state where we will ignore the next keypress
     *
     * @type {boolean}
     */
    ignoreNextKeypress = false,

    /**
     * are we currently inside of a sequence?
     * type of action ("keyup" or "keydown" or "keypress") or false
     *
     * @type {boolean|string}
     */
    nextExpectedAction = false;

/**
 * loop through the f keys, f1 to f19 and add them to the map
 * programatically
 */
for (var i = 1; i < 20; ++i) {
    SPECIAL_KEYS_MAP[111 + i] = "f" + i;
}

/**
 * loop through to map numbers on the numeric keypad
 */
for (i = 0; i <= 9; ++i) {
    SPECIAL_KEYS_MAP[i + 96] = i;
}

/**
 * cross browser add event method
 *
 * @param {Element|HTMLDocument} object
 * @param {string} type
 * @param {Function} callback
 * @returns void
 */
function addEvent(object, type, callback) {
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
        return;
    }

    object.attachEvent("on" + type, callback);
}

/**
 * takes the event and returns the key character
 *
 * @param {Event} e
 * @return {string}
 */
function characterFromEvent(e) {

    // for keypress events we should return the character as is
    if (e.type === "keypress") {
        var character = String.fromCharCode(e.which);

        // if the shift key is not pressed then it is safe to assume
        // that we want the character to be lowercase.  this means if
        // you accidentally have caps lock on then your key bindings
        // will continue to work
        //
        // the only side effect that might not be desired is if you
        // bind something like 'A' cause you want to trigger an
        // event when capital A is pressed caps lock will no longer
        // trigger the event.  shift+a will though.
        if (!e.shiftKey) {
            character = character.toLowerCase();
        }

        return character;
    }

    // for non keypress events the special maps are needed
    if (SPECIAL_KEYS_MAP[e.which]) {
        return SPECIAL_KEYS_MAP[e.which];
    }

    if (SPECIAL_CHARACTERS_MAP[e.which]) {
        return SPECIAL_CHARACTERS_MAP[e.which];
    }

    // if it is not in the special map

    // with keydown and keyup events the character seems to always
    // come in as an uppercase character whether you are pressing shift
    // or not.  we should make sure it is always lowercase for comparisons
    return String.fromCharCode(e.which).toLowerCase();
}

/**
 * checks if two arrays are equal
 *
 * @param {Array} modifiers1
 * @param {Array} modifiers2
 * @returns {boolean}
 */
function modifiersMatch(modifiers1, modifiers2) {
    return modifiers1.sort().join(",") === modifiers2.sort().join(",");
}

/**
 * resets all sequence counters except for the ones passed in
 *
 * @param {Object} doNotReset
 * @returns void
 */
function resetSequences(doNotReset) {
    doNotReset = doNotReset || {};

    var activeSequences = false,
        key;

    for (key in sequenceLevels) {
        if (doNotReset[key]) {
            activeSequences = true;
            continue;
        }
        sequenceLevels[key] = 0;
    }

    if (!activeSequences) {
        nextExpectedAction = false;
    }
}

/**
 * finds all callbacks that match based on the keycode, modifiers,
 * and action
 *
 * @param {string} character
 * @param {Array} modifiers
 * @param {Event|Object} e
 * @param {string=} sequenceName - name of the sequence we are looking for
 * @param {string=} combination
 * @param {number=} level
 * @returns {Array}
 */
function getMatches(character, modifiers, e, sequenceName, combination, level) {
    var j,
        callback,
        matches = [],
        action = e.type;

    // if there are no events related to this keycode
    if (!callbacks[character]) {
        return [];
    }

    // if a modifier key is coming up on its own we should allow it
    if (action === "keyup" && isModifier(character)) {
        modifiers = [character];
    }

    // loop through all callbacks for the key that was pressed
    // and see if any of them match
    for (j = 0; j < callbacks[character].length; ++j) {
        callback = callbacks[character][j];

        // if a sequence name is not specified, but this is a sequence at
        // the wrong level then move onto the next match
        if (!sequenceName && callback.seq && sequenceLevels[callback.seq] !== callback.level) {
            continue;
        }

        // if the action we are looking for doesn't match the action we got
        // then we should keep going
        if (action !== callback.action) {
            continue;
        }

        // if this is a keypress event and the meta key and control key
        // are not pressed that means that we need to only look at the
        // character, otherwise check the modifiers as well
        //
        // chrome will not fire a keypress if meta or control is down
        // safari will fire a keypress if meta or meta+shift is down
        // firefox will fire a keypress if meta or control is down
        if ((action === "keypress" && !e.metaKey && !e.ctrlKey) || modifiersMatch(modifiers, callback.modifiers)) {

            // when you bind a combination or sequence a second time it
            // should overwrite the first one.  if a sequenceName or
            // combination is specified in this call it does just that
            //
            // @todo make deleting its own method?
            var deleteCombo = !sequenceName && callback.combo === combination;
            var deleteSequence = sequenceName && callback.seq === sequenceName && callback.level === level;
            if (deleteCombo || deleteSequence) {
                callbacks[character].splice(j, 1);
            }

            matches.push(callback);
        }
    }

    return matches;
}

/**
 * takes a key event and figures out what the modifiers are
 *
 * @param {Event} e
 * @returns {Array}
 */
function eventModifiers(e) {
    var modifiers = [];

    if (e.shiftKey) {
        modifiers.push("shift");
    }

    if (e.altKey) {
        modifiers.push("alt");
    }

    if (e.ctrlKey) {
        modifiers.push("ctrl");
    }

    if (e.metaKey) {
        modifiers.push("meta");
    }

    return modifiers;
}

/**
 * prevents default for this event
 *
 * @param {Event} e
 * @returns void
 */
function preventDefault(e) {
    if (e.preventDefault) {
        e.preventDefault();
        return;
    }

    e.returnValue = false;
}

/**
 * stops propogation for this event
 *
 * @param {Event} e
 * @returns void
 */
function stopPropagation(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
        return;
    }

    e.cancelBubble = true;
}

/**
 * actually calls the callback function
 *
 * if your callback function returns false this will use the jquery
 * convention - prevent default and stop propogation on the event
 *
 * @param {Function} callback
 * @param {Event} e
 * @returns void
 */
function fireCallback(callback, e, combo, sequence) {

    // if this event should not happen stop here
    if (Combokeys.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
        return;
    }

    if (callback(e, combo) === false) {
        preventDefault(e);
        stopPropagation(e);
    }
}

/**
 * handles a character key event
 *
 * @param {string} character
 * @param {Array} modifiers
 * @param {Event} e
 * @returns void
 */
function handleKey(character, modifiers, e) {
    var eCallbacks = getMatches(character, modifiers, e),
        j,
        doNotReset = {},
        maxLevel = 0,
        processedSequenceCallback = false;

    // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
    for (j = 0; j < eCallbacks.length; ++j) {
        if (eCallbacks[j].seq) {
            maxLevel = Math.max(maxLevel, eCallbacks[j].level);
        }
    }

    // loop through matching callbacks for this key event
    for (j = 0; j < eCallbacks.length; ++j) {

        // fire for all sequence callbacks
        // this is because if for example you have multiple sequences
        // bound such as "g i" and "g t" they both need to fire the
        // callback for matching g cause otherwise you can only ever
        // match the first one
        if (eCallbacks[j].seq) {

            // only fire callbacks for the maxLevel to prevent
            // subsequences from also firing
            //
            // for example 'a option b' should not cause 'option b' to fire
            // even though 'option b' is part of the other sequence
            //
            // any sequences that do not match here will be discarded
            // below by the resetSequences call
            if (eCallbacks[j].level !== maxLevel) {
                continue;
            }

            processedSequenceCallback = true;

            // keep a list of which sequences were matches for later
            doNotReset[eCallbacks[j].seq] = 1;
            fireCallback(eCallbacks[j].callback, e, eCallbacks[j].combo, eCallbacks[j].seq);
            continue;
        }

        // if there were no sequence matches but we are still here
        // that means this is a regular match so we should fire that
        if (!processedSequenceCallback) {
            fireCallback(eCallbacks[j].callback, e, eCallbacks[j].combo);
        }
    }

    // if the key you pressed matches the type of sequence without
    // being a modifier (ie "keyup" or "keypress") then we should
    // reset all sequences that were not matched by this event
    //
    // this is so, for example, if you have the sequence "h a t" and you
    // type "h e a r t" it does not match.  in this case the "e" will
    // cause the sequence to reset
    //
    // modifier keys are ignored because you can have a sequence
    // that contains modifiers such as "enter ctrl+space" and in most
    // cases the modifier key will be pressed before the next key
    //
    // also if you have a sequence such as "ctrl+b a" then pressing the
    // "b" key will trigger a "keypress" and a "keydown"
    //
    // the "keydown" is expected when there is a modifier, but the
    // "keypress" ends up matching the nextExpectedAction since it occurs
    // after and that causes the sequence to reset
    //
    // we ignore keypresses in a sequence that directly follow a keydown
    // for the same character
    var ignoreThisKeypress = e.type === "keypress" && ignoreNextKeypress;
    if (e.type === nextExpectedAction && !isModifier(character) && !ignoreThisKeypress) {
        resetSequences(doNotReset);
    }

    ignoreNextKeypress = processedSequenceCallback && e.type === "keydown";
}

/**
 * handles a keydown event
 *
 * @param {Event} e
 * @returns void
 */
function handleKeyEvent(e) {

    // normalize e.which for key events
    // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
    if (typeof e.which !== "number") {
        e.which = e.keyCode;
    }

    var character = characterFromEvent(e);

    // no character found then stop
    if (!character) {
        return;
    }

    // need to use === for the character check because the character can be 0
    if (e.type === "keyup" && ignoreNextKeyup === character) {
        ignoreNextKeyup = false;
        return;
    }

    Combokeys.handleKey(character, eventModifiers(e), e);
}

/**
 * determines if the keycode specified is a modifier key or not
 *
 * @param {string} key
 * @returns {boolean}
 */
function isModifier(key) {
    return key === "shift" || key === "ctrl" || key === "alt" || key === "meta";
}

/**
 * called to set a 1 second timeout on the specified sequence
 *
 * this is so after each key press in the sequence you have 1 second
 * to press the next key before you have to start over
 *
 * @returns void
 */
function resetSequenceTimer() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetSequences, 1000);
}

/**
 * reverses the map lookup so that we can look for specific keys
 * to see what can and can't use keypress
 *
 * @return {Object}
 */
function getReverseMap() {
    if (!REVERSE_MAP) {
        REVERSE_MAP = {};
        for (var key in SPECIAL_KEYS_MAP) {

            // pull out the numeric keypad from here cause keypress should
            // be able to detect the keys from the character
            if (key > 95 && key < 112) {
                continue;
            }

            if (SPECIAL_KEYS_MAP.hasOwnProperty(key)) {
                REVERSE_MAP[SPECIAL_KEYS_MAP[key]] = key;
            }
        }
    }
    return REVERSE_MAP;
}

/**
 * picks the best action based on the key combination
 *
 * @param {string} key - character for key
 * @param {Array} modifiers
 * @param {string=} action passed in
 */
function pickBestAction(key, modifiers, action) {

    // if no action was picked in we should try to pick the one
    // that we think would work best for this key
    if (!action) {
        action = getReverseMap()[key] ? "keydown" : "keypress";
    }

    // modifier keys don't work as expected with keypress,
    // switch to keydown
    if (action === "keypress" && modifiers.length) {
        action = "keydown";
    }

    return action;
}

/**
 * binds a key sequence to an event
 *
 * @param {string} combo - combo specified in bind call
 * @param {Array} keys
 * @param {Function} callback
 * @param {string=} action
 * @returns void
 */
function bindSequence(combo, keys, callback, action) {

    // start off by adding a sequence level record for this combination
    // and setting the level to 0
    sequenceLevels[combo] = 0;

    /**
     * callback to increase the sequence level for this sequence and reset
     * all other sequences that were active
     *
     * @param {string} nextAction
     * @returns {Function}
     */
    function increaseSequence(nextAction) {
        return function() {
            nextExpectedAction = nextAction;
            ++sequenceLevels[combo];
            resetSequenceTimer();
        };
    }

    /**
     * wraps the specified callback inside of another function in order
     * to reset all sequence counters as soon as this sequence is done
     *
     * @param {Event} e
     * @returns void
     */
    function callbackAndReset(e) {
        fireCallback(callback, e, combo);

        // we should ignore the next key up if the action is key down
        // or keypress.  this is so if you finish a sequence and
        // release the key the final key will not trigger a keyup
        if (action !== "keyup") {
            ignoreNextKeyup = characterFromEvent(e);
        }

        // weird race condition if a sequence ends with the key
        // another sequence begins with
        setTimeout(resetSequences, 10);
    }

    // loop through keys one at a time and bind the appropriate callback
    // function.  for any key leading up to the final one it should
    // increase the sequence. after the final, it should reset all sequences
    //
    // if an action is specified in the original bind call then that will
    // be used throughout.  otherwise we will pass the action that the
    // next key in the sequence should match.  this allows a sequence
    // to mix and match keypress and keydown events depending on which
    // ones are better suited to the key provided
    for (var j = 0; j < keys.length; ++j) {
        var isFinal = j + 1 === keys.length;
        var wrappedCallback = isFinal ? callbackAndReset : increaseSequence(action || getKeyInfo(keys[j + 1]).action);
        bindSingle(keys[j], wrappedCallback, action, combo, j);
    }
}

/**
 * Converts from a string key combination to an array
 *
 * @param  {string} combination like "command+shift+l"
 * @return {Array}
 */
function keysFromString(combination) {
    if (combination === "+") {
        return ["+"];
    }

    return combination.split("+");
}

/**
 * Gets info for a specific key combination
 *
 * @param  {string} combination key combination ("command+s" or "a" or "*")
 * @param  {string=} action
 * @returns {Object}
 */
function getKeyInfo(combination, action) {
    var keys,
        key,
        j,
        modifiers = [];

    // take the keys from this pattern and figure out what the actual
    // pattern is all about
    keys = keysFromString(combination);

    for (j = 0; j < keys.length; ++j) {
        key = keys[j];

        // normalize key names
        if (SPECIAL_ALIASES[key]) {
            key = SPECIAL_ALIASES[key];
        }

        // if this is not a keypress event then we should
        // be smart about using shift keys
        // this will only work for US keyboards however
        if (action && action !== "keypress" && SHIFT_MAP[key]) {
            key = SHIFT_MAP[key];
            modifiers.push("shift");
        }

        // if this key is a modifier then add it to the list of modifiers
        if (isModifier(key)) {
            modifiers.push(key);
        }
    }

    // depending on what the key combination is
    // we will try to pick the best event for it
    action = pickBestAction(key, modifiers, action);

    return {
        key: key,
        modifiers: modifiers,
        action: action
    };
}

/**
 * binds a single keyboard combination
 *
 * @param {string} combination
 * @param {Function} callback
 * @param {string=} action
 * @param {string=} sequenceName - name of sequence if part of sequence
 * @param {number=} level - what part of the sequence the command is
 * @returns void
 */
function bindSingle(combination, callback, action, sequenceName, level) {

    // store a direct mapped reference for use with Combokeys.trigger
    directMap[combination + ":" + action] = callback;

    // make sure multiple spaces in a row become a single space
    combination = combination.replace(/\s+/g, " ");

    var sequence = combination.split(" "),
        info;

    // if this pattern is a sequence of keys then run through this method
    // to reprocess each pattern one key at a time
    if (sequence.length > 1) {
        bindSequence(combination, sequence, callback, action);
        return;
    }

    info = getKeyInfo(combination, action);

    // make sure to initialize array if this is the first time
    // a callback is added for this key
    callbacks[info.key] = callbacks[info.key] || [];

    // remove an existing match if there is one
    getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

    // add this call back to the array
    // if it is a sequence put it at the beginning
    // if not put it at the end
    //
    // this is important because the way these are processed expects
    // the sequence ones to come first
    callbacks[info.key][sequenceName ? "unshift" : "push"]({
        callback: callback,
        modifiers: info.modifiers,
        action: info.action,
        seq: sequenceName,
        level: level,
        combo: combination
    });
}

/**
 * binds multiple combinations to the same callback
 *
 * @param {Array} combinations
 * @param {Function} callback
 * @param {string|undefined} action
 * @returns void
 */
function bindMultiple(combinations, callback, action) {
    for (var j = 0; j < combinations.length; ++j) {
        bindSingle(combinations[j], callback, action);
    }
}

// start!
addEvent(document, "keypress", handleKeyEvent);
addEvent(document, "keydown", handleKeyEvent);
addEvent(document, "keyup", handleKeyEvent);

var Combokeys = {

    /**
     * binds an event to Combokeys
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     *
     * @param {string|Array} keys
     * @param {Function} callback
     * @param {string=} action - "keypress", "keydown", or "keyup"
     * @returns void
     */
    bind: function(keys, callback, action) {
        keys = keys instanceof Array ? keys : [keys];
        bindMultiple(keys, callback, action);
        return this;
    },

    /**
     * unbinds an event to Combokeys
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * directMap dict.
     *
     * TODO: actually remove this from the callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     *
     * @param {string|Array} keys
     * @param {string} action
     * @returns void
     */
    unbind: function(keys, action) {
        return Combokeys.bind(keys, function() {}, action);
    },

    /**
     * triggers an event that has already been bound
     *
     * @param {string} keys
     * @param {string=} action
     * @returns void
     */
    trigger: function(keys, action) {
        if (directMap[keys + ":" + action]) {
            directMap[keys + ":" + action]({}, keys);
        }
        return this;
    },

    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     *
     * @returns void
     */
    reset: function() {
        callbacks = {};
        directMap = {};
        return this;
    },

   /**
    * should we stop this event before firing off callbacks
    *
    * @param {Event} e
    * @param {Element} element
    * @return {boolean}
    */
    stopCallback: function(e, element) {

        // if the element has the class "combokeys" then no need to stop
        if ((" " + element.className + " ").indexOf(" combokeys ") > -1) {
            return false;
        }

        // stop for input, select, and textarea
        return element.tagName === "INPUT" || element.tagName === "SELECT" || element.tagName === "TEXTAREA" || element.isContentEditable;
    },

    /**
     * exposes handleKey publicly so it can be overwritten by extensions
     */
    handleKey: handleKey
};

module.exports = Combokeys;
