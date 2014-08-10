'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var fs = require('fs');
var http = require('http');

var prism = require('../index');
var proxies = require('../lib/proxies');
var utils = require('../lib/utils');
var testUtils = require('./test-utils');
var onEnd = testUtils.onEnd;
var waitForFile = testUtils.waitForFile;

describe('record mode', function() {
  afterEach(function() {
    proxies.reset();
  });

  it('can record a response', function(done) {
    prism.create({
      name: 'recordTest',
      mode: 'record',
      context: '/test',
      host: 'localhost',
      port: 8090
    });

    var recordRequest = '/test';
    var proxy = proxies.getProxy(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, recordRequest);
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    var request = http.request({
      host: 'localhost',
      path: '/test',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
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
    request.end();
  });

  it('can record a JSON response', function(done) {
    prism.create({
      name: 'jsonRecordTest',
      mode: 'record',
      context: '/json',
      host: 'localhost',
      port: 8090
    });

    var recordRequest = '/json';
    var proxy = proxies.getProxy(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, recordRequest);
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    var request = http.request({
      host: 'localhost',
      path: '/json',
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
    var proxy = proxies.getProxy(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, rewrittenRecordRequest);
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    var request = http.request({
      host: 'localhost',
      path: '/test',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
        waitForFile(pathToResponse, function(pathToResponse) {

          var recordedResponse = fs.readFileSync(pathToResponse).toString();
          var deserializedResponse = JSON.parse(recordedResponse);

          assert.equal(_.isUndefined(deserializedResponse), false);
          assert.equal(deserializedResponse.requestUrl, '/rewrite');

          done();
        });
      });
    });
    request.end();
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

  function decompressTest(encoding, done) {
    var recordRequest = '/test';
    var proxy = proxies.getProxy(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, recordRequest);
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    var request = http.request({
      host: 'localhost',
      path: '/test',
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
          assert.equal(deserializedResponse.data, 'a server response');

          done();
        });
      });
    });
    request.end();
  }
});