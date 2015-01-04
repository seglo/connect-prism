'use strict';

var di = require('di');

var injector = new di.Injector([]);

var Api = injector.get(require('./lib/services/api'));
var Logger = injector.get(require('./lib/services/logger'));
var Prism = injector.get(require('./lib/prism'));
var PrismManager = injector.get(require('./lib/prism-manager'));
var HttpEvents = injector.get(require('./lib/http-events'));

module.exports = {
  manager: PrismManager,
  create: Prism.create,
  useApi: Api.init,
  useVerboseLog: Logger.useVerboseLog,
  middleware: function(req, res, next) {
    if (!HttpEvents.handleRequest(req, res) && !Api.handleRequest(req, res)) {
      next();
    } 
  }
};