'use strict';

var di = require('di');
var path = require('path');
var httpProxy = require('http-proxy');
var grunt = require('grunt');
var _ = require('lodash');

var injector = new di.Injector([]);

var HttpEvents = require('./http-events');
var Logger = require('./services/logger');
var Mock = require('./modes/mock');
var MockRecord = require('./modes/mockrecord');
var PrismManager = require('./prism-manager');
var PrismProxy = require('./modes/proxy');
var Record = require('./modes/record');
var UrlRewrite = require('./services/url-rewrite');

function Prism(prismManager, logger, urlRewrite, httpEvents, proxy, mock, record, mockRecord) {
  var defaultConfig = {
    port: 80,
    https: false,
    mode: 'proxy',
    mocksPath: './mocks',
    changeOrigin: false,
    rejectUnauthorized: false,
    delay: 0,
    hashFullRequest: false,
    rewrite: {},
    mockFilenameCallback: false
  };

  function validate(config) {
    if (_.isUndefined(config)) {
      logger.error('Prism config is missing.');
      return false;
    }

    if (_.isUndefined(config.name)) {
      logger.error('A name for your prism config is required.');
      return false;
    }

    var mode = config.mode;
    if (!_.contains(['proxy', 'record', 'mock', 'mockrecord'], config.mode)) {
      logger.error('Prism mode: \'' + mode + '\' is invalid.');
      return false;
    }

    var mocksPath = config.mocksPath;
    if (_.isUndefined(mocksPath) || !grunt.file.isDir(mocksPath)) {
      grunt.file.mkdir(mocksPath);
      logger.warn('Mocks path did not exist \'' + mocksPath + '\'.  Created.');
    }

    var targetMocksPath = path.join(mocksPath, config.name);

    if (!grunt.file.isDir(targetMocksPath)) {
      grunt.file.mkdir(targetMocksPath);
      logger.warn('Target mocks path did not exist \'' + targetMocksPath + '\'.  Created.');
    }

    if (_.isUndefined(config.host) || _.isUndefined(config.context)) {
      logger.error('Prism config missing host or context configuration');
      return false;
    }

    if (config.https && config.port === 80) {
      logger.warn('Prism for ' + config.context + ' is using https on port 80. Are you sure this is correct?');
    }
    return true;
  }

  function getRequestHandler(config) {
    switch (config.mode) {
      case 'mock':
        return mock;
      case 'proxy':
      case 'record':
        return proxy;
      case 'mockrecord':
        return mockRecord;
    }
  }

  function getResponseHandler(config) {
    switch (config.mode) {
      case 'record':
      case 'mockrecord':
        return record;
    }
  }

  this.create = function(config) {
    config = _.defaults(config, defaultConfig);

    config.rules = urlRewrite.processRewrites(config.rewrite);

    if (validate(config)) {
      config.requestHandler = getRequestHandler(config).handleRequest;

      //var proxyServer = httpProxy.createProxyServer();
      var proxyServer = new httpProxy.HttpProxy({
        target: config,
        changeOrigin: config.changeOrigin,
        enable: {
          xforward: false // enables X-Forwarded-For
        },
        timeout: undefined
      });

      if (_.contains(['record', 'mockrecord'], config.mode)) {
        config.responseHandler = getResponseHandler(config).handleResponse;
        proxyServer.on('proxyResponse', httpEvents.handleResponse);
      }

      prismManager.add({
        server: proxyServer,
        config: config
      });

      logger.log('Prism created for: ' + config.context + ' to ' + config.host + ':' + config.port);
    }
  };
}

di.annotate(Prism, new di.Inject(PrismManager, Logger, UrlRewrite, HttpEvents, PrismProxy, Mock, Record, MockRecord));

module.exports = Prism;