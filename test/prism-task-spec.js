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
			assert.equal(3, proxies.length);
		});

		it('request options should be correctly mapped', function() {
			var requestOptions = _.find(prism.proxies(), function(o) {
				return o.config.context === '/proxyRequest';
			})

			assert.equal(_.isUndefined(requestOptions), false);
			assert.equal(requestOptions.config.mode, 'proxy');
			assert.equal(requestOptions.config.mocksPath, './mocks');
		});
	});

	describe('proxy modes', function() {
		var testServer = http.createServer(function(req, res) {
			res.writeHead(200, {
				'Content-Type': 'text/plain'
			});
			res.write('a server response');
			res.end();
		}).listen(8090);

		it('can proxy a response', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/proxyRequest',
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

		it('can record a response', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/recordRequest',
				port: 9000
			}, function(res) {
				var data = '';
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
					var proxy = prism.getProxy(res.req.path);

					assert.equal(_.isUndefined(proxy), false);

					var pathToResponse = path.join(proxy.config.mocksPath, prism.hashUrl(res.req.path));

					var waitForFile = function() {
						if (fs.statSync(pathToResponse).size === 0) {
							setTimeout(waitForFile, 20);
							return;
						}

						var recordedResponse = fs.readFileSync(pathToResponse).toString();
						var deserializedResponse = JSON.parse(recordedResponse);

						assert.equal(_.isUndefined(deserializedResponse), false);
						assert.equal(deserializedResponse.requestUrl, '/recordRequest');
						assert.equal(deserializedResponse.data, 'a server response');

						done();
					};

					waitForFile();
				});
			});
			request.end();
		});

		it('can read a response', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/readRequest',
				port: 9000
			}, function(res) {
				var data = '';
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
						assert.equal(res.statusCode, 200);
						assert.equal(res.req.path, '/readRequest');
						assert.equal(data, 'a server response');
						done();

				});
			});
			request.end();
		});

		it('can handle a 404 in read mode', function(done) {
			var request = http.request({
				host: 'localhost',
				path: '/readRequestThatDoesntExist',
				port: 9000
			}, function(res) {
				var data = '';
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
						assert.equal(res.statusCode, 404);
						assert.equal(res.req.path, '/readRequestThatDoesntExist');
						assert.equal(data, 'No mock exists for /readRequestThatDoesntExist');
						done();

				});
			});
			request.end();
		});
	});
});