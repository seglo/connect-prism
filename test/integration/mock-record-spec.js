'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var di = require('di');
var fs = require('fs');
var http = require('http');

var prism = require('../../');

var testUtils = require('./test-utils');
var onEnd = testUtils.onEnd;
var waitForFile = testUtils.waitForFile;

var ResponseHash = require('../../lib/services/response-hash');

var injector = new di.Injector([]);

describe('mock & record mode', function() {
  var manager = prism.manager;
  var responseHashUtils = injector.get(ResponseHash);

  afterEach(function() {
    manager.reset();
  });

  // clean up files after spec runs
  after(function() {
    var recordResponse = 'mocksToRead/mockRecordTest/97bb3894d4aa3418d821bdc6f3a9a1ba792739e8.json';
    if (fs.existsSync(recordResponse)) {
      fs.unlinkSync(recordResponse);
    }
  });

  it('can mock a response', function(done) {
    this.timeout(50000);
    prism.create({
      name: 'mockRecordTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/test',
      host: 'localhost',
      port: 8090
    });

    var proxy = manager.get('/test');

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = responseHashUtils.getMockPath(proxy, {
      url: '/test'
    });

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
    var proxy = manager.get(recordRequest);

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = responseHashUtils.getMockPath(proxy, {
      url: recordRequest
    });

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