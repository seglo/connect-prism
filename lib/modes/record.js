'use strict';

var _ = require('lodash');
var di = require('di');
var fs = require('fs');
var httpProxy = require('http-proxy');
var zlib = require('zlib');

var Logger = require('./logger');
var PrismUtils = require('./prism-utils');
var ResponseHash = require('./response-hash');

function Record(logger, prismUtils, responseHash) {

  function uncompress(res, callback) {
    var contentEncoding = res.headers['content-encoding'];

    var stream = res;

    if (contentEncoding === 'gzip') {
      stream = zlib.createGunzip();
      res.pipe(stream);
    } else if (contentEncoding === 'deflate') {
      stream = zlib.createInflate();
      res.pipe(stream);
    }

    var buffer = [];
    stream.on('data', function(data) {
      buffer.push(data.toString());
    }).on('end', function() {
      callback(res, buffer.join(''));
    }).on('error', function(e) {
      logger.log('An error occurred during decompression: ' + e);
    });
  }

  function serializeResponse(prism, req, res, data) {
    var response = {
      requestUrl: res.req.path,
      contentType: res.headers['content-type'],
      statusCode: res.statusCode,
      data: parseJsonResponse(res, data)
    };

    var path = responseHash.getMockPath(prism, req);

    writeMockToDisk(response, path);
    logger.log('Serialized response for ' + res.req.path + ' to ' + path);
  }

  function parseJsonResponse(res, data) {
    var contentType = res.headers['content-type'];
    if (_.contains(contentType, 'json') || _.contains(contentType, 'javascript')) {
      try {
        return JSON.parse(data);
      } catch (e) {
        logger.verboseLog('Could not parse JSON for response of ' + res.req.path);
      }
    }
    return data;
  }

  // TODO: re-factor to remove dupe in mock.js, record.js
  function writeMockToDisk(response, path) {
    var serializedResponse = JSON.stringify(response, true, 2);

    // write file async to disk.  overwrite if it already exists.  prettyprint.
    fs.writeFile(path, serializedResponse);
  }

  this.handleResponse = function(req, res, prism) {
    uncompress(res, function(res, data) {
      serializeResponse(prism, req, res, data);
      logger.logSuccess('Recorded', res.req, prism);
    });
  };
}

di.annotate(Record, new di.Inject(Logger, PrismUtils, ResponseHash));

module.exports = Record;