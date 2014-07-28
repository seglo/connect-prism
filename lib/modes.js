'use strict';

var fs = require('fs');
var zlib = require('zlib');
var grunt = require('grunt');
var _ = require('lodash');
var httpProxy = require('http-proxy');

var utils = require('./utils');

// TODO: figure out how to buffer file stream into response
function writeResponse(path, res) {
  var responseStr = fs.readFileSync(path).toString();
  var response = JSON.parse(responseStr);

  res.writeHead(response.statusCode, {
    'Content-Type': response.contentType
  });

  var data = response.data;
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }

  res.write(data);
  res.end();
}

function write404(req, res, path) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });
  res.write('No mock exists for ' + req.url + ' - (' + path + ')');
  res.end();
}

function parseJsonResponse(res, data) {
  var contentType = res.headers['content-type'];
  if (_.contains(contentType, 'json') || _.contains(contentType, 'javascript')) {
    try {
      return JSON.parse(data);
    } catch (e) {
      grunt.log.verbose.writeln('Could not parse JSON for response of ' + res.req.path);
    }
  }
  return data;
}

function writeMockToDisk(response, path) {
  var serializedResponse = JSON.stringify(response, true, 2);

  // write file async to disk.  overwrite if it already exists.  prettyprint.
  fs.writeFile(path, serializedResponse);
}

function serializeResponse(proxy, res, data) {
  var response = {
    requestUrl: res.req.path,
    contentType: res.headers['content-type'],
    statusCode: res.statusCode,
    data: parseJsonResponse(res, data)
  };

  var path = utils.getMockPath(proxy, res.req.path);

  writeMockToDisk(response, path);
  grunt.log.writeln('Serialized response for ' + res.req.path + ' to ' + path);
}

function serializeEmptyMock(proxy, req, path) {
  var response = {
    requestUrl: req.url,
    contentType: 'application/javascript',
    statusCode: 200,
    data: {}
  };

  path += '.404';

  writeMockToDisk(response, path);
  grunt.log.writeln('Serialized empty 404 response for ' + req.url + ' to ' + path);
}

function logSuccess(modeMsg, proxy, req) {
  var target = utils.absoluteUrl(proxy, req.url ? req.url : req.path);
  grunt.log.verbose.writeln(modeMsg + ' request: ' + target);
}

function calculateDelayTime(mode) {
  if (!mode || mode === undefined) {
    return 0;
  } else if (!isNaN(mode)) {
    return mode;
  } else {
    var lowerBound = 1;
    var upperBound = 1;
    switch (mode) {
      case 'auto':
        lowerBound = 500;
        upperBound = 1750;
        break;
      case 'fast':
        lowerBound = 150;
        upperBound = 1000;
        break;
      case 'slow':
        lowerBound = 1500;
        upperBound = 3000;
        break;
    }
    return Math.floor((Math.random() * upperBound) + lowerBound);
  }
}

function proxyResponse(proxy, req, res, buffer) {
  var target = utils.absoluteUrl(proxy, req.url);
  proxy.server.proxyRequest(req, res, buffer);
  logSuccess('Proxied', proxy, req);
}

function mockResponse(path, proxy, req, res) {
  /*** delay response with some fake time so mock has behaviour like real world API ***/
  var scheduleResponse = calculateDelayTime(proxy.config.delay);
  setTimeout(function() {
    writeResponse(path, res);
    if (scheduleResponse > 0) {
      grunt.log.verbose.writeln('Mock response delayed by ' + scheduleResponse + ' ms for: ' + req.url);
    }
    grunt.log.writeln('Dispatching request ' + req.url + ' from ' + path);
    logSuccess('Mocked', proxy, req);
  }, scheduleResponse);
}

function uncompress(res, callback) {
  var contentEncoding = res.headers['content-encoding'];

  var method = res;

  if (contentEncoding === 'gzip') {
    method = zlib.createGunzip();
    res.pipe(method);
  } else if (contentEncoding === 'deflate') {
    method = zlib.createInflate();
    res.pipe(method);
  }

  var buffer = [];
  method.on('data', function(data) {
    buffer.push(data.toString());
  }).on("end", function() {
    callback(res, buffer.join(''));
  }).on("error", function(e) {
    grunt.log.error('An error occurred during decompression: ' + e);
  });
}

module.exports = {
  proxy: function(proxy, req, res) {
    /*** add latency to proxy request ***/
    var scheduleProxyRequest = calculateDelayTime(proxy.config.delay);
    var buffer = httpProxy.buffer(req);

    setTimeout(function() {
      if (scheduleProxyRequest > 0) {
        grunt.log.verbose.writeln('Proxy request delayed by ' + scheduleProxyRequest + ' ms for: ' + req.url);
      }
      proxyResponse(proxy, req, res, buffer);
    }, scheduleProxyRequest);
  },
  record: function(proxy, res) {
    uncompress(res, function(res, data) {
      serializeResponse(proxy, res, data);
      logSuccess('Recorded', proxy, res.req);
    });
  },
  mock: function(proxy, req, res) {
    var path = utils.getMockPath(proxy, req.url);

    fs.exists(path, function(exists) {
      if (exists) {
        mockResponse(path, proxy, req, res);
      } else {
        write404(req, res, path);
        serializeEmptyMock(proxy, req, path);
        grunt.log.verbose.writeln('Returned 404 for: ' + req.url);
      }
    });
  },
  mockrecord: function(proxy, req, res) {
    var path = utils.getMockPath(proxy, req.url);

    fs.exists(path, function(exists) {
      if (exists) {
        mockResponse(path, proxy, req, res);
      } else {
        proxyResponse(proxy, req, res);
      }
    });
  }
};