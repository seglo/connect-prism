'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var di = require('di');
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

var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

var injector = new di.Injector([]);

// TODO: create test for 303 redirects as described in PR #9
describe('record mode', function() {
  var manager = prism.manager;
  var mockFilenameGenerator = injector.get(MockFilenameGenerator);

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
});