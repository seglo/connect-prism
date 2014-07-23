'use strict';

var grunt = require('grunt');
var _ = require('lodash');

var modes = require('./modes.js');
var proxies = require('./proxies.js');

function rewriteRequest(req) {
  return function(rule) {
    if (rule.from.test(req.url)) {
      grunt.log.writeln('Request matched rewrite rule.  Rewriting ' + req.url + ' to ' + rule.to);
      req.url = req.url.replace(rule.from, rule.to);
    }
  };
}

module.exports = {
  handleRequest: function(req, res, next) {
    var proxy = proxies.getProxy(req.url);

    // if we have a proxy configured then handle this request, else pass the buck to the next connect middleware
    if (proxy) {
      // rewrite request if applicable
      if (proxy.config.rules.length) {
        proxy.config.rules.forEach(rewriteRequest(req));
      }

      if (proxy.config.mode === 'mock') {
        modes.mock(proxy, req, res);
      } else if (proxy.config.mode === 'proxy' || proxy.config.mode === 'record') {
        modes.proxy(proxy, req, res);
      } else if (proxy.config.mode === 'mockrecord') {
        modes.mockrecord(proxy, req, res);
      } else {
        throw new Error('No such mode: ' + proxy.config.mode);
      }
    } else {
      next();
    }
  },
  handleResponse: function(req, res, response) {
    var proxy = proxies.getProxy(req.originalUrl);

    if (proxy) {
      modes.record(proxy, response);
    }
  }
};
