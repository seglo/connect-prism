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

  it('should use api to change to record mode', function(done) {
    prism.create({
      name: 'setModeTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090
    });
    prism.useApi();

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
});