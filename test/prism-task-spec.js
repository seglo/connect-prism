'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');

var _ = require('lodash');
var assert = require("assert");

var proxies = require('../lib/proxies');
var utils = require('../lib/utils');

var requestTimeout = 5000; // 5 seconds

describe('Prism', function() {
  describe('task initialization', function() {
    it('should have initialized 6 proxies', function() {
      assert.equal(6, proxies.proxies().length);
    });

    it('request options should be correctly mapped', function() {
      var proxy = proxies.getProxy('/proxyRequest');

      assert.equal(_.isUndefined(proxy), false);
      assert.equal(proxy.config.mode, 'proxy');
      assert.equal(proxy.config.mocksPath, './mocks');
      assert.equal(proxy.config.context, '/proxyRequest');
      assert.equal(proxy.config.host, 'localhost');
      assert.equal(proxy.config.port, 8090);
      assert.equal(proxy.config.https, false);
      assert.equal(proxy.config.changeOrigin, false);
    });
  });

  describe('proxy modes', function() {
    function onEnd(res, callback) {
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        callback(data);
      });
    }

    function waitForFile(filePath, callback) {
      if (fs.statSync(filePath).size === 0) {
        setTimeout(waitForFile, 0, filePath, callback);
        return;
      }

      callback(filePath);
    }

    var testServer = http.createServer(function(req, res) {
      if (req.url === '/jsonRecordRequest') {
        res.writeHead(200, {
          'Content-Type': 'application/json'
        });
        res.write('{"text": "a server response"}');
      } else if (req.url === '/rewrittenRequest') {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        res.write('a rewritten server response');
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        res.write('a server response');
      }
      res.end();
    }).listen(8090);

    it('can proxy a response', function(done) {
      var request = http.request({
        host: 'localhost',
        path: '/proxyRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'a server response');
          done();
        });
      });
      request.end();
    });

    it('can record a response', function(done) {
      var recordRequest = '/recordRequest';
      var proxy = proxies.getProxy(recordRequest);

      assert.equal(_.isUndefined(proxy), false);

      var pathToResponse = utils.getMockPath(proxy, recordRequest);
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/recordRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {

            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.requestUrl, '/recordRequest');
            assert.equal(deserializedResponse.contentType, 'text/plain');
            assert.equal(deserializedResponse.statusCode, 200);
            assert.equal(deserializedResponse.data, 'a server response');

            done();
          });
        });
      });
      request.end();
    });

    it('can record a JSON response', function(done) {
      var recordRequest = '/jsonRecordRequest';
      var proxy = proxies.getProxy(recordRequest);

      assert.equal(_.isUndefined(proxy), false);

      var pathToResponse = utils.getMockPath(proxy, recordRequest);
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/jsonRecordRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {
            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.data.text, 'a server response');

            done();
          });
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
        onEnd(res, function(data) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.req.path, '/readRequest');
          assert.equal(data, 'a server response');
          done();
        });
      });
      request.end();
    });

    it('can mock a JSON response', function(done) {
      var request = http.request({
        host: 'localhost',
        path: '/jsonMockRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(res.statusCode, 200);
          assert.equal(data, '{"text":"a server response"}');
          done();
        });
      });
      request.end();
    });

    it('can handle a 404 in mock mode', function(done) {
      var request = http.request({
        host: 'localhost',
        path: '/readRequest/thatDoesntExist',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(res.statusCode, 404);
          assert.equal(res.req.path, '/readRequest/thatDoesntExist');
          assert.equal(data, 'No mock exists for /readRequest/thatDoesntExist - (mocksToRead/mockTest/9ae58033c4010180f34fcabb83cd463466b8874c.json)');
          done();
        });
      });
      request.end();
    });

    it('will create a mock for a 404', function(done) {
      var readRequestThatDoesntExist = '/readRequest/thatDoesntExist';
      var proxy = proxies.getProxy(readRequestThatDoesntExist);

      var pathToResponse = utils.getMockPath(proxy, readRequestThatDoesntExist) + '.404';
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/readRequest/thatDoesntExist',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {
            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.requestUrl, '/readRequest/thatDoesntExist');
            assert.equal(deserializedResponse.contentType, 'application/javascript');
            assert.equal(deserializedResponse.statusCode, 200);
            assert.deepEqual(deserializedResponse.data, {});

            done();
          });
        });
      });
      request.end();
    });

    it('can rewrite a request', function(done) {
      var request = http.request({
        host: 'localhost',
        path: '/rewriteRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'a rewritten server response');
          done();
        });
      });
      request.end();
    });
  });
});