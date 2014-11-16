'use strict';

var di = require('di');
var pathToRegexp = require('path-to-regexp');

var PrismManager = require('../prism-manager');

function Api(prismManager) {
  var endPoints = [{
    // Create or replace the prism config with the provided request body
    verb: 'PUT',
    route: '/create/:target',
    handler: create
  }, {
    // Override a recorded response for a target with the provided request body
    verb: 'PUT',
    route: '/override/:target',
    handler: override
  }];

  function create(req, res) {}

  function override(req, res) {}

  this.isApiRequest = function(req) {
    var config = prismManager.getApiConfig();
    return config.enabled && req.url.indexOf(config.route) === 0;
  };

  this.requestHandler = function(req, res) {
/*    var endPoint = _.find(endPoints, function(endPoint) {
      pathToRegexp(endPoint.route) === null;
    });

    endPoint.handler(req, res);*/

    console.log('this is an API request: ' + req.url);
    res.write('it worked!');
    res.end();
  };
}

di.annotate(Api, new di.Inject(PrismManager));

module.exports = Api;