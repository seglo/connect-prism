'use strict';

var di = require('di');

var Prism = require('./lib/prism');
var HttpEvents = require('./lib/http-events');

var injector = new di.Injector([]);

module.exports = {
  create: injector.get(Prism).create,
  middleware: injector.get(HttpEvents).handleRequest
};