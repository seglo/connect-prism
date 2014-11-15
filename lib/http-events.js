'use strict';

function HttpEvents(prismManager, urlRewrite, api) {

  this.handleRequest = function(req, res, next) {
    var prism = prismManager.get(req.url);

    if (prism) {
      // rewrite request if applicable
      if (prism.config.rules.length) {
        prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
      }

      prism.config.requestHandler(req, res, prism);
    } else if (api.isApiRequest(req)) {
      // handle prism API request
      api.requestHandler(req, res);
    } else {
      next();
    }
  };

  this.handleResponse = function(proxyRes, req, res) {
    var prism = prismManager.get(req.originalUrl);

    if (prism) {
      prism.config.responseHandler(req, proxyRes, prism);
    }
  };
}

module.exports = HttpEvents;