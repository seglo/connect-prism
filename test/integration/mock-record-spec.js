'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var di = require('di');
var fs = require('fs');
var http = require('http');

var prism = require('../../');

var testUtils = require('../test-utils');
var httpGet = testUtils.httpGet;
var httpPost = testUtils.httpPost;
var waitForFile = testUtils.waitForFile;

var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

var injector = new di.Injector([]);

describe('mock & record mode', function() {
  var manager = prism.manager;
  var mockFilenameGenerator = injector.get(MockFilenameGenerator);

  afterEach(function() {
    manager.reset();
  });

  // clean up files after spec runs
  after(function() {
    var recordResponse = 'mocksToRead/mockRecordTest/97bb3894d4aa3418d821bdc6f3a9a1ba792739e8.json';
    if (fs.existsSync(recordResponse)) {
      fs.unlinkSync(recordResponse);
    }
    var mockIgnoreRecordResponse = 'mocksToRead/mockIgnoreTest/97bb3894d4aa3418d821bdc6f3a9a1ba792739e8.json';
    if (fs.existsSync(mockIgnoreRecordResponse)) {
      fs.unlinkSync(mockIgnoreRecordResponse);
    }
    mockIgnoreRecordResponse = 'mocksToRead/mockIgnoreTest/338baeea686f54a595eeedab01b0ba558c542ec2.json';
    if (fs.existsSync(mockIgnoreRecordResponse)) {
      fs.unlinkSync(mockIgnoreRecordResponse);
    }
    mockIgnoreRecordResponse = 'mocksToRead/mockIgnoreTest/da9c17fcee76a32e9e4c1ecd8b0363f9e86aca3c.json';
    if (fs.existsSync(mockIgnoreRecordResponse)) {
      fs.unlinkSync(mockIgnoreRecordResponse);
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

    var proxy = manager.get('/test');

    assert.equal(_.isUndefined(proxy), false);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: '/test'
    });

    assert.equal(fs.existsSync(pathToResponse), true);

    httpGet('/test', function(res, data) {
      assert.equal(res.req.path, '/test');
      done();
    });
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

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest
    });

    assert.equal(fs.existsSync(pathToResponse), false);

    httpGet('/json', function(res, data) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);
        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/json');
        done();
      });
    });
  });

  it('can ignore all url parameters', function(done) {
    prism.create({
      name: 'mockIgnoreTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/json',
      host: 'localhost',
      port: 8090,
      ignoreParameters: true
    });

    var recordRequest = '/json';
    var proxy = manager.get(recordRequest);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest
    });

    var parameterisedRecordRequest = '/json?testParam1=abc&testParam2=def';
    var parameterisedProxy = manager.get(parameterisedRecordRequest);

    var pathToParameterisedResponse = mockFilenameGenerator.getMockPath(parameterisedProxy, {
      url: parameterisedRecordRequest
    });

    assert.equal(pathToResponse, pathToParameterisedResponse);

    httpGet(parameterisedRecordRequest, function(res, data) {
      waitForFile(pathToParameterisedResponse, function(pathToParameterisedResponse) {

        var recordedResponse = fs.readFileSync(pathToParameterisedResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, recordRequest);

        done();
      });
    });
  });

  it('can ignore certain parameters', function(done) {
    prism.create({
      name: 'mockIgnoreTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/json',
      host: 'localhost',
      port: 8090,
      ignoreParameters: ['testParam1']
    });

    var recordRequest = '/json?testParam2=def';
    var proxy = manager.get(recordRequest);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest
    });

    var parameterisedRecordRequest = '/json?testParam1=abc&testParam2=def';
    var parameterisedProxy = manager.get(parameterisedRecordRequest);

    var pathToParameterisedResponse = mockFilenameGenerator.getMockPath(parameterisedProxy, {
      url: parameterisedRecordRequest
    });

    assert.equal(pathToResponse, pathToParameterisedResponse);

    httpGet(parameterisedRecordRequest, function(res, data) {
      waitForFile(pathToParameterisedResponse, function(pathToParameterisedResponse) {

        var recordedResponse = fs.readFileSync(pathToParameterisedResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, recordRequest);

        done();
      });
    });
  });

  it('can ignore parameters by regular expression', function(done) {
    prism.create({
      name: 'mockIgnoreTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/json',
      host: 'localhost',
      port: 8090,
      ignoreParameters: /testParam[0-9]?/
    });

    var recordRequest = '/json?anotherParam=ghi';
    var proxy = manager.get(recordRequest);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest
    });

    var parameterisedRecordRequest = '/json?testParam1=abc&testParam2=def&anotherParam=ghi';
    var parameterisedProxy = manager.get(parameterisedRecordRequest);

    var pathToParameterisedResponse = mockFilenameGenerator.getMockPath(parameterisedProxy, {
      url: parameterisedRecordRequest
    });

    assert.equal(pathToResponse, pathToParameterisedResponse);

    httpGet(parameterisedRecordRequest, function(res, data) {
      waitForFile(pathToParameterisedResponse, function(pathToParameterisedResponse) {

        var recordedResponse = fs.readFileSync(pathToParameterisedResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);

        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, recordRequest);

        done();
      });
    });
  });
});