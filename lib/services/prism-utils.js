'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');

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

  this.bodyParser = bodyParser.raw({ type: '*/*' });

  /**
   * Get the body of the request so that we can use it to hash a response.
   */
  this.getBody = function(req, res, bodyCallback) {
    if (req.body) {
      bodyCallback(req.body);
    } else {
      this.bodyParser(req, res, function() {
        // body-parser sets req.body to {} when there is no body
        if (_.isEqual(req.body, {})) delete req.body;
        bodyCallback(req.body);
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

  function chainMiddlewares(middlewares) {
    if (_.toArray(middlewares).length === 0) {
      return function(req, res, next) { next(); }
    } else {
      return function(req, res, next) {
        function chain(middlewares) {
          if (middlewares.length > 0) {
            return function() {
              middlewares[0](req, res, chain(middlewares.slice(1)));
            }
          } else {
            return function() {
              next();
            }
          }
        }
        chain(middlewares)(req, res, next);
      }
    }
  }

  this.exists = exists;
  this.isDir = isDir;
  this.mkdir = mkdir;
  this.chainMiddlewares = chainMiddlewares;
}

module.exports = PrismUtils;
