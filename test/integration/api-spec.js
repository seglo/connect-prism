'use strict';

var assert = require('assert');
var di = require('di');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');

describe('api', function() {
  var manager = prism.manager;

  afterEach(function() {
    manager.reset();
  });

  it('should use api to change to record mode', function(done) {
    prism.create({
      name: 'setModeTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090
    });
    prism.useApi();

    var pathToResponse = testUtils.deleteMock('/test');
    assert.equal(fs.existsSync(pathToResponse), false);

    var apiReq = http.request({
      host: 'localhost',
      path: '/_prism/setmode/setModeTest/record',
      port: 9000,
      method: 'POST'
    }, function(res) {
      testUtils.onEnd(res, function(data) {
        assert.equal(data, 'OK');

        var request = http.request({
          host: 'localhost',
          path: '/test',
          port: 9000
        }, function(res) {
          testUtils.onEnd(res, function(data) {
            testUtils.waitForFile(pathToResponse, function(pathToResponse) {

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
});