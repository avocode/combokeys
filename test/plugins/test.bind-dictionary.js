/* eslint-env node, browser, mocha */
/* eslint no-unused-expressions:0 */
"use strict";
/* global
    Event
*/
require("es5-shim/es5-shim");
require("es5-shim/es5-sham");
var expect = require("chai").expect;
var sinon = require("sinon");
var Combokeys = require("../..");
var KeyEvent = require(".././lib/key-event");

afterEach(function() {
    Combokeys.reset();
});

describe("combokeys.bind", function() {
    it("bind multiple keys", function() {
        var spy = sinon.spy();

        var combokeys = new Combokeys(document);
        require("../../plugins/bind-dictionary")(combokeys);
        combokeys.bind({
            "a": spy,
            "b": spy,
            "c": spy
        });

        KeyEvent.simulate("A".charCodeAt(0), 65);
        KeyEvent.simulate("B".charCodeAt(0), 66);
        KeyEvent.simulate("C".charCodeAt(0), 67);
        KeyEvent.simulate("Z".charCodeAt(0), 90);

        expect(spy.callCount).to.equal(3, "callback should fire three times");
        expect(spy.args[0][0]).to.be.an.instanceOf(Event, "first argument should be Event");
        expect(spy.args[0][1]).to.equal("a", "second argument should be key combo");
    });
});

describe("combokeys.unbind", function() {
    it("unbind works", function() {
        var spy = sinon.spy();
        var combokeys = new Combokeys(document);
        require("../../plugins/bind-dictionary")(combokeys);
        combokeys.bind({
            "a": spy
        });
        KeyEvent.simulate("a".charCodeAt(0), 65);
        expect(spy.callCount).to.equal(1, "callback for a should fire");

        combokeys.unbind("a");
        KeyEvent.simulate("a".charCodeAt(0), 65);
        expect(spy.callCount).to.equal(1, "callback for a should not fire after unbind");
    });
});
