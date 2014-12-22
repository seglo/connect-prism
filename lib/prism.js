'use strict';

var di = require('di');
var forwarded = require('forwarded-for');
var path = require('path');
var util = require('util');
var httpProxy = require('http-proxy');
var grunt = require('grunt');
var _ = require('lodash');

var injector = new di.Injector([]);

var ClearMocks = require('./services/clear-mocks');
var HttpEvents = require('./http-events');
var Logger = require('./services/logger');
var Mock = require('./modes/mock');
var MockRecord = require('./modes/mockrecord');
var PrismManager = require('./prism-manager');
var PrismProxy = require('./modes/proxy');
var PrismUtils = require('./services/prism-utils');
var Record = require('./modes/record');
var UrlRewrite = require('./services/url-rewrite');

function Prism(prismManager, logger, urlRewrite, httpEvents, proxy, mock, record, mockRecord, prismUtils, clearMocks) {
  var defaultConfig = {
    port: 80,
    https: false,
    mode: 'proxy',
    mocksPath: './mocks',
    delay: 0,
    hashFullRequest: false,
    rewrite: {},
    mockFilenameGenerator: 'default',
    ignoreParameters: false,
    clearOnStart: false
  };

  function validate(config) {
    if (_.isUndefined(config)) {
      logger.error('Prism config is missing.');
      return false;
    }

    var name = config.name;
    if (_.isUndefined(name)) {
      logger.error('A name for your prism config is required.');
      return false;
    }

    if (prismManager.getByName(name)) {
      logger.error('A prism by that name has already been created.');
      return false;
    }

    var mode = config.mode;
    if (!prismUtils.isValidMode(mode)) {
      logger.error('Prism mode: \'' + mode + '\' is invalid.');
      return false;
    }

    // avoid any directory writes unless explicitly in mock/record mode
    if (mode !== 'proxy') {
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
    }

    if (_.isUndefined(config.host) || _.isUndefined(config.context)) {
      logger.error('Prism config missing host or context configuration');
      return false;
    }

    if (config.https && config.port === 80) {
      logger.warn('Prism for ' + config.context + ' is using https on port 80. Are you sure this is correct?');
    }

    if (!_.contains(['default', 'humanReadable'], config.mockFilenameGenerator) && !_.isFunction(config.mockFilenameGenerator)) {
      logger.error('Invalid mockFilenameGenerator setting.');
      return false;
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

  var prismInstance = this;
  this.create = function(config) {
    config = _.defaults(config, defaultConfig);

    config.rules = urlRewrite.processRewrites(config.rewrite);

    if (validate(config)) {
      config.requestHandler = getRequestHandler(config).handleRequest;

      var proxyServer = httpProxy.createProxyServer({
        // TODO: support native target URL and deprecate https/host/port/context config
        target: prismUtils.absoluteUrl(config.https, config.host, config.port, config.context),
        xfwd: false, // don't add x-forward headers
        secure: false, // don't verify SSL certs
        prependPath: false // don't prepend path to target context when proxying
      });

      // handle errors from target server
      proxyServer.on('error', function(err, req, res) {
        var address = forwarded(req, req.headers),
          json;
        logger.verboseLog(util.format('[proxy error] %s | %s %s %s', address.ip, req.method, req.url, err.message));
        if (!res.headersSent) {
          res.writeHead(500, {
            'content-type': 'application/json'
          });
        }
        json = {
          error: 'proxy_error',
          reason: err.message
        };
        res.end(JSON.stringify(json));
      });

      if (_.contains(['record', 'mockrecord'], config.mode)) {
        config.responseHandler = getResponseHandler(config).handleResponse;
        proxyServer.on('proxyRes', httpEvents.handleResponse);
      }

      prismManager.add({
        server: proxyServer,
        config: config
      });

      clearMocks.clear(config);
      logger.log('Prism created for: ' + config.context + ' to ' + config.host + ':' + config.port);

      return true;
    }

    return false;
  };
}

di.annotate(Prism, new di.Inject(PrismManager, Logger, UrlRewrite, HttpEvents, PrismProxy, Mock, Record, MockRecord, PrismUtils, ClearMocks));

module.exports = Prism;