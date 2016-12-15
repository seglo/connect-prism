'use strict';

var fs = require('fs');

var Mock = require('./mock');
var PrismUtils = require('../services/prism-utils');
var PrismProxy = require('./proxy');
var MockFilenameGenerator = require('../services/mock-filename-generator');

function MockRecord(prismUtils, mockFilenameGenerator, mock, proxy) {

  this.handleRequest = function(req, res, prism) {
    function handleMockRecordRequest() {

      var path = mockFilenameGenerator.getMockPath(prism, req);

      fs.exists(path, function(exists) {
        if (exists) {
          mock.handleRequest(req, res, prism);
        } else {
          proxy.handleRequest(req, res, prism);
        }
      });
    }

    if (prism.config.hashFullRequest) {
      prismUtils.getBody(req, function() {
        handleMockRecordRequest(req, res, prism)
      });
    } else {
      handleMockRecordRequest(req, res, prism)
    }
  };
}

module.exports = MockRecord;
