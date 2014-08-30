'use strict';

var _ = require('lodash');
var crypto = require('crypto');
var di = require('di');
var path = require('path');
var PrismUtils = require('./prism-utils');

function MockFilenameGenerator(prismUtils) {

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

  this.getMockPath = function(prism, req) {
    var fn;

    if (_.isFunction(prism.config.mockFilenameGenerator)) {
      fn = prism.config.mockFilenameGenerator;
    } else {
      fn = getBuiltinGenerator(prism.config.mockFilenameGenerator);
    }

    var responseFilename = fn(prism.config, req);

    if (_.isUndefined(responseFilename)) {
      throw new Error('The responseFilenameCallback function yielded no response.');
    }

    return path.join(prism.config.mocksPath, prism.config.name, responseFilename);
  };

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

di.annotate(MockFilenameGenerator, new di.Inject(PrismUtils));

module.exports = MockFilenameGenerator;