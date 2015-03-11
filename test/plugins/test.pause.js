/* eslint-env node, browser, mocha */
/* eslint no-unused-expressions:0 */
'use strict'
require('es5-shim/es5-shim')
require('es5-shim/es5-sham')
var expect = require('chai').expect
var sinon = require('sinon')
var Combokeys = require('../..')
var KeyEvent = require('.././lib/key-event')

afterEach(function () {
  Combokeys.reset()
})

describe('combokeys.pause', function () {
  it('pause and unpause works', function () {
    var spy = sinon.spy()

    var combokeys = new Combokeys(document)
    require('../../plugins/pause')(combokeys)
    combokeys.bind('a', spy)

    KeyEvent.simulate('A'.charCodeAt(0), 65)
    combokeys.pause()
    KeyEvent.simulate('A'.charCodeAt(0), 65)
    combokeys.unpause()
    KeyEvent.simulate('A'.charCodeAt(0), 65)

    expect(spy.callCount).to.equal(2, 'callback should fire twice')
  })
})
