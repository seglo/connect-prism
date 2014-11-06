'use strict';

var di = require('di');

var injector = new di.Injector([]);

var Api = require('./services/api');
var PrismManager = require('./prism-manager.js');
var UrlRewrite = require('./services/url-rewrite');

function HttpEvents(prismManager, urlRewrite, api) {

  function isApiRequest(req) {
    var config = prismManager.getApiConfig();
    return config.enabled && req.url.indexOf(config.route) === 0;
  }

  this.handleRequest = function(req, res, next) {
    var prism = prismManager.get(req.url);

    if (prism) {
      // rewrite request if applicable
      if (prism.config.rules.length) {
        prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
      }

      prism.config.requestHandler(req, res, prism);
    } else if (isApiRequest(req)) {
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