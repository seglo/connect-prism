'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');

var _ = require('lodash');
var assert = require("assert");
var prism = require("../lib/prism.js")

var requestTimeout = 5000; // 5 seconds

describe('Prism', function() {
	describe('task initialization', function() {
		it('should have initialized 1 proxy', function() {
			var proxies = prism.proxies();
			assert.equal(1, proxies.length);
		});

		it('request options should be correctly mapped', function() {
			var requestOptions = _.find(prism.proxies(), function(o) {
				return o.config.context === '/request';
			})

			assert.equal(_.isUndefined(requestOptions), false);
			assert.equal(requestOptions.config.mode, 'record');
			assert.equal(requestOptions.config.mocksPath, './mocks');
		});
	});

	describe('record responses', function() {
		var testServer = http.createServer(function(req, res) {
			res.writeHead(200, {
				'Content-Type': 'text/plain'
			});
			res.write('a server response');
			res.end();
		}).listen(8090);

		it('should proxy a response', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/request',
				port: 9000
			}, function(response) {
				var data = '';
				response.on('data', function(chunk) {
					data += chunk;
				});
				response.on('end', function() {
					assert.equal(data, 'a server response');
					done();
				});
			});
			request.end();
		});

		it('should record a response', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/request',
				port: 9000
			}, function(res) {
				var data = '';
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
					assert.equal(data, 'a server response');
					var proxy = prism.getProxy(res.req.path);

					assert.equal(_.isUndefined(proxy), false);

					var pathToResponse = path.join(proxy.config.mocksPath, encodeURIComponent(res.req.path));

					var waitForFile = function() {
						clearTimeout();
						if (!fs.existsSync(pathToResponse)) {
							setTimeout(20, waitForFile());
						}

						var recordedResponse = fs.readFileSync(pathToResponse).toString();
						var deserializedResponse = JSON.parse(recordedResponse);

						assert.equal(_.isUndefined(deserializedResponse), false);
						assert.equal(deserializedResponse.requestUrl, '/request');
						assert.equal(deserializedResponse.data, 'a server response');

						done();
					};

					waitForFile();
				});
			});
			request.end();
		});
	});
});