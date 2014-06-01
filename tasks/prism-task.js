'use strict';

var _ = require('lodash');
var prism = require('../lib/prism');

module.exports = function(grunt) {
    grunt.registerTask('prism', 'Configure any specified connect proxies for prism.', function(target) {
        // setup proxy
        var httpProxy = require('http-proxy');
        var proxyOption;
        var proxyOptions = [];
        prism.resetProxies();
        var proxies = prism.proxies();

        var validateProxyConfig = function(proxyOption) {
            if (_.isUndefined(proxyOption)) {
                grunt.log.error('Prism config is missing.');
                return false;
            }

            var mode = proxyOption.mode;
            if (_.isUndefined(mode) || (mode !== 'record' && mode !== 'read' && mode !== 'proxy')) {
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
        };

        if (target) {
            var prismOptions = grunt.config('prism.' + target + '.options') || [];
            proxyOptions = proxyOptions.concat(prismOptions.proxies || []);
        }

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
                    .on('proxyRes', prism.handleResponse);

                proxies.push({
                    server: proxyServer,
                    config: proxyOption
                });

                grunt.log.writeln('Proxy created for: ' + proxyOption.context + ' to ' + proxyOption.host + ':' + proxyOption.port);
            }
        });
    });
};