'use strict';

var _ = require('lodash');
var di = require('di');

//var Prism = require('../prism');
var PrismManager = require('../prism-manager');
var Prism = require('../prism');

function Api(prismManager, prism) {  
  var config = {
    enabled: false,
    route: '/_prism'
  };

  var router;

  this.setRouter = function(r) {
    router = r;
  };

  /*
   * Initialize api routes using flatiron director router.
   * Called from base index.js middleware handler
   */
  this.init = function(route) {
    config.enabled = true;
    if (route) {
      config.route = route;
    }

    // router.get('/foo/:bar/:zoot', function(bar, zoot) {
    //   console.log(bar, zoot);
    //   this.res.writeHead(200, { 'Content-Type': 'text/plain' })
    //   this.res.end('hello world');
    // });
    // router.post('/_prism/create', function() {
    //   console.log(this.req.body);
    // });
    var base = config.route;
    router.post(base + '/setmode/:name/:mode', setMode);
  };

  // var endPoints = [{
  //   // Create or replace the prism config with the provided request body
  //   verb: 'PUT',
  //   route: '/create/:target',
  //   handler: create
  // }, {
  //   // Override a recorded response for a target with the provided request body
  //   verb: 'PUT',
  //   route: '/override/:target',
  //   handler: override
  // }, {
  //   verb: 'PUT',
  //   route: '/switchMode/:name/:mode',
  //   hander: switchMode
  // }];

  function create(req, res) {}

  function setMode(name, mode) {
    var prismConfig = prismManager.getByName(name);
    var newPrismConfig = _.cloneDeep(prismConfig.config);
    prismManager.remove(prismConfig);
    newPrismConfig.mode = mode;
    prism.create(newPrismConfig);

    ok(this);
  }

  function ok(directorContext) {
    directorContext.res.writeHead(200, { 'Content-Type': 'text/plain' })
    directorContext.res.end('OK');
  }

  function override(req, res) {

  }
}

di.annotate(Api, new di.Inject(PrismManager, Prism));

module.exports = Api;