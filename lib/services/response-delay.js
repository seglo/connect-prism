'use strict';

var ranges = {
  default: {
    lowerBound: 1,
    upperBound: 1,
  },
  auto: {
    lowerBound: 500,
    upperBound: 1750,
  },
  fast: {
    lowerBound: 150,
    upperBound: 1000,
  },
  slow: {
    lowerBound: 1500,
    upperBound: 3000,
  }
}

function ResponseDelay(randomNumberGenerator) {
  /**
   * Calculate the time in milliseconds based on the delay configuration object
   * delay: Int | 'auto' | 'fast' | 'slow'
   */
  this.delayTimeInMs = function (delay) {
    if (!delay) {
      return 0;
    }

    if (!isNaN(delay)) {
      return parseInt(delay);
    }

    var matchingRange = ranges[delay] || ranges.default;
    var lowerBound = matchingRange.lowerBound;
    var upperBound = matchingRange.upperBound;
    return Math.floor((randomNumberGenerator() * (upperBound - lowerBound)) + lowerBound);
  };
}

module.exports = ResponseDelay;
