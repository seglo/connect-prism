'use strict';

var httpProxy = require('http-proxy');
var _ = require('lodash');
var events = require('../lib/events');
var proxies = require('../lib/proxies');

module.exports = function(grunt) {
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
      grunt.log.warn('Mocks path did not exist \'' + mocksPath + '\'  Attempting to create...');
      grunt.file.mkdir(mocksPath);
    }

    if (_.isUndefined(proxyOption.host) || _.isUndefined(proxyOption.context)) {
      grunt.log.error('Proxy missing host or context configuration');
      return false;
    }

    if (proxyOption.https && proxyOption.port === 80) {
      grunt.log.warn('Proxy  for ' + proxyOption.context + ' is using https on port 80. Are you sure this is correct?');
    }
    return true;
  }

  grunt.registerTask('prism', 'Configure any specified connect proxies for prism.', function(target, mode) {
    var proxyConfigs = [];

    if (target) {
      var prismTargetOptions = grunt.config('prism.' + target + '.options') || {};
      // set override mode for this target if supplied
      if (mode) {
        prismTargetOptions.mode = mode;
      }

      proxyConfigs.push(prismTargetOptions);
    }

    var rootProxyConfig = grunt.config('prism.options');

    // if the root prism options are set, add'm
    if (rootProxyConfig) {
      proxyConfigs.push(rootProxyConfig);
    }

    proxyConfigs.forEach(function(proxyConfig) {
      proxyConfig = _.defaults(proxyConfig, {
        port: 80,
        https: false,
        mode: 'proxy',
        mocksPath: './mocks'
      });

      if (validateProxyConfig(proxyConfig)) {
        var proxyServer = httpProxy.createProxyServer()
          .on('proxyRes', events.handleResponse);

        proxies.add({
          server: proxyServer,
          config: proxyConfig
        });

        grunt.log.writeln('Proxy created for: ' + proxyConfig.context + ' to ' + proxyConfig.host + ':' + proxyConfig.port);
      }
    });
  });
};