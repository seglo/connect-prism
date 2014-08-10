'use strict';

var connect = require('connect');
var fs = require('fs');
var http = require('http');
var prism = require('../../');

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
  waitForFile: waitForFile
};