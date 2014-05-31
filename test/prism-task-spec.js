'use strict';

var http = require('http');
var assert = require("assert");
var prism = require("../lib/prism.js")

var requestTimeout = 5000; // 5 seconds

describe('Prism', function() {
	describe('task initialization', function() {
		it(' should map correct config to http proxy', function() {
			var proxies = prism.proxies();
			assert.equal(1, proxies.length);
		});
	});

	describe('record responses', function() {
		it('should proxy a response', function(done) {
			this.timeout(requestTimeout);
			http.createServer(function(req, res) {
				res.writeHead(200, {
					'Content-Type': 'text/plain'
				});
				res.write('a server response');
				res.end();
			}).listen(8090);

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
					console.log('asserted response: ' + data);
					assert.equal(data, 'a server response');
					done();
				});
			});
			//request.setTimeout(requestTimeout);
			request.end();
		});
	});
});