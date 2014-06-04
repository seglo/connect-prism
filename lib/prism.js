'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var grunt = require('grunt');
var _ = require('lodash');

var prism = module.exports;

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

	var proxy = prism.getProxy(req.url);

	// TODO: move handlers of different modes to new file
	if (proxy) {

		if (proxy.config.mode === 'read') {
			var pathToResponse = path.join(proxy.config.mocksPath, prism.hashUrl(req.url));

			fs.exists(pathToResponse, function(exists) {
				// TODO: figure out how to buffer file stream into response
				if (exists) {
					var responseStr = fs.readFileSync(pathToResponse).toString();
					var response = JSON.parse(responseStr);

					res.writeHead(response.statusCode, {
						'Content-Type': response.responseHeaders['content-type']
					});
					res.write(response.data);
					res.end();
				} else {
					res.writeHead(404, {
						'Content-Type': 'text/plain'
					});
					res.write('No mock exists for ' + req.url);
					res.end();
				}
			});
		} else {
			var target = (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + req.url;

			proxy.server.web(req, res, {
				target: target
			});

			var source = req.originalUrl;
			grunt.log.verbose.writeln('Proxied request: ' + source + ' -> ' + target + '\n' + JSON.stringify(req.headers, true, 2));
		}

	} else {
		next();
	}
};

prism.handleResponse = function(res) {
	grunt.log.verbose.writeln('RAW Response from the target', JSON.stringify(res.headers, true, 2));

	var proxyOption = prism.getProxy(res.req.path)

	if (_.isUndefined(proxyOption) || proxyOption.config.mode !== 'record') {
		return;
	}

	// record mode
	var data = '';
	res.on('data', function(chunk) {
		data += chunk;
	});
	res.on('end', function() {
		prism.serializeResponse(res, data, proxyOption);
	});
};

prism.serializeResponse = function(res, data, proxyOption) {
	var response = {
		requestUrl: res.req.path,
		responseHeaders: res.headers,
		statusCode: res.statusCode,
		data: data // TODO: if header content-type is JSON then save data as JSON instead of string
	};

	var serializedResponse = JSON.stringify(response, true, 2);

	var requestFilename = prism.hashUrl(res.req.path);

	var finalPath = path.join(proxyOption.config.mocksPath, requestFilename);

	// write file async to disk.  overwrite if it already exists.  prettyprint.
	fs.writeFile(finalPath, serializedResponse);
};

prism.hashUrl = function(url) {
	var shasum = crypto.createHash('sha1');
	shasum.update(url);
	return shasum.digest('hex');
};

prism.getProxy = function(path) {
	return _.find(proxies, function(proxy) {
		return prism.matchContext(proxy.config.context, path);
	});
}