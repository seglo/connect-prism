'use strict';

var assert = require('assert');
var di = require('di');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');

var deleteMock = testUtils.deleteMock;
var onEnd = testUtils.onEnd;
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

      var apiReq = http.request({
        host: 'localhost',
        path: '/_prism/setmode/setModeTest/record',
        port: 9000,
        method: 'POST'
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'OK');

          var request = http.request({
            host: 'localhost',
            path: '/test',
            port: 9000
          }, function(res) {
            onEnd(res, function(data) {
              waitForFile(pathToResponse, function(pathToResponse) {
                assert.equal(fs.existsSync(pathToResponse), true);

                done();
              });
            });
          });
          request.end();

        });
      });
      apiReq.end();
    });

    it('should not accept invalid mode', function(done) {
      var apiReq = http.request({
        host: 'localhost',
        path: '/_prism/setmode/setModeTest/foo',
        port: 9000,
        method: 'POST'
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'An invalid prism mode was given.');
          done();
        });
      });
      apiReq.end();
    });

    it('should not accept invalid name', function(done) {
      var apiReq = http.request({
        host: 'localhost',
        path: '/_prism/setmode/foo/record',
        port: 9000,
        method: 'POST'
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'The prism name specified does not exist.');
          done();
        });
      });
      apiReq.end();
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

  var apiReq = http.request({
    host: 'localhost',
    path: '/_prism/create',
    port: 9000,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  }, function(res) {
    onEnd(res, function(data) {
      assert.equal(data, 'OK');

      var request = http.request({
        host: 'localhost',
        path: '/test',
        port: 9000
      }, function(res) {
        onEnd(res, function(data) {
          assert.equal(data, 'a server response');
          done();
        });
      });
      request.end();

    });
  });
  apiReq.write(postData);
  apiReq.end();
});
});