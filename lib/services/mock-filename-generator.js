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
   * This function can be overidden in config with the responseFilenameCallback
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

    var url = prismUtils.filterUrl(config, req.url.replace(/\/|\_|\?|\<|\>|\\|\:|\*|\||\"/g,'_'));

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
}

di.annotate(MockFilenameGenerator, new di.Inject(PrismUtils));

module.exports = MockFilenameGenerator;