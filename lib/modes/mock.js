'use strict';

var _ = require('lodash');
var fs = require('fs');
var q = require('q');

var Logger = require('../services/logger');
var PrismUtils = require('../services/prism-utils');
var MockFilenameGenerator = require('../services/mock-filename-generator');
var ResponseDelay = require('../services/response-delay');

function Mock(logger, prismUtils, mockFilenameGenerator, responseDelay) {

  function delayResponse(path, prism, req, res) {
    var scheduleResponse = responseDelay.delayTimeInMs(prism.config.delay);
    setTimeout(function() {
      writeHttpResponse(path, res);
      if (scheduleResponse > 0) {
        logger.verboseLog('Mock response delayed by ' + scheduleResponse + ' ms for: ' + req.url);
      }
      logger.verboseLog('Dispatching request ' + req.url + ' from ' + path);
      logger.logSuccess('Mocked', req, prism);
    }, scheduleResponse);
  }

  // TODO: figure out how to buffer file stream into response
  function writeHttpResponse(path, res) {
    var responseStr = fs.readFileSync(path).toString();
    var response = JSON.parse(responseStr);
    var encoding = 'utf8';
    var contentType = response.contentType;

    var actualResponse = {};

    if(response.headers) {
      _.assign(actualResponse, response.headers);
    }

    if (response.contentType) {
      actualResponse['Content-Type'] = response.contentType;
    }

    if ('location' in response) {
      actualResponse['Location'] = response.location;
    }

    res.writeHead(response.statusCode, actualResponse);

    var data = response.data;
    if( contentType == 'image/jpeg' || contentType == 'image/jpg' || contentType == 'image/png' || contentType == 'image/gif' ) {
      data = new Buffer(data, 'base64');
    }
    else if (typeof data !== 'string') {
      data = JSON.stringify(data);
    } else if (response.isBase64) {
      data = new Buffer(data, 'base64');
    }

    res.write(data);
    res.end();
  }

  function write404HttpResponse(req, res, path) {
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

    save(response, path);
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
    var req = _.extend({
      url: override.mock.requestUrl,
      body: ''
    }, override.req);
    var path = mockFilenameGenerator.getMockPath(prism, req);

    path += '.override';

    save(override.mock, path);
    logger.log('Serialized override response for ' + req.url + ' to ' + path);
  };

  function save(response, path) {
    var serializedResponse = JSON.stringify(response, true, 2);

    // write file async to disk.  overwrite if it already exists.  prettyprint.
    fs.writeFile(path, serializedResponse, _.noop);
  }

  this.save = save;

  this.handleRequest = function(req, res, prism) {
    var exists = q.nfbind(fs.exists);

    function handleMockRequest() {
      var path = mockFilenameGenerator.getMockPath(prism, req);
      var overridePath = path + '.override';

      // check for override first
      fs.exists(overridePath, function(overrideExists) {
        if (overrideExists) {
          delayResponse(overridePath, prism, req, res);
        } else {
          fs.exists(path, function(mockExists) {
            if (mockExists) {
              delayResponse(path, prism, req, res);
            } else {
              write404HttpResponse(req, res, path);
              serializeEmptyMock(prism, req, path);
              logger.verboseLog('Returned 404 for: ' + req.url);
            }
          });
        }
      });
    }

    prismUtils.getBody(req, function() {
      handleMockRequest(req, res, prism);
    });
  };
}

module.exports = Mock;
