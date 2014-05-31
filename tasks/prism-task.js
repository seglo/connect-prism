'use strict';

var _ = require('lodash');
var prism = require('../lib/prism');

module.exports = function(grunt) {
    grunt.registerTask('configurePrism', 'Configure any specified connect proxies for prism.', function(target) {
        // setup proxy
        var httpProxy = require('http-proxy');
        var proxyOption;
        var proxyOptions = [];
        prism.resetProxies();
        var proxies = prism.proxies();

        var validateProxyConfig = function(proxyOption) {
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
            var connectOptions = grunt.config('connect.' + target) || [];
            if (typeof connectOptions.appendProxies === 'undefined' || connectOptions.appendProxies) {
                proxyOptions = proxyOptions.concat(grunt.config('connect.proxies') || []);
            }
            proxyOptions = proxyOptions.concat(connectOptions.proxies || []);
        } else {
            proxyOptions = proxyOptions.concat(grunt.config('connect.proxies') || []);
        }

        proxyOptions.forEach(function(proxy) {
            proxyOption = _.defaults(proxy, {
                port: 80,
                https: false,
                changeOrigin: false,
                xforward: false,
                rejectUnauthorized: false,
                rules: [],
                ws: false
            });

            if (validateProxyConfig(proxyOption)) {
                var proxyServer = httpProxy.createProxyServer()
                    .on('proxyRes', prism.spyResponse);

                proxies.push({
                    server: proxyServer,
                    config: proxyOption
                });

                grunt.log.writeln('Proxy created for: ' + proxyOption.context + ' to ' + proxyOption.host + ':' + proxyOption.port);
            }
        });
    });
};