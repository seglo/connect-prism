'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var di = require('di');
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var prism = require('../../');
var testUtils = require('../test-utils');
var onEnd = testUtils.onEnd;
var waitForFile = testUtils.waitForFile;

var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

var injector = new di.Injector([]);

// TODO: create test for 303 redirects as described in PR #9
describe('mock mode', function() {
  var manager = prism.manager;
  var mockFilenameGenerator = injector.get(MockFilenameGenerator);

  afterEach(function() {
    manager.reset();
  });

  it('can mock a response', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/readRequest',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
        assert.equal(res.statusCode, 200);
        assert.equal(res.req.path, '/readRequest');
        assert.equal(data, 'a server response');
        done();
      });
    });
    request.end();
  });

  it('can mock a response and choose the first existing response from several directories [choose first]', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: ['./mocksToRead/secondMocksPath', './mocksToRead'],
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/readRequest',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(res.statusCode, 200);
	assert.equal(res.req.path, '/readRequest');
	assert.equal(data, 'the first given path answers');
	done();
      });
    });
    request.end();
  });

  it('can mock a response and choose the first existing response from several directories [choose second]', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: ['mocksToRead/secondMocksPath', 'mocksToRead'],
      context: '/readRequestSecond',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/readRequestSecond',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(res.statusCode, 200);
	assert.equal(res.req.path, '/readRequestSecond');
	assert.equal(data, 'the second given path answers');
	done();
      });
    });
    request.end();

  });

  it('can mock a response additionally searching directories given via a "request-mock-custom-namespace" header', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: ['mocksToRead'],
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/readRequest',
      port: 9000,
      headers: {
	"REQUEST-MOCK-CUSTOM-NAMESPACE": "mocksToRead/secondMocksPath"
      }
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(res.statusCode, 200);
	assert.equal(res.req.path, '/readRequest');
	assert.equal(data, 'the first given path answers');
	done();
      });
    });
    request.end();

  });

  
  it('can delay a mock response by approximately 50ms', function(done) {
    prism.create({
      name: 'mockDelayTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/mockDelayRequest',
      host: 'localhost',
      port: 8090,
      delay: 50
    });

    var startTime = Date.now();
    var request = http.request({
      host: 'localhost',
      path: '/mockDelayRequest',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	var delta = Date.now() - startTime;
	assert.equal(delta > 30, true);
	assert.equal(delta < 70, true);
	done();
      });
    });

    request.end();
  });

  it('can mock a JSON response', function(done) {
    prism.create({
      name: 'jsonMockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/jsonMockRequest',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/jsonMockRequest',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(res.statusCode, 200);
	assert.equal(data, '{"text":"a server response"}');
	done();
      });
    });
    request.end();
  });

  it('can handle a 404 in mock mode', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    });

    var request = http.request({
      host: 'localhost',
      path: '/readRequest/thatDoesntExist',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(res.statusCode, 404);
	assert.equal(res.req.path, '/readRequest/thatDoesntExist');
	assert.equal(data.replace(/\\/g, '/'), 'No mock exists for /readRequest/thatDoesntExist - (mocksToRead/mockTest/9ae58033c4010180f34fcabb83cd463466b8874c.json)'.replace(/\\/g, '/'));
	done();
      });
    });
    request.end();
  });

  it('will create a mock for a 404', function(done) {
    prism.create({
      name: 'mockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    });

    var readRequestThatDoesntExist = '/readRequest/thatDoesntExist';
    var proxy = manager.get(readRequestThatDoesntExist);

    var pathToResponse = mockFilenameGenerator.getMockPath(proxy, {
      url: readRequestThatDoesntExist
    }) + '.404';
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    var request = http.request({
      host: 'localhost',
      path: '/readRequest/thatDoesntExist',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
	waitForFile(pathToResponse, function(pathToResponse) {
	  var recordedResponse = fs.readFileSync(pathToResponse).toString();
	  var deserializedResponse = JSON.parse(recordedResponse);

	  assert.equal(_.isUndefined(deserializedResponse), false);
	  assert.equal(deserializedResponse.requestUrl, '/readRequest/thatDoesntExist');
	  assert.equal(deserializedResponse.contentType, 'application/javascript');
	  assert.equal(deserializedResponse.statusCode, 200);
	  assert.deepEqual(deserializedResponse.data, {});

	  done();
	});
      });
    });
    request.end();
  });

  it('can mock a response with request body', function(done) {
    prism.create({
      name: 'mockPostTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/test',
      host: 'localhost',
      hashFullRequest: true,
      port: 8090
    });

    var postData = querystring.stringify({
      'foo': 'bar'
    });

    var request = http.request({
      host: 'localhost',
      path: '/test',
      port: 9000,
      method: 'POST',
      headers: {
	'Content-Type': 'application/x-www-form-urlencoded',
	'Content-Length': postData.length
      }
    }, function(res) {
      onEnd(res, function(data) {
	assert.equal(data, 'a server response');
	done();
      });
    });
    request.write(postData);
    request.end();
  });
});
