'use strict';

var di = require('di');

var Prism = require('./lib/prism');
var PrismManager = require('./lib/prism-manager');
var HttpEvents = require('./lib/http-events');

var injector = new di.Injector([]);

module.exports = {
  manager: injector.get(PrismManager),
  create: injector.get(Prism).create,
  middleware: injector.get(HttpEvents).handleRequest
};