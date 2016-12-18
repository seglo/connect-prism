'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var prism = require('../../');

var testUtils = require('../test-utils');
var httpGet = testUtils.httpGet;
var httpPost = testUtils.httpPost;
var waitForFile = testUtils.waitForFile;

var PrismUtils = require("../../lib/services/prism-utils");
var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

describe('mock & record mode', function() {
  var manager = prism.manager;
  var prismUtils = new PrismUtils();
  var mockFilenameGenerator = new MockFilenameGenerator(prismUtils);

  afterEach(function() {
    manager.reset();
  });

  // clean up files after spec runs
  after(function() {
    var recordResponse = 'mocksToRead/mockRecordTest/97bb3894d4aa3418d821bdc6f3a9a1ba792739e8.json';
    if (fs.existsSync(recordResponse)) {
      fs.unlinkSync(recordResponse);
    }
    recordResponse = 'mocksToRead/mockRecordTest/41684b2b4abaa44b662bba3284effdfebd55765f.json';
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

    httpGet('/test').then(function(res) {
      assert.equal(res.req.path, '/test');
      done();
    });
  });

  it('can mock a response with request body', function(done) {
    prism.create({
      name: 'mockPostTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/test',
      host: 'localhost',
      hashFullRequest: true,
      port: 8090
    });

    var postData = querystring.stringify({
      'foo': 'bar'
    });

    httpPost('/test', postData).then(function(res) {
      assert.equal(res.req.path, '/test');
      assert.equal(res.body, 'a server response');
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

    httpGet('/json').then(function(res) {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);
        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, '/json');
        done();
      });
    });
  });

  it('can record a post response', function(done) {
    prism.create({
      name: 'mockRecordTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/test_post',
      host: 'localhost',
      hashFullRequest: true,
      port: 8090
    });

    var recordRequest = '/test_post';
    var proxy = manager.get(recordRequest);
    var postData = querystring.stringify({ 'foo': 'bar' });

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: recordRequest,
      body: postData
    });

    httpPost(recordRequest, postData).then(function() {
      waitForFile(pathToResponse, function(pathToResponse) {
        var recordedResponse = fs.readFileSync(pathToResponse).toString();
        var deserializedResponse = JSON.parse(recordedResponse);
        assert.equal(_.isUndefined(deserializedResponse), false);
        assert.equal(deserializedResponse.requestUrl, recordRequest);
        assert.equal(deserializedResponse.statusCode, 200);
        assert.equal(deserializedResponse.data, 'bar');
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

    httpGet(parameterisedRecordRequest).then(function(res) {
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

    httpGet(parameterisedRecordRequest).then(function(res) {
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

    httpGet(parameterisedRecordRequest).then(function(res) {
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
