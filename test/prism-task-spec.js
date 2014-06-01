'use strict';

var http = require('http');
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
			this.timeout(requestTimeout); // mocha test timeout

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
			this.timeout(requestTimeout); // mocha test timeout

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
	});
});