'use strict';

var _ = require('lodash');

function PrismUtils() {
  this.isValidMode = function(mode) {
    return _.contains(['proxy', 'record', 'mock', 'mockrecord'], mode);
  };

  this.absoluteUrl = function(https, host, port, url) {
    return (https ? 'https://' : 'http://') + host + ':' + port + url;
  };

  this.isValidValue = function(value) {
    if (!value) {
      return false;
    }

    return _.isRegExp(value) || _.isArray(value) && !_.isEmpty(value) || _.isBoolean(value) && value;
  };

  this.filterUrl = function(config, url) {
    if (!this.isValidValue(config.ignoreParameters)) {
      return url;
    }

    if (_.isEmpty(url) || !_.isString(url)) {
      return url;
    }

    var action = config.ignoreParameters;

    var slicedUrl = url.split(/\?|\&/);

    var urlPath = slicedUrl[0];

    if (_.isBoolean(action) && action) {
      return urlPath;
    }

    var filteredParameters = [];

    if (_.isArray(action)) {
      filteredParameters = _.where(slicedUrl.slice(1), function(it) {
        var parameterName = it.split("=")[0];
        return config.ignoreParameters.indexOf(parameterName) === -1;
      });
    } else if (_.isRegExp(action)) {
      filteredParameters = _.where(slicedUrl.slice(1), function(it) {
        var parameterName = it.split("=")[0];
        return !action.test(parameterName);
      });
    }

    if (!_.isEmpty(filteredParameters)) {
      urlPath += "?" + filteredParameters.join("&");
    }

    return urlPath;
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

module.exports = PrismUtils;