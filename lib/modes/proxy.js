'use strict';

var di = require('di');
var httpProxy = require('http-proxy');

var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var MockFilenameGenerator = require('../services/mock-filename-generator');
var ResponseDelay = require('../services/response-delay');

function Proxy(logger, prismUtils, mockFilenameGenerator, responseDelay) {
  function proxyResponse(req, res, prism) {
    if (prism.config.hashFullRequest) {
      mockFilenameGenerator.getBody(req);
    }
    prism.server.web(req, res);
    logger.logSuccess('Proxied', req, prism);
  }

  this.handleRequest = function(req, res, prism) {
    var scheduleProxyRequest = responseDelay.delayTimeInMs(prism.config.delay);

    setTimeout(function() {
      if (scheduleProxyRequest > 0) {
        logger.verboseLog('Proxy request delayed by ' + scheduleProxyRequest + ' ms for: ' + req.url);
      }
      proxyResponse(req, res, prism);
    }, scheduleProxyRequest);
  }
}

di.annotate(Proxy, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, ResponseDelay));

module.exports = Proxy;