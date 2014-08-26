'use strict';

var di = require('di');
var proxies = require('./proxies.js');

var injector = new di.Injector([]);

var UrlRewrite = require('./url-rewrite');

function HttpEvents(urlRewrite) {

  this.handleRequest = function(req, res, next) {
    var prism = proxies.getProxy(req.url);

    if (prism) {
      // rewrite request if applicable
      if (prism.config.rules.length) {
        prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
      }

      prism.config.requestHandler(req, res, prism);
    } else {
      next();
    }
  };

  this.handleResponse = function(req, res, response) {
    var prism = proxies.getProxy(req.originalUrl);

    if (prism) {
      prism.config.responseHandler(req, response, prism);
    }
  };
}

di.annotate(HttpEvents, new di.Inject(UrlRewrite));

module.exports = HttpEvents;