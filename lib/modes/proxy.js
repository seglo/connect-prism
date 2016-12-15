'use strict';


var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var ResponseDelay = require('../services/response-delay');

function Proxy(logger, prismUtils, responseDelay) {
  function proxyResponse(req, res, prism) {

    if (req.bodyRead) {
      //re-stream the request body, because it has already been consumed
      req.removeAllListeners('data');
      req.removeAllListeners('end');

      process.nextTick(function() {
        if (req.body) {
          req.emit('data', new Buffer(req.body))
        }
        req.emit('end')
      });
    }

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

    if (prism.config.hashFullRequest) {
      prismUtils.getBody(req, function() {
        handleProxyRequest(req, res, prism);
      });
    } else {
      handleProxyRequest(req, res, prism);
    }
  }

}

module.exports = Proxy;
