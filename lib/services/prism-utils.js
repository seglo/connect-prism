'use strict';

var _ = require('lodash');

function PrismUtils() {

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
}

module.exports = PrismUtils;