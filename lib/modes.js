'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var grunt = require('grunt');
var _ = require('lodash');

var utils = require('./utils.js');

// TODO: figure out how to buffer file stream into response
function writeResponse(path, res) {
  var responseStr = fs.readFileSync(path).toString();
  var response = JSON.parse(responseStr);

  res.writeHead(response.statusCode, {
    'Content-Type': response.responseHeaders['content-type']
  });
  res.write(response.data);
  res.end();
}

function write404(req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });
  res.write('No mock exists for ' + req.url);
  res.end();
}

function serializeResponse(proxy, res, data) {
  var response = {
    requestUrl: res.req.path,
    responseHeaders: res.headers,
    statusCode: res.statusCode,
    data: data // TODO: if header content-type is JSON then save data as JSON instead of string
  };

  var serializedResponse = JSON.stringify(response, true, 2);

  var requestFilename = utils.hashUrl(res.req.path);

  var finalPath = path.join(proxy.config.mocksPath, requestFilename);

  // write file async to disk.  overwrite if it already exists.  prettyprint.
  fs.writeFile(finalPath, serializedResponse);
}

function logSuccess(modeMsg, proxy, req) {
  var target = utils.absoluteUrl(proxy, req.url);
  var source = req.originalUrl;
  grunt.log.verbose.writeln(modeMsg + ' request: ' + source + ' -> ' + target + '\n' + JSON.stringify(req.headers, true, 2));
}

module.exports = {
  proxy: function(proxy, req, res) {
    var target = utils.absoluteUrl(proxy, req.url);

    proxy.server.web(req, res, {
      target: target
    });

    logSuccess('Proxied', proxy, req);
  },
  record: function(proxy, res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      serializeResponse(proxy, res, data);
      logSuccess('Recorded', proxy, res.req);
    });
  },
  mock: function(proxy, req, res) {
    var diskResponse = path.join(proxy.config.mocksPath, utils.hashUrl(req.url));

    fs.exists(diskResponse, function(exists) {
      if (exists) {
        writeResponse(diskResponse, res);
        logSuccess('Mocked', proxy, req);
      } else {
        write404(req, res);
        grunt.log.verbose.writeln('Returned 404 for: ' + req.url);
      }
    });
  }
};