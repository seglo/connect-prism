'use strict';

var prism = module.exports;

var grunt = require('grunt');
var _ = require('lodash');

var proxies = [];

prism.proxies = function() {
    return proxies;
};

prism.resetProxies = function() {
    proxies = [];
}

// From connect-proxy
prism.matchContext = function(context, url) {
    var positiveContexts, negativeContexts, positiveMatch, negativeMatch;
    var contexts = context;
    if (!_.isArray(contexts)) {
        contexts = [contexts];
    }
    positiveContexts = _.filter(contexts, function(c) {
        return c.charAt(0) !== '!';
    });
    negativeContexts = _.filter(contexts, function(c) {
        return c.charAt(0) === '!';
    });
    // Remove the '!' character from the contexts
    negativeContexts = _.map(negativeContexts, function(c) {
        return c.slice(1);
    });
    negativeMatch = _.find(negativeContexts, function(c) {
        return url.lastIndexOf(c, 0) === 0;
    });
    // If any context negates this url, it must not be proxied.
    if (negativeMatch) {
        return false;
    }
    positiveMatch = _.find(positiveContexts, function(c) {
        return url.lastIndexOf(c, 0) === 0;
    });
    // If there is any positive match, lets proxy this url.
    return positiveMatch != null;
};

prism.handleRequest = function(req, res, next) {
    var proxied = false;

    proxies.forEach(function(proxy) {
        if (!proxied && req && prism.matchContext(proxy.config.context, req.url)) {
            var target = (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + req.url;

            proxy.server.web(req, res, {
                target: target
            });

            // proxying twice would cause the writing to a response header that is already sent. Bad config!
            proxied = true;

            var source = req.originalUrl;
            grunt.log.verbose.writeln('Proxied request: ' + source + ' -> ' + target + '\n' + JSON.stringify(req.headers, true, 2));
        }
    });

    /*    enableWebsocket(req.connection.server);

    proxies.forEach(function(proxy) {
        if (!proxied && req && utils.matchContext(proxy.config.context, req.url)) {
            if (proxy.config.rules.length) {
                proxy.config.rules.forEach(rewrite(req));
            }
            // Add headers present in the config object
            if (proxy.config.headers != null) {
                _.forOwn(proxy.config.headers, function(value, key) {
                    req.headers[key] = value;
                });
            }
            proxy.server.proxyRequest(req, res);
            // proxying twice would cause the writing to a response header that is already sent. Bad config!
            proxied = true;

            var source = req.originalUrl;
            var target = (proxy.server.target.https ? 'https://' : 'http://') + proxy.server.target.host + ':' + proxy.server.target.port + req.url;
            grunt.log.verbose.writeln('Proxied request: ' + source + ' -> ' + target + '\n' + JSON.stringify(req.headers, true, 2));
        }
    });*/
    if (!proxied) {
        next();
    }
};

prism.handleResponse = function(res) {
    console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
    var data = '';
    res.on('data', function(chunk) {
        data += chunk;
    });
    res.on('end', function() {
       prism.serializeResponse(res, data);
    });
};

prism.serializeResponse = function(res, data) {
    var cachedResponse = {
        response: res,
        data: data
    };

    var pathToResponse = 'foo';
};

prism.escapeRoute = function(url) {

};