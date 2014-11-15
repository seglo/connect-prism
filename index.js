'use strict';

var di = require('di');

var Api = require('./lib/services/api');
var ClearMocks = require('./lib/services/clear-mocks');
var HttpEvents = require('./lib/http-events');
var Logger = require('./lib/services/logger');
var Mock = require('./lib/modes/mock');
var MockFilenameGenerator = require('./lib/services/mock-filename-generator');
var MockRecord = require('./lib/modes/mockrecord');
var Prism = require('./lib/prism');
var PrismManager = require('./lib/prism-manager');
var PrismProxy = require('./lib/modes/proxy');
var PrismUtils = require('./lib/services/prism-utils');
var Proxy = require('./lib/modes/proxy');
var Record = require('./lib/modes/record');
var ResponseDelay = require('./lib/services/response-delay');
var UrlRewrite = require('./lib/services/url-rewrite');

var injector = new di.Injector([]);

// di.js bindings
// this is the dependency wiring that should be used in normal operation
// with es6 types this could probably done with a lot less boilerplate..
di.annotate(Api, new di.Inject(PrismManager));
di.annotate(ClearMocks, new di.Inject(Logger));
di.annotate(Logger, new di.Inject(PrismUtils));
di.annotate(HttpEvents, new di.Inject(PrismManager, UrlRewrite, Api));
di.annotate(Mock, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, ResponseDelay));
di.annotate(MockFilenameGenerator, new di.Inject(PrismUtils));
di.annotate(MockRecord, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, Mock, Proxy));
// yikes, big dependency smell on prism
di.annotate(Prism, new di.Inject(PrismManager, Logger, UrlRewrite, HttpEvents, PrismProxy, Mock, Record, MockRecord, PrismUtils, ClearMocks));
di.annotate(Proxy, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, ResponseDelay));
di.annotate(Record, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, Mock));
di.annotate(UrlRewrite, new di.Inject(Logger));

module.exports = {
  manager: injector.get(PrismManager),
  create: injector.get(Prism).create,
  middleware: injector.get(HttpEvents).handleRequest
};