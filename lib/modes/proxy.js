'use strict';

var di = require('di');
var httpProxy = require('http-proxy');

var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var ResponseHash = require('../services/response-hash');
var ResponseDelay = require('../services/response-delay');

function Proxy(logger, prismUtils, responseHash, responseDelay) {
  function proxyResponse(req, res, buffer, prism) {
    if (prism.config.hashFullRequest) {
      responseHash.getBody(req);
    }
    prism.server.proxyRequest(req, res, buffer);
    logger.logSuccess('Proxied', req, prism);
  }

  this.handleRequest = function(req, res, prism) {
    var scheduleProxyRequest = responseDelay.delayTimeInMs(prism.config.delay);
    var buffer = httpProxy.buffer(req);

    setTimeout(function() {
      if (scheduleProxyRequest > 0) {
        logger.verboseLog('Proxy request delayed by ' + scheduleProxyRequest + ' ms for: ' + req.url);
      }
      proxyResponse(req, res, buffer, prism);
    }, scheduleProxyRequest);
  }
}

di.annotate(Proxy, new di.Inject(Logger, PrismUtils, ResponseHash, ResponseDelay));

module.exports = Proxy;