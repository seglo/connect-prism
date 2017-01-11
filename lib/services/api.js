'use strict';

var _ = require('lodash');
var director = require('director');
var pjson = require('../../package.json');

var ClearMocks = require('./clear-mocks');
var Mock = require('../modes/mock');
var Prism = require('../prism');
var PrismManager = require('../prism-manager');
var PrismUtils = require('./prism-utils');

function Api(prismManager, prism, prismUtils, mock, clearMocks) {
  var self = this;
  var enabled = false;
  var route = '/_prism';

  var router = new director.http.Router();

  // Initialize api routes using flatiron director router.
  // Called from base index.js middleware handler
  this.init = function() {
    enabled = true;

    router.get(route + '/version', version);
    router.post(route + '/setmode/:name/:mode', setMode);
    router.post(route + '/create', create);
    router.post(route + '/remove/:name', remove);
    router.post(route + '/override/:name/create', overrideCreate);
    router.post(route + '/override/:name/remove', overrideRemove);
    router.post(route + '/override/:name/clear', overrideClear);
  };

  // Handle an api request to /_prism
  this.handleRequest = function(req, res, next) {
    if(!req.url.startsWith(route)) {
      return false;
    }
    prismUtils.getBody(req, function(body) {
      // director should parse JSON for me!
      // https://github.com/flatiron/director/issues/275
      try {
        req.body = JSON.parse(body);
      } catch (err) {}
    });
    return router.dispatch(req, res
      /* *** Can't handle error and close response if this isn't a valid request, function(err) {
      if (err) {
        console.log('api returning 404');
        res.writeHead(404);
        res.end();
      }
    }*/
    );
  };

  function version() {
    this.res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    this.res.end(pjson.version);
  }

  function create() {
    var prismConfig = this.req.body;
    if (_.isUndefined(prismConfig)) {
      error(this, 'You must post a prism configuration in the request body.')
    }

    if (prism.create(prismConfig)) {
      ok(this);
    } else {
      error(this, 'An unspecified error occurred while creating prism, check your console.');
    }
  }

  function remove(name) {
    var prismConfig = prismManager.getByName(name);
    if (_.isUndefined(prismConfig)) {
      error(this, 'The prism name specified does not exist.');
    } else {
      prismManager.remove(prismConfig);
      ok(this);
    }
  }

  function setMode(name, mode) {
    var prismConfig = prismManager.getByName(name);
    if (_.isUndefined(prismConfig)) {
      error(this, 'The prism name specified does not exist.');
    } else if (!prismUtils.isValidMode(mode)) {
      error(this, 'An invalid prism mode was given.');
    } else {
      var newPrismConfig = _.cloneDeep(prismConfig.config);
      prismManager.remove(prismConfig);
      newPrismConfig.mode = mode;

      if (prism.create(newPrismConfig)) {
        ok(this);
      } else {
        error(this, 'An unspecified error occurred while creating prism, check your console.');
      }
    }
  }

  function overrideCreate(name) {
    var prismConfig = prismManager.getByName(name);
    if (_.isUndefined(prismConfig)) {
      error(this, 'The prism name specified does not exist.');
    } else {
      var override = this.req.body;
      if (validateOverride(override)) {
        mock.serializeOverrideMock(prismConfig, override);
        ok(this);
      } else {
        error(this, 'Invalid override supplied.');
      }
    }
  }

  function validateOverride(override) {
    if (override && override.mock && override.mock.statusCode &&
      override.mock.contentType && override.mock.requestUrl &&
      override.mock.data) {
      return true;
    }

    return false;
  }

  function overrideRemove(name) {
    var prismConfig = prismManager.getByName(name);
    if (_.isUndefined(prismConfig)) {
      error(this, 'The prism name specified does not exist.');
    } else {
      var mockRequest = this.req.body;
      if (mockRequest && mockRequest.url) {
        mock.removeOverrideMock(prismConfig, mockRequest);
        ok(this);
      } else {
        error(this, 'Invalid mock request supplied.');
      }
    }
  }

  function overrideClear(name) {
    var prismConfig = prismManager.getByName(name);
    if (_.isUndefined(prismConfig)) {
      error(this, 'The prism name specified does not exist.');
    } else {
      clearMocks.clearOverrides(prismConfig.config);
      ok(this);
    }
  }

  function error(context, error) {
    context.res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    context.res.end(error);
  }

  function ok(context) {
    context.res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    context.res.end('OK');
  }
}

module.exports = Api;
