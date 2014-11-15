'use strict';

var fs = require('fs');

function MockRecord(logger, prismUtils, mockFilenameGenerator, mock, proxy) {

  this.handleRequest = function(req, res, prism) {
    var path = mockFilenameGenerator.getMockPath(prism, req);

    fs.exists(path, function(exists) {
      if (exists) {
        mock.handleRequest(req, res, prism);
      } else {
        proxy.handleRequest(req, res, prism);
      }
    });
  };
}

module.exports = MockRecord;