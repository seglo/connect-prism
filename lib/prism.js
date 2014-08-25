'use strict';

var di = require('di');
var path = require('path');
var httpProxy = require('http-proxy');
var grunt = require('grunt');
var _ = require('lodash');
var events = require('./events');
var proxies = require('./proxies');

var injector = new di.Injector([]);

var Logger = require('./modes/logger');
var UrlRewrite = require('./url-rewrite');

function Prism(logger, urlRewrite) {
  var defaultOptions = {
    port: 80,
    https: false,
    mode: 'proxy',
    mocksPath: './mocks',
    changeOrigin: false,
    rejectUnauthorized: false,
    delay: 0,
    hashFullRequest: false,
    rewrite: {}
  };

  function validate(options) {
    if (_.isUndefined(options)) {
      logger.error('Prism config is missing.');
      return false;
    }

    if (_.isUndefined(options.name)) {
      logger.error('A name for your prism options is required.');
      return false;
    }

    var mode = options.mode;
    if (!_.contains(['proxy', 'record', 'mock', 'mockrecord'], options.mode)) {
      logger.error('Prism mode: \'' + mode + '\' is invalid.');
      return false;
    }

    var mocksPath = options.mocksPath;
    if (_.isUndefined(mocksPath) || !grunt.file.isDir(mocksPath)) {
      grunt.file.mkdir(mocksPath);
      logger.warn('Mocks path did not exist \'' + mocksPath + '\'.  Created.');
    }

    var targetMocksPath = path.join(mocksPath, options.name);

    if (!grunt.file.isDir(targetMocksPath)) {
      grunt.file.mkdir(targetMocksPath);
      logger.warn('Target mocks path did not exist \'' + targetMocksPath + '\'.  Created.');
    }

    if (_.isUndefined(options.host) || _.isUndefined(options.context)) {
      logger.error('Prism options missing host or context configuration');
      return false;
    }

    if (options.https && options.port === 80) {
      logger.warn('Prism for ' + options.context + ' is using https on port 80. Are you sure this is correct?');
    }
    return true;
  }

  this.create = function(options) {
    options = _.defaults(options, defaultOptions);

    options.rules = urlRewrite.processRewrites(options.rewrite);

    if (validate(options)) {
      //var proxyServer = httpProxy.createProxyServer();
      var proxyServer = new httpProxy.HttpProxy({
        target: options,
        changeOrigin: options.changeOrigin,
        enable: {
          xforward: false // enables X-Forwarded-For
        },
        timeout: undefined
      });

      if (options.mode === 'record' || options.mode === 'mockrecord') {
        proxyServer.on('proxyResponse', events.handleResponse);
      }

      proxies.add({
        server: proxyServer,
        config: options
      });

      logger.log('Proxy created for: ' + options.context + ' to ' + options.host + ':' + options.port);
    }
  };
}

di.annotate(Prism, new di.Inject(Logger, UrlRewrite));

module.exports = Prism;