'use strict';

var _ = require('lodash');
var crypto = require('crypto');
var di = require('di');
var path = require('path');
var PrismUtils = require('./prism-utils');
var grunt = require('grunt');
var RequestStateMachine = require('./request-state-machine');
var fs = require('fs');

function MockFilenameGenerator(prismUtils, rsmachine) {

  /**
   * This is the default implementation to generate a filename for the recorded
   * responses.  It will create a sha1 hash of the request URL and optionally,
   * the body of the request if the `hashFullRequest` config is set to true.
   * This function can bbe overriden in config with the responseFilenameCallback
   * setting.
   */
  function defaultMockFilename(config, req) {
    var reqData = prismUtils.filterUrl(config, req.url);
    // include request body in hash
    if (config.hashFullRequest) {
      reqData = req.body + reqData;
    }

    var shasum = crypto.createHash('sha1');
    shasum.update(reqData);
    return shasum.digest('hex') + '.json';
  }

  function humanReadableMockFilename(config, req) {
    var maxLength = 255;
    var hash = '_' + defaultMockFilename(config, req);

    var url = req.url.replace(/\/|\_|\?|\<|\>|\\|\:|\*|\||\"/g,'_');

    return url.substring(0, maxLength - hash.length) + hash;
  }

  function getBuiltinGenerator(mockFilenameGenerator) {
    switch(mockFilenameGenerator) {
    case 'humanReadable': return humanReadableMockFilename;
    case 'default':
    default: 
      return defaultMockFilename;
    }
  }
  
  this.getMockPath = function(prism, req, firstCandidateDontCheckExisting) {
    firstCandidateDontCheckExisting = typeof firstCandidateDontCheckExisting !== 'undefined' ?
      firstCandidateDontCheckExisting : false;

    var fn, existingPaths;
    var mockPaths = [];

    if (_.isFunction(prism.config.mockFilenameGenerator)) {
      fn = prism.config.mockFilenameGenerator;
    } else {
      fn = getBuiltinGenerator(prism.config.mockFilenameGenerator);
    }

    if (prism.config.mocksPath.constructor === Array) {
      mockPaths = prism.config.mocksPath;
    }
    else {
      mockPaths = [prism.config.mocksPath]
    }
    
    var responseFilename = fn(prism.config, req);
    
    if (_.isUndefined(responseFilename)) {
      throw new Error('The responseFilenameCallback function yielded no response.');
    }

    if (req && req.headers && req.headers['request-mock-custom-namespace']) {
      mockPaths.unshift(req.headers['request-mock-custom-namespace'])
    };

    
    // sequential stuff
    if (prism.config.sequential && !rsmachine.terminated(responseFilename)) {
      var sequentialResponseFilename = rsmachine.getIteratedPath(responseFilename);
      var sequentialCandidates = mockPaths.map(function(mocksPath){
	return path.join(mocksPath, prism.config.name, sequentialResponseFilename);
      })

      if (firstCandidateDontCheckExisting) {
	console.log(sequentialCandidates[0]);
	return [sequentialCandidates[0]];
      }

      // go on searching for the first existing path
      var existingSequentialMocks = sequentialCandidates.filter(function(path) {
	return fs.existsSync(path);
      });

      if (existingSequentialMocks.length > 0) {
	return [existingSequentialMocks[0]];
      }
      else {
	console.log('Didn´t find existing for: ' + responseFilename + '... terminating ..' + firstCandidateDontCheckExisting + prism.config.mode);
	rsmachine.terminate(responseFilename);
      }
      
    }
            
    mockPaths = mockPaths.map(function(mocksPath){
      return path.join(mocksPath, prism.config.name, responseFilename);
    });

    if (firstCandidateDontCheckExisting) {
      return [mockPaths[0]]
    }
    
    // find first working candidate
    existingPaths = mockPaths.filter(function(path) {
      return fs.existsSync(path);
    });

    if (existingPaths.length > 0){
      return [existingPaths[0]];
    }

    return [mockPaths[0]];

  };


  /**
   * get path segment of file path and create if it doesn´t exist already
   *
   **/  
  
  this.createPathForFileIfNonExistent = function(path) {
    var targetMocksPath = path.substring(0, path.lastIndexOf("/")+1);

    if (!grunt.file.isDir(targetMocksPath)) {
      grunt.file.mkdir(targetMocksPath);
      logger.warn('Target mocks path did not exist \'' + targetMocksPath + '\'.  Created.');
    }

  }
  
  /**
   * Get the body of the request so that we can use it to hash a response.
   *
   * NOTE: I'm getting the request body here so that we can reference it in the
   * response when creating a hash.  is there a better way to do this?
   * issue on node-http-proxy tracker: 
   * https://github.com/nodejitsu/node-http-proxy/issues/667
   */
  this.getBody = function(req, bodyCallback) {
    var buffer = '';
    req.on('data', function(data) {
      buffer += data;

      // Too much POST data, kill the connection!
      if (buffer.length > 1e6) {
	req.connection.destroy();
      }
    });
    req.on('end', function() {
      req.body = buffer;
      if (bodyCallback) {
	bodyCallback(buffer);
      }
    });
  };
}

di.annotate(MockFilenameGenerator, new di.Inject(PrismUtils, RequestStateMachine));

module.exports = MockFilenameGenerator;
