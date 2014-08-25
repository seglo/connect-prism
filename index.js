'use strict';

var di = require('di');

var Prism = require('./lib/prism');

var injector = new di.Injector([]);

var p = injector.get(Prism);

module.exports = {
  create: p.create,
  middleware: require('./lib/events').handleRequest
};