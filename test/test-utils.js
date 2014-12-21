'use strict';

var _ = require('lodash');
var assert = require('assert');
var di = require('di');
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

module.exports = {
  onEnd: function(res, callback) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      callback(data);
    });
  },
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
  }
};