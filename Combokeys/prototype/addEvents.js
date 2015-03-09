/* eslint-env node, browser */
'use strict'
module.exports = function () {
  var self = this
  var addEvent
  var element = self.element
  var handleKeyEvent
  var boundHandler

  handleKeyEvent = require('./handleKeyEvent')

  addEvent = require('add-event-handler')
  boundHandler = handleKeyEvent.bind(self)
  addEvent(element, 'keypress', boundHandler)
  addEvent(element, 'keydown', boundHandler)
  addEvent(element, 'keyup', boundHandler)
}
