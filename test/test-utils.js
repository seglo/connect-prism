'use strict';

var _ = require('lodash');
var assert = require('assert');
var fs = require('fs');
var http = require('http');

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
    callback(data);
  });
}

function make_body_tester(value) {
  return function(data, cb){
    console.log('asserting for: ' + value);
    assert.equal(data, value);
    cb();
  };
}

function make_wait_for_file_tester(path, tests) {
  return function(data, cb) {
    console.log("waiting for file: " + path);
    waitForFile(path, function(pathToResponse) {
      console.log("file appeared: " + path);
      var recordedResponse = fs.readFileSync(pathToResponse).toString();
      var deserializedResponse = JSON.parse(recordedResponse);
      if (tests) {
	tests(deserializedResponse);
      }
      else {
	assert.equal(_.isUndefined(deserializedResponse), false);
	assert.equal(deserializedResponse.requestUrl, '/test');
	assert.equal(deserializedResponse.contentType, 'text/html; charset=utf-8');
	assert.equal(deserializedResponse.statusCode, 200);
	assert.equal(deserializedResponse.data, 'a server response');	
      }
      cb();
    });
  };
}


function start_sequential_calls(req_data, values, done) {
  var callback = function(res){
    onEnd(res, function(data) {
      assert.equal(res.statusCode, 200);
      values.shift()(data, function(){
	console.log('after shifting: ');
	console.log(values);
	if (values.length !== 0 ) {
	  start_sequential_calls(req_data, values, done);
	}
	else {
	  done();
	}

      });
    });
  };
  var request = http.request(req_data, callback);
  request.end();
}


module.exports = {
  onEnd: onEnd,
  waitForFile: waitForFile,
  assertPathEqual: function(path1, path2) {
    assert.equal(path1.replace(/\\/g, '/'), path2.replace(/\\/g, '/'));
  },
  make_body_tester: make_body_tester,
  start_sequential_calls: start_sequential_calls,
  make_wait_for_file_tester: make_wait_for_file_tester
};
