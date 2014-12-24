'use strict';

var assert = require('assert');
var di = require('di');
var fs = require('fs');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');

var deleteMock = testUtils.deleteMock;
var httpGet = testUtils.httpGet;
var httpPost = testUtils.httpPost;
var waitForFile = testUtils.waitForFile;

describe('api', function() {
  var manager = prism.manager;

  afterEach(function() {
    manager.reset();
  });

  it('should create a new prism config', function(done) {
    prism.useApi();

    var postData = querystring.stringify({
      "name": "createTest",
      "mode": "proxy",
      "context": "/test",
      "host": "localhost",
      "port": 8090
    });

    httpPost('/_prism/create', function(res, data) {
      assert.equal(data, 'OK');
      httpGet('/test', function(res, data) {
        assert.equal(data, 'a server response');
        done();
      });
    }, postData);
  });

  it('should remove a prism config', function(done) {
    prism.create({
      name: 'removeTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090
    });
    prism.useApi();

    httpPost('/_prism/remove/removeTest', function(res, data) {
      assert.equal(data, 'OK');
      httpGet('/test', function(res, data) {
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

  describe('mock override', function() {
    beforeEach(function() {
      testUtils.deleteMocks([
        // should create a mock override
        './mocks/overrideCreateTest/2723f866830446c640c9cc9942fed2988e0a2c1a.json.override'
        ]);
      fs.writeFile('./mocksToRead/overrideRemoveTest/f133a4599372cf531bcdbfeb1116b9afe8d09b4f.json.override',
        JSON.stringify({
          "requestUrl": "/test",
          "contentType": "text/plain",
          "statusCode": 200,
          "data": "an overidden server response"
        }, null, 2));
    });

    it('should create a mock override', function(done) {
      prism.create({
        name: 'overrideCreateTest',
        mode: 'mock',
        context: '/test',
        host: 'localhost',
        port: 8090
      });
      prism.useApi();

      var postData = JSON.stringify({
        "mock": {
          "requestUrl": "/test",
          "contentType": "text/plain",
          "statusCode": 200,
          "data": "an overidden server response"
        }
      });
      httpPost('/_prism/override/overrideCreateTest/create', function(res, data) {
        assert.equal(data, 'OK');
        httpGet('/test', function(res, data) {
          assert.equal(data, 'an overidden server response');
          done();
        });
      }, postData);
    });

    it('should remove a mock override', function(done) {
      prism.create({
        name: 'overrideRemoveTest',
        mode: 'mock',
        context: '/test',
        host: 'localhost',
        mocksPath: 'mocksToRead',
        port: 8090
      });
      prism.useApi();

      var postData = JSON.stringify({
        "url": "/test",
        "body": ""
      });
      httpPost('/_prism/override/overrideRemoveTest/remove', function(res, data) {
        assert.equal(data, 'OK');
        httpGet('/test', function(res, data) {
          assert.equal(data, 'a server response');
          done();
        });
      }, postData);
    });
  });

describe('set mode', function() {
  beforeEach(function() {
    prism.create({
      name: 'setModeTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090
    });
    prism.useApi();
  });

  it('should change to record mode', function(done) {
    var pathToResponse = deleteMock('/test');

    httpPost('/_prism/setmode/setModeTest/record', function(res, data) {
      assert.equal(data, 'OK');
      httpGet('/test', function(res, data) {
        waitForFile(pathToResponse, function(pathToResponse) {
          assert.equal(fs.existsSync(pathToResponse), true);
          done();
        });
      });
    });
  });

  it('should not accept invalid mode', function(done) {
    httpPost('/_prism/setmode/setModeTest/foo', function(res, data) {
      assert.equal(data, 'An invalid prism mode was given.');
      done();
    });
  });

  it('should not accept invalid name', function(done) {
    httpPost('/_prism/setmode/foo/record', function(res, data) {
      assert.equal(data, 'The prism name specified does not exist.');
      done();
    });
  });
});
});