'use strict';

var assert = require('assert');
var fs = require('fs');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');

var deleteMock = testUtils.deleteMock;
var httpGet = testUtils.httpGet;
var httpPost = testUtils.httpPost;
var waitForFile = testUtils.waitForFile;

describe('api', function() {
  //this.timeout(50000);
  var manager = prism.manager;

  afterEach(function() {
    manager.reset();
  });

  it('should report the correct version', function(done) {
    prism.useApi();

    httpGet('/_prism/version').then(function(res) {
      assert.equal(res.body, require('../../package.json').version);
      done();
    });
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

    httpPost('/_prism/create', postData).then(function(res) {
      assert.equal(res.body, 'OK');
      return httpGet('/test');
    }).then(function(res) {
      assert.equal(res.body, 'a server response');
      done();
    });
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

    httpPost('/_prism/remove/removeTest').then(function(res) {
      assert.equal(res.body, 'OK');
      return httpGet('/test');
    }).then(function(res) {
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  describe('mock override', function() {
    beforeEach(function(done) {
      testUtils.deleteMocks([
        // should create a mock override
        './mocks/overrideCreateTest/2723f866830446c640c9cc9942fed2988e0a2c1a.json.override'
      ]);

      var mockPath = './mocksToRead/overrideRemoveTest/f133a4599372cf531bcdbfeb1116b9afe8d09b4f.json.override';
      var mockContents = JSON.stringify({
        "requestUrl": "/test",
        "contentType": "text/plain",
        "statusCode": 200,
        "data": "an overidden server response"
      }, null, 2);

      testUtils.safeWriteFile(mockPath, mockContents, done);
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
      httpPost('/_prism/override/overrideCreateTest/create', postData).then(function(res) {
        assert.equal(res.body, 'OK');
        return httpGet('/test');
      }).then(function(res) {
        assert.equal(res.body, 'an overidden server response');
        done();
      });
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
      httpPost('/_prism/override/overrideRemoveTest/remove', postData).then(function(res) {
        assert.equal(res.body, 'OK');
        return httpGet('/test');
      }).then(function(res) {
        assert.equal(res.body, 'a server response');
        done();
      });
    });

    it('should clear all mock overrides', function(done) {
      prism.create({
        name: 'overrideRemoveTest',
        mode: 'mock',
        context: '/test',
        host: 'localhost',
        mocksPath: 'mocksToRead',
        port: 8090
      });
      prism.useApi();

      httpPost('/_prism/override/overrideRemoveTest/clear').then(function(res) {
        assert.equal(res.body, 'OK');
        return httpGet('/test');
      }).then(function(res) {
        assert.equal(res.body, 'a server response');
        done();
      });
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

      httpPost('/_prism/setmode/setModeTest/record').then(function(res) {
        assert.equal(res.body, 'OK');
        return httpGet('/test');
      }).then(function(res) {
        waitForFile(pathToResponse, function(pathToResponse) {
          assert.equal(fs.existsSync(pathToResponse), true);
          done();
        });
      });
    });

    it('should not accept invalid mode', function(done) {
      httpPost('/_prism/setmode/setModeTest/foo').then(function(res) {
        assert.equal(res.body, 'An invalid prism mode was given.');
        done();
      });
    });

    it('should not accept invalid name', function(done) {
      httpPost('/_prism/setmode/foo/record').then(function(res) {
        assert.equal(res.body, 'The prism name specified does not exist.');
        done();
      });
    });
  });
});
