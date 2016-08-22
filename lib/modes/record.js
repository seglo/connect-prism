
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
    var contentType = res.headers['content-type'];
    var stream = res;

    if (contentEncoding === 'gzip') {
      stream = zlib.createGunzip();
      res.pipe(stream);
    } else if (contentEncoding === 'deflate') {
      stream = zlib.createInflate();
      res.pipe(stream);
    }

    var chunks = [], buffer = '', encoding, isBase64 = false;
    stream.on('data', function(data) {
      chunks.push(data);
    }).on('end', function() {
      if (chunks.length > 0 && chunks[0] instanceof Buffer) {
        buffer = Buffer.concat(chunks);
        if (!_.includes(contentType, 'text') && !prismUtils.isJson(contentType)) {
          encoding = 'base64';
          isBase64 = true;
        }
        buffer = buffer.toString(encoding);
      } else {
        buffer = chunks.join('');
      }
      callback(res, buffer, isBase64);
    }).on('error', function(e) {
      logger.error('An error occurred during decompression: ' + e);
    });
  }

  function serializeResponse(prism, req, res, data, isBase64) {
    var response = {
      requestUrl: prismUtils.filterUrl(prism.config, res.req.path),
      contentType: res.headers['content-type'],
      statusCode: res.statusCode,
      data: parseJsonResponse(res, data),
      isBase64: isBase64
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
    if (prismUtils.isJson(contentType)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        logger.verboseLog('Could not parse JSON for response of ' + res.req.path);
      }
    }
    return data;
  }

  this.handleResponse = function(req, res, prism) {
    uncompress(res, function(res, data, isBase64) {
      var doRecord = true;

      if (prism.config.shouldRecord) {
          doRecord = prism.config.shouldRecord(req, res);
      }
      if (doRecord) {
        serializeResponse(prism, req, res, data, isBase64);
        logger.logSuccess('Recorded', res.req, prism);
      }
    });
  };
}

di.annotate(Record, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, Mock));

module.exports = Record;