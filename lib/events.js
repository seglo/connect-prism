'use strict';

var di = require('di');
var grunt = require('grunt');
var _ = require('lodash');

var proxies = require('./proxies.js');

var Mock = require('./modes/mock');
var MockRecord = require('./modes/mockrecord');
var ProxyMode = require('./modes/proxy');
var Record = require('./modes/record');

var injector = new di.Injector([]);

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
        var mockMode = injector.get(Mock);
        mockMode.handleRequest(req, res, proxy);
      } else if (proxy.config.mode === 'proxy' || proxy.config.mode === 'record') {
        var proxyModee = injector.get(ProxyMode);
        proxyModee.handleRequest(req, res, proxy);
      } else if (proxy.config.mode === 'mockrecord') {
        var mockRecordMode = injector.get(MockRecord);
        mockRecordMode.handleRequest(req, res, proxy);
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
      var recordMode = injector.get(Record);
      recordMode.handleResponse(req, response, proxy);
    }
  }
};