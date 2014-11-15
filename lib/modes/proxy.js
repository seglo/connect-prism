'use strict';

var httpProxy = require('http-proxy');

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

module.exports = Proxy;