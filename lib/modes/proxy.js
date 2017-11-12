'use strict';


var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var ResponseDelay = require('../services/response-delay');

function Proxy(logger, prismUtils, responseDelay) {
  function proxyResponse(req, res, prism) {
    prism.server.web(req, res);
    logger.logSuccess('Proxied', req, prism);
  }

  this.handleRequest = function(req, res, prism) {
    function handleProxyRequest() {
      var scheduleProxyRequest = responseDelay.delayTimeInMs(prism.config.delay);

      setTimeout(function() {
        if (scheduleProxyRequest > 0) {
          logger.verboseLog('Proxy request delayed by ' + scheduleProxyRequest + ' ms for: ' + req.url);
        }
        proxyResponse(req, res, prism);
      }, scheduleProxyRequest);
    }

    if (prism.config.hashFullRequest(prism.config, req)) {
      prismUtils.getBody(req, res, function() {
        handleProxyRequest(req, res, prism);
      });
    } else {
      handleProxyRequest(req, res, prism);
    }
  }

}

module.exports = Proxy;
