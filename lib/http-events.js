'use strict';

var di = require('di');

var Api = require('./services/api');
var PrismManager = require('./prism-manager');
var UrlRewrite = require('./services/url-rewrite');

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

di.annotate(HttpEvents, new di.Inject(PrismManager, UrlRewrite, Api));

module.exports = HttpEvents;