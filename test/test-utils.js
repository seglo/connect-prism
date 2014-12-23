'use strict';

var _ = require('lodash');
var assert = require('assert');
var di = require('di');
var http = require('http');
var fs = require('fs');
var prism = require('../');

var injector = new di.Injector([]);

var manager = prism.manager;
var mockFilenameGenerator = injector.get(require('../lib/services/mock-filename-generator'));

function waitForFile(filePath, callback) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    setTimeout(waitForFile, 0, filePath, callback);
    return;
  }

  callback(filePath);
}

function onEnd(res, callback) {
  var data = '';
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    callback(res, data);
  });
}

module.exports = {
  onEnd: onEnd,
  waitForFile: waitForFile,
  assertPathEqual: function(path1, path2) {
    assert.equal(path1.replace(/\\/g, '/'), path2.replace(/\\/g, '/'));
  },
  deleteMock: function(url) {
    var prism = manager.get(url);

    assert.equal(_.isUndefined(prism), false);

    var pathToResponse = mockFilenameGenerator.getMockPath(prism, {
      url: url
    });
    if (fs.existsSync(pathToResponse)) {
      fs.unlinkSync(pathToResponse);
    }

    return pathToResponse;
  },
  httpGet: function(path, cb) {
    var req = http.request({
      host: 'localhost',
      path: path,
      port: 9000
    }, function(res) {
      onEnd(res, cb);
    });
    req.end();
  },
  httpPost: function(path, cb, body) {
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
        onEnd(res, cb);
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
        onEnd(res, cb);
      });
      req2.end();
    }
  }
};