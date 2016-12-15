'use strict';

var _ = require('lodash');
var assert = require('assert');
var http = require('http');
var fs = require('fs');
var q = require('q');
var prism = require('../');

var manager = prism.manager;

var PrismUtils = require("../lib/services/prism-utils");
var MockFilenameGenerator = require('../lib/services/mock-filename-generator');

var mockFilenameGenerator = new MockFilenameGenerator(new PrismUtils());

/**
 * Write a file to disk and call the callback only once the file has been closed.
 * Used for maximum compatibility with different platforms.
 */
exports.safeWriteFile = function(filePath, contents, callback) {
  var buffer = new Buffer(contents);
  fs.open(filePath, 'w', function(err, fd) {
    if (err) {
      throw 'error opening file: ' + err;
    } else {
      fs.write(fd, buffer, 0, buffer.length, null, function(err) {
        if (err) {
          throw 'error writing file: ' + err;
        }
        fs.close(fd, function() {
          callback();
        });
      });
    }
  });
};

exports.onEnd = function(res, callback) {
  var data = '';
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    callback(res, data);
  });
};

exports.waitForFile = function(filePath, callback) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    setTimeout(exports.waitForFile, 0, filePath, callback);
    return;
  }

  callback(filePath);
};

exports.assertPathEqual = function(path1, path2) {
  assert.equal(path1.replace(/\\/g, '/'), path2.replace(/\\/g, '/'));
};

exports.deleteMock = function(url) {
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

exports.deleteMocks = function(paths) {
  _.each(paths, function(path) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  });
};

exports.httpPost = function(path, body) {
  return exports.httpCall('POST', path, body);
};

exports.httpGet = function(path, body) {
  return exports.httpCall('GET', path, body);
};

exports.httpCall = function(method, path, body) {
  var deferred = q.defer();
  var options = {
    host: 'localhost',
    path: path,
    port: 9000,
    method: method,
    agent: false
  };
  var cb = function(res) {
    exports.onEnd(res, function(res, data) {
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
