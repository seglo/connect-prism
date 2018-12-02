'use strict';
var Api = require('./lib/services/api');
var Logger = require('./lib/services/logger');
var Prism = require('./lib/prism');
var PrismManager = require('./lib/prism-manager');
var HttpEvents = require('./lib/http-events');

var ClearMocks = require('./lib/services/clear-mocks');
var Mock = require('./lib/modes/mock');
var MockFilenameGenerator = require('./lib/services/mock-filename-generator');
var PrismUtils = require('./lib/services/prism-utils');

var MockRecord = require('./lib/modes/mockrecord');
var PrismProxy = require('./lib/modes/proxy');
var Record = require('./lib/modes/record');
var UrlRewrite = require('./lib/services/url-rewrite');
var ResponseDelay = require('./lib/services/response-delay');

var prismUtils = new PrismUtils();
var logger = new Logger(prismUtils);

var urlRewrite = new UrlRewrite(logger);
var prismManager = new PrismManager();
var httpEvents = new HttpEvents(prismManager, urlRewrite, prismUtils);
var responseDelay = new ResponseDelay(Math.random);
var proxy = new PrismProxy(logger, prismUtils, responseDelay);

var mockFilenameGenerator = new MockFilenameGenerator(prismUtils);
var mock = new Mock(logger, prismUtils, mockFilenameGenerator, responseDelay);

var record = new Record(logger, prismUtils, mockFilenameGenerator, mock);
var mockRecord = new MockRecord(prismUtils, mockFilenameGenerator, mock, proxy);
var clearMocks = new ClearMocks(logger);

var prism = new Prism(prismManager, logger, urlRewrite, httpEvents, proxy, mock, record, mockRecord, prismUtils, clearMocks);

var api = new Api(prismManager, prism, prismUtils, mock, clearMocks);

module.exports = {
  manager: prismManager,
  create: prism.create,
  useApi: api.init,
  useVerboseLog: logger.useVerboseLog,
  middleware: function(req, res, next) {
    if (!api.handleRequest(req, res) && !httpEvents.handleRequest(req, res)) {
      next();
    }
  }
};
