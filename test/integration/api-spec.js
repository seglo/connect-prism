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
});