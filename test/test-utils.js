'use strict';

var _ = require('lodash');
var assert = require('assert');
var di = require('di');
var http = require('http');
var fs = require('fs');
var q = require('q');
var prism = require('../');

var injector = new di.Injector([]);

var manager = prism.manager;
var mockFilenameGenerator = injector.get(require('../lib/services/mock-filename-generator'));

var testUtils = {};

testUtils.onEnd = function(res, callback) {
  var data = '';
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    callback(res, data);
  });
};

testUtils.waitForFile = function(filePath, callback) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    setTimeout(testUtils.waitForFile, 0, filePath, callback);
    return;
  }

  callback(filePath);
};

testUtils.assertPathEqual = function(path1, path2) {
  assert.equal(path1.replace(/\\/g, '/'), path2.replace(/\\/g, '/'));
};

testUtils.deleteMock = function(url) {
  var prism = manager.get(url);

  assert.equal(_.isUndefined(prism), false);

  var pathToResponse = mockFilenameGenerator.getMockPath(prism, {
    url: url
  });
  if (fs.existsSync(pathToResponse)) {
    fs.unlinkSync(pathToResponse);
  }

  return pathToResponse;
};

testUtils.deleteMocks = function(paths) {
  _.each(paths, function(path) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  });
};

testUtils.httpGet = function(path, cb) {
  var req = http.request({
    host: 'localhost',
    path: path,
    port: 9000
  }, function(res) {
    testUtils.onEnd(res, cb);
  });
  req.end();
};

testUtils.httpPost = function(path, cb, body) {
  if (body) {
    var req = http.request({
      host: 'localhost',
      path: path,
      port: 9000,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': body.length
      }
    }, function(res) {
      testUtils.onEnd(res, cb);
    });
    req.write(body);
    req.end();
  } else {
    var req2 = http.request({
      host: 'localhost',
      path: path,
      port: 9000,
      method: 'POST'
    }, function(res) {
      testUtils.onEnd(res, cb);
    });
    req2.end();
  }
};

testUtils.httpPost2 = function(path, body) {
  return testUtils.httpCall('POST', path, body);
};

testUtils.httpGet2 = function(path, body) {
  return testUtils.httpCall('GET', path, body);
};

testUtils.httpCall = function(method, path, body) {
  var deferred = q.defer();
  var options = {
    host: 'localhost',
    path: path,
    port: 9000,
    method: method,
    agent: false
  };
  var cb = function(res) {
    testUtils.onEnd(res, function(res, data) {
      res.body = data;
      deferred.resolve(res);
    });
  };
  var req;

  if (body) {
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.length
    };
    req = http.request(options, cb);
    req.write(body);
  } else {
    req = http.request(options, cb);
  }
  req.end();
  return deferred.promise;
};

module.exports = testUtils;