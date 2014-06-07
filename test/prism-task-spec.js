'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');

var _ = require('lodash');
var assert = require("assert");

var proxies = require('../lib/proxies.js');
var utils = require('../lib/utils.js');

var requestTimeout = 5000; // 5 seconds

describe('Prism', function() {
  describe('task initialization', function() {
    it('should have initialized 4 proxies', function() {
      assert.equal(4, proxies.proxies().length);
    });

    it('request options should be correctly mapped', function() {
      var proxy = proxies.getProxy('/proxyRequest');

      assert.equal(_.isUndefined(proxy), false);
      assert.equal(proxy.config.mode, 'proxy');
      assert.equal(proxy.config.mocksPath, './mocks');
    });

    it('mode can be overridden', function() {
      var proxy = proxies.getProxy('/proxyOverrideRequest');

      assert.equal(_.isUndefined(proxy), false);
      assert.equal(proxy.config.mode, 'record');
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
      }, function(res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
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
          var proxy = proxies.getProxy(res.req.path);

          assert.equal(_.isUndefined(proxy), false);

          var pathToResponse = path.join(proxy.config.mocksPath, utils.hashUrl(res.req.path));

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

    it('can mock a response', function(done) {
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

    it('can handle a 404 in mock mode', function(done) {
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