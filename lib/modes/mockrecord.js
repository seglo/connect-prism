'use strict';

var di = require('di');
var fs = require('fs');

var Logger = require('../services/logger');
var Mock = require('./mock');
var PrismUtils = require('../services/prism-utils');
var PrismProxy = require('./proxy');
var ResponseHash = require('../services/response-hash');

function MockRecord(logger, prismUtils, responseHash, mock, proxy) {

  this.handleRequest = function(req, res, prism) {
    var path = responseHash.getMockPath(prism, req);

    fs.exists(path, function(exists) {
      if (exists) {
        mock.handleRequest(req, res, prism);
      } else {
        proxy.handleRequest(req, res, prism);
      }
    });
  };
}

di.annotate(MockRecord, new di.Inject(Logger, PrismUtils, ResponseHash, Mock, PrismProxy));

module.exports = MockRecord;