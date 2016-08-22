'use strict';

var di = require('di');
var winston = require('winston');

var PrismUtils = require('./prism-utils');

function Logger(prismUtils) {
  var logger = new (winston.Logger)({
    exitOnError: false,
    transports: [
    new (winston.transports.Console)({
      colorize: true,
      level: 'info'
    })]
  });

  this.useVerboseLog = function() {
    logger.transports.console.level = 'verbose';
  };

  this.logSuccess = function(modeMsg, req, prism) {
    var target = prismUtils.absoluteUrl(prism.config.https, prism.config.host, prism.config.port, req.url ? req.url : req.path);
    this.verboseLog(modeMsg + ' request: ' + target);
  };

  this.log = winston.info;
  this.warn = winston.warn;
  this.error = winston.error;
  this.verboseLog = logger.verbose;
}

di.annotate(Logger, new di.Inject(PrismUtils));

module.exports = Logger;