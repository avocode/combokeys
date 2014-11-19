# Combokeys

Combokeys is a JavaScript library for handling keyboard shortcuts in the browser.

It is licensed under the Apache 2.0 license.

It is around **1.9kb** minified and gzipped and **3.5kb** minified, has no external dependencies, and has been tested in the following browsers:

- Internet Explorer 6+ (test suite works in IE9+)
- Safari
- Firefox
- Chrome

It has support for ``keypress``, ``keydown``, and ``keyup`` events on specific keys, keyboard combinations, or key sequences.

## Fork notice

This project was forked from [ccampbell/mousetrap](https://github.com/ccampbell/mousetrap).

It was forked because pull–requests were not being reviewed.

This fork's author intends to review pull–requests.

Main changes are

1. Refactored as CommonJS
2. Doesn't automatically listen on the `document`. Instead, it is now a constructor and the element on which to listen must be provided on instantiation. Multiple instances possible.

## Getting started

Get it on your page:

```
var Combokeys;
Combokeys = require("combokeys");
```

Instantiate it for the entire page:

```
var combokeys = new Combokeys(document);
```

Or, instantiate it for one or more specific elements:

```
var firstCombokeys = new Combokeys(document.getElementById("first"));
var secondCombokeys = new Combokeys(document.getElementById("second"));
```

Add some combos!

```
// single keys
combokeys.bind('4', function() { console.log('4'); });
firstCombokeys.bind("?", function() { console.log('show shortcuts!'); });
secondCombokeys.bind('esc', function() { console.log('escape'); }, 'keyup');

// combinations
combokeys.bind('command+shift+k', function() { console.log('command shift k'); });

// map multiple combinations to the same callback
combokeys.bind(['command+k', 'ctrl+k'], function() {
    console.log('command k or control k');
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
});

// gmail style sequences
Combokeys.bind('g i', function() { console.log('go to inbox'); });
Combokeys.bind('* a', function() { console.log('select all'); });

// konami code!
Combokeys.bind('up up down down left right left right b a enter', function() {
    console.log('konami code');
});
```

## Why Combokeys?

There are a number of other similar libraries out there so what makes this one different?

- CommonJS, NPM (package for this fork not yet published).
- You are not limited to ``keydown`` events (You can specify ``keypress``, ``keydown``, or ``keyup`` or let Combokeys choose for you).
- You can bind key events directly to special keys such as ``?`` or ``*`` without having to specify ``shift+/`` or ``shift+8`` which are not consistent across all keyboards
- It works with international keyboard layouts
- You can bind Gmail like key sequences in addition to regular keys and key combinations
- You can programatically trigger key events with the ``trigger()`` method
- It works with the numeric keypad on your keyboard
- The code is well documented/commented

## Plugins

Since this project was forked from
[ccampbell/mousetrap](https://github.com/ccampbell/mousetrap)
and was converted to CommonJS, the plugins were not converted to CommonJS, so they don't work yet.

### Bind dictionary

Allows you to make multiple bindings in a single ``Combokeys.bind`` call.

### Global bind

Allows you to set global bindings that work even inside of input fields.

### Pause/unpause

Allows you to temporarily prevent Combokeys events from firing.

### Record

Allows you to capture a keyboard shortcut or sequence defined by a user.
