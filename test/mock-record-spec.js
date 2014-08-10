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

describe('mock & record mode', function() {
  afterEach(function() {
    proxies.reset();
  });

  // clean up files after spec runs
  after(function() {
    var recordResponse = 'mocksToRead/mockRecordTest/97bb3894d4aa3418d821bdc6f3a9a1ba792739e8.json';
    if (fs.existsSync(recordResponse)) {
      fs.unlinkSync(recordResponse);
    }
  });

  it('can mock a response', function(done) {
    prism.create({
      name: 'mockRecordTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/test',
      host: 'localhost',
      port: 8090
    });

    var proxy = proxies.getProxy('/test');

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, '/test');

    assert.equal(fs.existsSync(pathToResponse), true);

    var request = http.request({
      host: 'localhost',
      path: '/test',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {

        assert.equal(res.req.path, '/test');
        done();
      });
    });
    request.end();
  });

  it('can record a new response', function(done) {
    prism.create({
      name: 'mockRecordTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/json',
      host: 'localhost',
      port: 8090
    });

    var recordRequest = '/json';
    var proxy = proxies.getProxy(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = utils.getMockPath(proxy, recordRequest);

    assert.equal(fs.existsSync(pathToResponse), false);

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
          assert.equal(deserializedResponse.requestUrl, '/json');

          done();
        });
      });
    });
    request.end();
  });
});