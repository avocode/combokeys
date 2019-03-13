/* eslint-env mocha */
var Combokeys = require('..')
var assert = require('proclaim')
var makeElement = require('./helpers/make-element')
var sinon = require('sinon')
var KeyEvent = require('./lib/key-event')

describe('combokeys.constructor', function () {
  it('should store instances globally', function () {
    var element = makeElement()
    var spy = sinon.spy()
    var combokeys = new Combokeys(element)
    assert.strictEqual(Combokeys.instances.length, 1)
  })

  it('should not store instances globally', function () {
    var element = makeElement()
    var spy = sinon.spy()
    var combokeys = new Combokeys(element, { storeInstancesGlobally: false })
    assert.strictEqual(Combokeys.instances.length, 0)
  })
})
