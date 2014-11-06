'use strict';

var di = require('di');

var injector = new di.Injector([]);

var PrismManager = require('../prism-manager.js');

function Api(prismManager) {
  this.requestHandler = function(req, res) {
    console.log('this is an API request: ' + req.url);
    res.write('it worked!');
    res.end();
  };
}

di.annotate(Api, new di.Inject(PrismManager));

module.exports = Api;