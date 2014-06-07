'use strict';

var _ = require('lodash');
var events = require('../lib/events.js');
var proxies = require('../lib/proxies.js');

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
      grunt.log.error('Prism mocksPath: \'' + mocksPath + '\' is invalid.');
      return false;
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
    // setup proxy
    var httpProxy = require('http-proxy');
    var proxyOption;
    var proxyOptions = [];

    if (target) {
      var prismOptions = grunt.config('prism.' + target + '.options') || [];
      // set override mode for this target if supplied
      if (mode) {
        _.forEach(prismOptions.proxies || [], function(proxy) {
          proxy.mode = mode;
        });
      }
      proxyOptions = proxyOptions.concat(prismOptions.proxies || []);
    }

    // TODO: add support to load proxies of each child config if a target isn't provided

    proxyOptions = proxyOptions.concat(grunt.config('prism.options.proxies') || []);

    proxyOptions.forEach(function(proxy) {
      proxyOption = _.defaults(proxy, {
        port: 80,
        https: false,
        mode: 'proxy',
        mocksPath: './mocks'
      });

      if (validateProxyConfig(proxyOption)) {
        var proxyServer = httpProxy.createProxyServer()
          .on('proxyRes', events.handleResponse);

        proxies.add({
          server: proxyServer,
          config: proxyOption
        });

        grunt.log.writeln('Proxy created for: ' + proxyOption.context + ' to ' + proxyOption.host + ':' + proxyOption.port);
      }
    });
  });
};