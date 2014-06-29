'use strict';

var path = require('path');
var httpProxy = require('http-proxy');
var grunt = require('grunt');
var _ = require('lodash');
var events = require('./events');
var proxies = require('./proxies');

function validate(options) {
  if (_.isUndefined(options)) {
    grunt.log.error('Prism config is missing.');
    return false;
  }

  if (_.isUndefined(options.name)) {
    grunt.log.error('A name for your prism options is required.');
    return false;
  }

  var mode = options.mode;
  if (_.isUndefined(mode) || (mode !== 'record' && mode !== 'mock' && mode !== 'proxy')) {
    grunt.log.error('Prism mode: \'' + mode + '\' is invalid.');
    return false;
  }

  var mocksPath = options.mocksPath;
  if (_.isUndefined(mocksPath) || !grunt.file.isDir(mocksPath)) {
    grunt.file.mkdir(mocksPath);
    grunt.log.warn('Mocks path did not exist \'' + mocksPath + '\'.  Created.');
  }

  var targetMocksPath = path.join(mocksPath, options.name);

  if (!grunt.file.isDir(targetMocksPath)) {
    grunt.file.mkdir(targetMocksPath);
    grunt.log.warn('Target mocks path did not exist \'' + targetMocksPath + '\'.  Created.');
  }

  if (_.isUndefined(options.host) || _.isUndefined(options.context)) {
    grunt.log.error('Proxy missing host or context configuration');
    return false;
  }

  if (options.https && options.port === 80) {
    grunt.log.warn('Proxy for ' + options.context + ' is using https on port 80. Are you sure this is correct?');
  }
  return true;
}

module.exports = function(options) {
  options = _.defaults(options, {
    port: 80,
    https: false,
    mode: 'proxy',
    mocksPath: './mocks',
    changeOrigin: false,
    delay: 0
  });

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

    if (options.mode === 'record') {
      proxyServer.on('proxyResponse', events.handleResponse);
    }

    proxies.add({
      server: proxyServer,
      config: options
    });

    grunt.log.writeln('Proxy created for: ' + options.context + ' to ' + options.host + ':' + options.port);
  }
};