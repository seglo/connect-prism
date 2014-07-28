'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');
var connect = require('connect');

var _ = require('lodash');
var assert = require("assert");

var proxies = require('../lib/proxies');
var utils = require('../lib/utils');

var requestTimeout = 5000; // 5 seconds

describe('Prism', function() {
  describe('task initialization', function() {
    it('should have initialized 11 proxies', function() {
      assert.equal(11, proxies.proxies().length);
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

  // integration test helpers
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
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
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

  var testCompressedServer = http.createServer(
    connect()
    .use(require('compression')())
    .use(function(req, res) {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.write('a decompressed server response');
      res.end();
    })
  ).listen(8091);

  describe('proxy mode', function() {

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

    it('can delay a proxied response by approximately 50ms', function(done) {
      var startTime = Date.now();
      var request = http.request({
        host: 'localhost',
        path: '/proxyDelayRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          var delta = Date.now() - startTime;
          assert.equal(delta > 40, true);
          assert.equal(delta < 60, true);
          done();
        });
      });

      request.end();
    });

  });

  describe('record mode', function() {

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

    it('can record a response of a rewritten request outside the prism context', function(done) {
      var recordRequest = '/rewriteAndRecordTest/foo';
      var rewrittenRecordRequest = '/bar';
      var proxy = proxies.getProxy(recordRequest);

      assert.equal(_.isUndefined(proxy), false);

      var pathToResponse = utils.getMockPath(proxy, rewrittenRecordRequest);
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/rewriteAndRecordTest/foo',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {

            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.requestUrl, '/bar');

            done();
          });
        });
      });
      request.end();
    });

    it('can record a deflate compressed response', function(done) {
      decompressTest('deflate', done);
    });

    it('can record a gzip compressed response', function(done) {
      decompressTest('gzip', done);
    });

    function decompressTest(encoding, done) {
      var recordRequest = '/compressedResponse';
      var proxy = proxies.getProxy(recordRequest);

      assert.equal(_.isUndefined(proxy), false);

      var pathToResponse = utils.getMockPath(proxy, recordRequest);
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/compressedResponse',
        port: 9000,
        headers: {
          'Accept-Encoding': encoding
        }
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {

            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.data, 'a decompressed server response');

            done();
          });
        });
      });
      request.end();  
    }

  });

  describe('mock mode', function() {

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

    it('can delay a mock response by approximately 50ms', function(done) {
      var startTime = Date.now();
      var request = http.request({
        host: 'localhost',
        path: '/mockDelayRequest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          var delta = Date.now() - startTime;
          assert.equal(delta > 40, true);
          assert.equal(delta < 60, true);
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

  describe('mockrecord mode', function() {
    it('can mock a response', function(done) {
      var request = http.request({
        host: 'localhost',
        path: '/mockRecordTest',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {

          assert.equal(res.req.path, '/mockRecordTest');
          done();
        });
      });
      request.end();
    });

    it('can record a new response', function(done) {
      var recordRequest = '/mockRecordTest/noMockExists';
      var proxy = proxies.getProxy(recordRequest);

      assert.equal(_.isUndefined(proxy), false);

      var pathToResponse = utils.getMockPath(proxy, recordRequest);
      if (fs.existsSync(pathToResponse)) {
        fs.unlinkSync(pathToResponse);
      }

      var request = http.request({
        host: 'localhost',
        path: '/mockRecordTest/noMockExists',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          waitForFile(pathToResponse, function(pathToResponse) {

            var recordedResponse = fs.readFileSync(pathToResponse).toString();
            var deserializedResponse = JSON.parse(recordedResponse);

            assert.equal(_.isUndefined(deserializedResponse), false);
            assert.equal(deserializedResponse.requestUrl, '/mockRecordTest/noMockExists');

            done();
          });
        });
      });
      request.end();
    });
  });
});