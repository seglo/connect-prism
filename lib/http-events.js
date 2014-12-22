'use strict';

var di = require('di');

var PrismManager = require('./prism-manager');
var UrlRewrite = require('./services/url-rewrite');

function HttpEvents(prismManager, urlRewrite) {

  this.handleRequest = function(req, res) {
    var prism = prismManager.get(req.url);

    if (prism) {
      // rewrite request if applicable
      if (prism.config.rules.length) {
        prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
      }

      prism.config.requestHandler(req, res, prism);
      return true;
    } 
    return false;
  };

  this.handleResponse = function(proxyRes, req, res) {
    var prism = prismManager.get(req.originalUrl);

    if (prism) {
      prism.config.responseHandler(req, proxyRes, prism);
    }
  };
}

di.annotate(HttpEvents, new di.Inject(PrismManager, UrlRewrite));

module.exports = HttpEvents;