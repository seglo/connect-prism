'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var grunt = require('grunt');
var _ = require('lodash');

var modes = require('./modes.js');
var proxies = require('./proxies.js');

module.exports = {
  handleRequest: function(req, res, next) {
    var proxy = proxies.getProxy(req.url);

    // if we have a proxy configured then handle this request, else pass the buck to the next connect middleware
    if (proxy) {
      if (proxy.config.mode === 'mock') {
        modes.mock(proxy, req, res);
      } else if (proxy.config.mode === 'proxy' || proxy.config.mode === 'record') {
        modes.proxy(proxy, req, res);
      } else {
        throw new Error('No such mode: ' + proxy.config.mode);
      }
    } else {
      next();
    }
  },
  handleResponse: function(req, res, response) { 
    var proxy = proxies.getProxy(req.url); 

    if (_.isUndefined(proxy) || proxy.config.mode !== 'record') {
      return;
    }

    modes.record(proxy, response);
  }
};