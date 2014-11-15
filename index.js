'use strict';

var di = require('di');

var Prism = require('./lib/prism');
var PrismManager = require('./lib/prism-manager');
var HttpEvents = require('./lib/http-events');

/*var ClearMocks = require('./services/clear-mocks');
var HttpEvents = require('./http-events');
var Logger = require('./services/logger');
var Mock = require('./modes/mock');
var MockRecord = require('./modes/mockrecord');
var Prism = require('./lib/prism');
var PrismManager = require('./prism-manager');
var PrismProxy = require('./modes/proxy');
var PrismUtils = require('./services/prism-utils');
var Record = require('./modes/record');
var UrlRewrite = require('./services/url-rewrite');*/

var Api = require('./lib/services/api');
//var PrismManager = require('./prism-manager.js');
var UrlRewrite = require('./lib/services/url-rewrite');

var injector = new di.Injector([]);

// di.js bindings
di.annotate(Api, new di.Inject(PrismManager));
di.annotate(HttpEvents, new di.Inject(PrismManager, UrlRewrite, Api));

module.exports = {
  manager: injector.get(PrismManager),
  create: injector.get(Prism).create,
  middleware: injector.get(HttpEvents).handleRequest
};