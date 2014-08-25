'use strict';

var di = require('di');
var grunt = require('grunt');

var PrismUtils = require('./prism-utils');

function Logger(prismUtils) {
  this.logSuccess = function(modeMsg, req, prism) {
    var target = prismUtils.absoluteUrl(prism, req.url ? req.url : req.path);
    this.verboseLog(modeMsg + ' request: ' + target);
  };

  this.log = grunt.log.writeln;

  this.verboseLog = grunt.log.verbose.writeln;
}

di.annotate(Logger, new di.Inject(PrismUtils));

module.exports = Logger;