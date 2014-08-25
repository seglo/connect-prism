'use strict';

function ResponseDelay() {
  /**
   * Calculate the time in milliseconds based on the delay configuration object
   * delay: Int | 'auto' | 'fast' | 'slow'
   */
  this.delayTimeInMs = function(delay) {
    if (!delay || delay === undefined) {
      return 0;
    } else if (!isNaN(delay)) {
      return delay;
    } else {
      var lowerBound = 1;
      var upperBound = 1;
      switch (delay) {
        case 'auto':
          lowerBound = 500;
          upperBound = 1750;
          break;
        case 'fast':
          lowerBound = 150;
          upperBound = 1000;
          break;
        case 'slow':
          lowerBound = 1500;
          upperBound = 3000;
          break;
      }
      return Math.floor((Math.random() * upperBound) + lowerBound);
    }
  };
}

module.exports = ResponseDelay;