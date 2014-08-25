'use strict';

var di = require('di');
var httpProxy = require('http-proxy');

var Logger = require('./logger');
var PrismUtils = require('./prism-utils');
var ResolveRequestBody = require('./resolve-request-body'); /* put into a library that includes all response hashing functions */
var ResponseDelay = require('./response-delay');

function Proxy(logger, prismUtils, resolveRequestBody, responseDelay) {
  function proxyResponse(req, res, buffer, prism) {
    if (prism.config.hashFullRequest) {
      resolveRequestBody.getBody(req);
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


di.annotate(Proxy, new di.Inject(Logger, PrismUtils, ResolveRequestBody, ResponseDelay));

module.exports = Proxy;