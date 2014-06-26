'use strict';

var path = require('path');
var httpProxy = require('http-proxy');
var grunt = require('grunt');
var _ = require('lodash');
var events = require('./events');
var proxies = require('./proxies');

function validateProxyConfig(proxyOption) {
  if (_.isUndefined(proxyOption)) {
    grunt.log.error('Prism config is missing.');
    return false;
  }

  var mode = proxyOption.mode;
  if (_.isUndefined(mode) || (mode !== 'record' && mode !== 'mock' && mode !== 'proxy')) {
    grunt.log.error('Prism mode: \'' + mode + '\' is invalid.');
    return false;
  }

  var mocksPath = proxyOption.mocksPath;
  if (_.isUndefined(mocksPath) || !grunt.file.isDir(mocksPath)) {
    grunt.file.mkdir(mocksPath);
    grunt.log.warn('Mocks path did not exist \'' + mocksPath + '\'.  Created.');
  }

  var targetMocksPath = path.join(mocksPath, proxyOption._target);

  if (proxyOption._target && !grunt.file.isDir(targetMocksPath)) {
    grunt.file.mkdir(targetMocksPath);
    grunt.log.warn('Target mocks path did not exist \'' + targetMocksPath + '\'.  Created.');
  }

  if (_.isUndefined(proxyOption.host) || _.isUndefined(proxyOption.context)) {
    grunt.log.error('Proxy missing host or context configuration');
    return false;
  }

  if (proxyOption.https && proxyOption.port === 80) {
    grunt.log.warn('Proxy for ' + proxyOption.context + ' is using https on port 80. Are you sure this is correct?');
  }
  return true;
}

module.exports = function(options, target, mode) {
  var proxyConfigs = [];

  options = options || {};

  if (target && options[target]) {
    var prismTargetOptions = options[target].options || {};

    // use target name kind of like 'cassette' feature in VCR
    prismTargetOptions._target = target;

    // set override mode for this target if supplied
    if (mode) {
      prismTargetOptions.mode = mode;
    }

    proxyConfigs.push(prismTargetOptions);
  }

  var rootProxyConfig = options.options || {};

  // if the root prism options are set and we didn't execute a target then add it
  if (rootProxyConfig && !target) {
    rootProxyConfig._target = '_default';
    proxyConfigs.push(rootProxyConfig);
  }

  proxyConfigs.forEach(function(proxyConfig) {
    proxyConfig = _.defaults(proxyConfig, rootProxyConfig, {
      port: 80,
      https: false,
      mode: 'proxy',
      mocksPath: './mocks',
      changeOrigin: false
    });

    if (validateProxyConfig(proxyConfig)) {
      //var proxyServer = httpProxy.createProxyServer();
      var proxyServer = new httpProxy.HttpProxy({
        target: proxyConfig,
        changeOrigin: proxyConfig.changeOrigin,
        enable: {
          xforward: false // enables X-Forwarded-For
        },
        timeout: undefined
      });

      if (proxyConfig.mode === 'record') {
        proxyServer.on('proxyResponse', events.handleResponse);
      }

      proxies.add({
        server: proxyServer,
        config: proxyConfig
      });

      grunt.log.writeln('Proxy created for: ' + proxyConfig.context + ' to ' + proxyConfig.host + ':' + proxyConfig.port);
    }
  });
};