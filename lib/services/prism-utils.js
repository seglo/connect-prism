'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

function PrismUtils() {
  this.isValidMode = function(mode) {
    return _.includes(['proxy', 'record', 'mock', 'mockrecord'], mode);
  };

  this.absoluteUrl = function(https, host, port, url) {
    return (https ? 'https://' : 'http://') + host + ':' + port + url;
  };

  this.isJson = function(contentType) {
    return _.includes(contentType, 'json') || _.includes(contentType, 'javascript');
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
      filteredParameters = _.filter(slicedUrl.slice(1), function(it) {
        var parameterName = it.split("=")[0];
        return config.ignoreParameters.indexOf(parameterName) === -1;
      });
    } else if (_.isRegExp(action)) {
      filteredParameters = _.filter(slicedUrl.slice(1), function(it) {
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
    if (req.bodyRead) {
      bodyCallback(req.body);
    } else {
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
        req.bodyRead = true;
        if (bodyCallback) {
          bodyCallback(buffer);
        }
      });
    }
  };

  /**
   * File helpers stolen from Grunt
   */
  var pathSeparatorRe = /[\/\\]/g;
   
  function exists() {
    var filepath = path.join.apply(path, arguments);
    return fs.existsSync(filepath);
  }

  function isDir() {
    var filepath = path.join.apply(path, arguments);
    return exists(filepath) && fs.statSync(filepath).isDirectory();
  }

  function mkdir(dirpath, mode) {
    // Set directory mode in a strict-mode-friendly way.
    if (mode == null) {
      mode = parseInt('0777', 8) & (~process.umask());
    }
    dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
      parts += part + '/';
      var subpath = path.resolve(parts);
      if (!exists(subpath)) {
        try {
          fs.mkdirSync(subpath, mode);
        } catch (e) {
          throw new Error('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
        }
      }
      return parts;
    }, '');
  }

  this.exists = exists;
  this.isDir = isDir;
  this.mkdir = mkdir;
}

module.exports = PrismUtils;
