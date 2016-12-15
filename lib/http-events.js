'use strict';


var PrismManager = require('./prism-manager');
var PrismUtils = require('./services/prism-utils');
var UrlRewrite = require('./services/url-rewrite');

function HttpEvents(prismManager, urlRewrite, prismUtils) {

  this.handleRequest = function(req, res) {
    var prism = prismManager.get(req.url);

    if (prism) {
      // rewrite request if applicable
      if (prism.config.rules.length) {
        prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
      }

      // Add headers present in the config object
      if (prism.config.headers != null) {
        for(var key in prism.config.headers) {
          req.headers[key] = prism.config.headers[key];
        }
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

module.exports = HttpEvents;
