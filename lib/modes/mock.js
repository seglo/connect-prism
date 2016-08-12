'use strict';

var _ = require('lodash');
var di = require('di');
var fs = require('fs');

var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var MockFilenameGenerator = require('../services/mock-filename-generator');
var ResponseDelay = require('../services/response-delay');

// TODO: santize the conventions in this module for serialization, http response handling
// and logging
function Mock(logger, prismUtils, mockFilenameGenerator, responseDelay) {

  function getMockPath(req, res, prism) {
    var path = mockFilenameGenerator.getMockPath(prism, req);
    var overridePath = path + '.override';
    // check for override first
    fs.exists(overridePath, function(overrideExists) {
      if (overrideExists) {
        mockResponse(overridePath, prism, req, res);
      } else {
        fs.exists(path, function(mockExists) {
          if (mockExists) {
            mockResponse(path, prism, req, res);
          } else {
            write404(req, res, path);
            serializeEmptyMock(prism, req, path);
            logger.verboseLog('Returned 404 for: ' + req.url);
          }
        });
      }
    });
  }

  function mockResponse(path, prism, req, res) {
    /* delay response with some fake time so mock has behaviour like real world API */
    var scheduleResponse = responseDelay.delayTimeInMs(prism.config.delay);
    setTimeout(function() {
      writeResponse(path, res);
      if (scheduleResponse > 0) {
        logger.verboseLog('Mock response delayed by ' + scheduleResponse + ' ms for: ' + req.url);
      }
      logger.verboseLog('Dispatching request ' + req.url + ' from ' + path);
      logger.logSuccess('Mocked', req, prism);
    }, scheduleResponse);
  }

  // TODO: figure out how to buffer file stream into response
  function writeResponse(path, res) {
    var responseStr = fs.readFileSync(path).toString();
    var response = JSON.parse(responseStr);

    var actualResponse = {
      'Content-Type': response.contentType
    };

    if ('location' in response) {
      actualResponse['Location'] = response.location;
    }

    res.writeHead(response.statusCode, actualResponse);

    var data = response.data;
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    } else if (response.isBase64) {
      data = new Buffer(data, 'base64');
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

  function serializeEmptyMock(prism, req, path) {
    var response = {
      requestUrl: prismUtils.filterUrl(prism.config, req.url),
      contentType: 'application/javascript',
      statusCode: 200,
      data: {}
    };

    path += '.404';

    writeMockToDisk(response, path);
    logger.log('Serialized empty 404 response for ' + req.url + ' to ' + path);
  }

  this.removeOverrideMock = function(prism, mockRequest) {
    var path = mockFilenameGenerator.getMockPath(prism, mockRequest);

    path += '.override';

    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    logger.log('Removed override response for ' + mockRequest.url + ' to ' + path);
  };

  this.serializeOverrideMock = function(prism, override) {
    var req = _.extend({ url: override.mock.requestUrl, body: '' }, override.req);
    var path = mockFilenameGenerator.getMockPath(prism, req);

    path += '.override';

    writeMockToDisk(override.mock, path);
    logger.log('Serialized override response for ' + req.url + ' to ' + path);
  };

  function writeMockToDisk(response, path) {
    var serializedResponse = JSON.stringify(response, true, 2);

    // write file async to disk.  overwrite if it already exists.  prettyprint.
    fs.writeFile(path, serializedResponse);
  }

  this.writeMockToDisk = writeMockToDisk;

  this.handleRequest = function(req, res, prism) {
    if (prism.config.hashFullRequest) {
      prismUtils.getBody(req, function() {
        getMockPath(req, res, prism)
      });
    } else {
      getMockPath(req, res, prism);
    }
  };
}

di.annotate(Mock, new di.Inject(Logger, PrismUtils, MockFilenameGenerator, ResponseDelay));

module.exports = Mock;