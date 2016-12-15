'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');

var deleteMock = testUtils.deleteMock;
var onEnd = testUtils.onEnd;
var httpGet = testUtils.httpGet;
var httpPost = testUtils.httpPost;
var waitForFile = testUtils.waitForFile;

var PrismUtils = require("../../lib/services/prism-utils");
var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

// TODO: create test for 303 redirects as described in PR #9
describe('record mode', function() {
  var manager = prism.manager;
  var prismUtils = new PrismUtils();
  var mockFilenameGenerator = new MockFilenameGenerator(prismUtils);

  afterEach(function() {
    manager.reset();
  });

  it('can record a response', function(done) {
    prism.create({
      name: 'recordTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      port: 8090
    });

    var pathToResponse = deleteMock('/test');

    httpGet('/test').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {

        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/test');
        assert.equal(deserializedResponse.contentType, 'text/html; charset=utf-8');
        assert.equal(deserializedResponse.statusCode, 200);
        assert.equal(deserializedResponse.data, 'a server response');
        assert.equal(deserializedResponse.headers, undefined, "should not have header but does");

        done();
      });
    });
  });

  it('can record a response with specific header', function(done) {
    prism.create({
      name: 'recordTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      recordHeaders: ["X-Header-1"],
      port: 8090
    });

    var pathToResponse = deleteMock('/test');

    httpGet('/test').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {

        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/test');
        assert.equal(deserializedResponse.contentType, 'text/html; charset=utf-8');
        assert.equal(deserializedResponse.statusCode, 200);
        assert.equal(deserializedResponse.data, 'a server response');
        assert.equal(deserializedResponse.headers['x-header-1'], "Recorded", "should have header 'X-Header-1: Recorded' but does not");
        assert.equal(deserializedResponse.headers['x-header-2'], undefined, "should not have header 'X-Header-2: Recorded' but does");

        done();
      });
    });
  });

  it('can record a response with specific all headers', function(done) {
    prism.create({
      name: 'recordTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      recordHeaders: true,
      port: 8090
    });

    var pathToResponse = deleteMock('/test');

    httpGet('/test').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {

        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/test');
        assert.equal(deserializedResponse.contentType, 'text/html; charset=utf-8');
        assert.equal(deserializedResponse.statusCode, 200);
        assert.equal(deserializedResponse.data, 'a server response');
        assert.equal(deserializedResponse.headers['x-header-1'], "Recorded", "should have header 'X-Header-1: Recorded' but does not");
        assert.equal(deserializedResponse.headers['x-header-2'], "Recorded", "should have header 'X-Header-2: Recorded' but does not");

        done();
      });
    });
  });

  it('can record a JSON response', function(done) {
    prism.create({
      name: 'jsonRecordTest',
      mode: 'record',
      context: '/json',
      host: 'localhost',
      port: 8090
    });

    var pathToResponse = deleteMock('/json');

    httpGet('/json').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.data.text, 'a server response');

        done();
      });
    });
  });

  it('can record a binary response', function(done) {
    prism.create({
      name: 'binaryRecordTest',
      mode: 'record',
      context: '/binary',
      host: 'localhost',
      port: 8090
    });

    var pathToResponse = deleteMock('/binary');

    httpGet('/binary').then(function(res, data) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var buffer = fs.readFileSync('mocksToRead/binaryMockTest/chrome-24x24.png');
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.isBase64, true);
        // compare base64-encoded buffers
        assert.equal(deserializedResponse.data, buffer.toString('base64'));

        done();
      });
    });
  });

  it('can record an image response', function(done) {
    prism.create({
      name: 'imageRecordTest',
      mode: 'record',
      context: '/image',
      host: 'localhost',
      port: 8090
    });

    var pathToResponse = deleteMock('/image');

    httpGet('/image').then(function(res, data) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var buffer = fs.readFileSync('mocksToRead/binaryMockTest/chrome-24x24.png');
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.isBase64, true);
        // compare buffers
        assert.equal(deserializedResponse.data, buffer.toString('base64'));

        done();
      });
    });
  });

  it('can record a response of a rewritten request outside the prism context', function(done) {
    prism.create({
      name: 'rewriteAndRecordTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      port: 8090,
      rewrite: {
        '^/test': '/rewrite',
      }
    });

    var recordRequest = '/test';
    var rewrittenRecordRequest = '/rewrite';
    var proxy = manager.get(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: rewrittenRecordRequest
    });

    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    httpGet('/test').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {

        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/rewrite');

        done();
      });
    });
  });

  function decompressTest(encoding, done) {
    var pathToResponse = deleteMock('/test');

    var request = http.request({
      host: 'localhost',
      path: '/test',
      port: 9000,
      headers: {
        'Accept-Encoding': encoding
      }
    }, function(res) {
      onEnd(res, function(res, data) {
        waitForFile(pathToResponse, function(pathToResponse) {

          var recordedResponse = fs.readFileSync(pathToResponse).toString();
          var deserializedResponse = JSON.parse(recordedResponse);

          assert.equal(_.isUndefined(deserializedResponse), false);
          assert.equal(deserializedResponse.data, 'a server response');

          done();
        });
      });
    });
    request.end();
  }

  it('can record a deflate compressed response', function(done) {
    prism.create({
      name: 'compressedResponse',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      port: 8091 // uses test-server-compression.js
    });

    decompressTest('deflate', done);
  });

  it('can record a gzip compressed response', function(done) {
    prism.create({
      name: 'compressedResponse',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      port: 8091 // uses test-server-compression.js
    });

    decompressTest('gzip', done);
  });

  it('can record a post response', function(done) {
    //this.timeout(50000);
    prism.create({
      name: 'recordPostTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      hashFullRequest: true,
      port: 8090
    });

    var recordRequest = '/test';
    var proxy = manager.get(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var postData = querystring.stringify({
      'foo': 'bar'
    });

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest,
      body: postData
    });

    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    httpPost('/test', postData).then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/test');

        done();
      });
    });
  });
});
