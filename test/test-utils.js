'use strict';

var assert = require('assert');
var fs = require('fs');

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
  }
};