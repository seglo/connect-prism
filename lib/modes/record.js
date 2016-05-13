
'use strict';

var _ = require('lodash');
var di = require('di');
var fs = require('fs');
var zlib = require('zlib');

var Logger = require('../services/logger');
var Mock = require('./mock');
var PrismUtils = require('../services/prism-utils');
var MockFilenameGenerator = require('../services/mock-filename-generator');

function Record(logger, prismUtils, mockFilenameGenerator, mock) {

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
      logger.error('An error occurred during decompression: ' + e);
    });
  }

  function serializeResponse(prism, req, res, data) {
    var response = {
      requestUrl: prismUtils.filterUrl(prism.config, res.req.path),
      contentType: res.headers['content-type'],
      statusCode: res.statusCode,
      data: parseJsonResponse(res, data)
    };

    if ('location' in res.headers) {
      response.location = res.headers['location'];
    }

    var path = mockFilenameGenerator.getMockPath(prism, req);

    mock.save(response, path);
    logger.verboseLog('Serialized response for ' + res.req.path + ' to ' + path);
  }

  function parseJsonResponse(res, data) {
    var contentType = res.headers['content-type'];
    if (_.includes(contentType, 'json') || _.includes(contentType, 'javascript')) {
      try {
        return JSON.parse(data);
      } catch (e) {
        logger.verboseLog('Could not parse JSON for response of ' + res.req.path);
      }
    }
    return data;
  }

  this.handleResponse = function(req, res, prism) {
    uncompress(res, function(res, data) {
      var doRecord = true;
      if (prism.config.shouldRecord) {
          doRecord = prism.config.shouldRecord(req, res);
      }
      if (doRecord) {
        serializeResponse(prism, req, res, data);
        logger.logSuccess('Recorded', res.req, prism);
      }
    });
  };
}

di.annotate(Record, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, Mock));

module.exports = Record;