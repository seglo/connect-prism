'use strict';

var path = require('path');
var fs = require('fs');
var _ = require('lodash');

function ClearMocks(logger) {
  this.clear = function(config) {
    if (config.clearOnStart && _.contains(['record', 'mockrecord'], config.mode)) {
      var mocksDir = path.join(config.mocksPath, config.name);

      logger.verboseLog('Clearing mock directory: ' + mocksDir);

      fs.readdirSync(mocksDir).forEach(function(filename) {
        if (_.contains(['.404', '.json'], path.extname(filename))) {
          fs.unlinkSync(path.join(mocksDir, filename));
          logger.verboseLog('Deleted: ' + filename);
        }
      });
    }
  };
}

module.exports = ClearMocks;