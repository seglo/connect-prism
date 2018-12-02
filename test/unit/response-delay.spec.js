'use strict';

var assert = require('assert');

var ResponseDelay = require('../../lib/services/response-delay');

describe('Response delay', function () {
  var responseDelay;

  beforeEach(function () {
    responseDelay = new ResponseDelay();
  });

  describe('No delay', function () {
    it('should have no delay by default', function () {
      assert(responseDelay.delayTimeInMs() === 0);
    });

    it('should have no delay when given null parameter', function () {
      assert(responseDelay.delayTimeInMs(null) === 0);
    });

    it('should have no delay when given a parameter that coerce to false', function () {
      assert(responseDelay.delayTimeInMs(false) === 0);
      assert(responseDelay.delayTimeInMs(0) === 0);
      assert(responseDelay.delayTimeInMs('') === 0);
      assert(responseDelay.delayTimeInMs(NaN) === 0);
    });
  });

  describe('Simple delays', function () {
    it('should have a simple delay when given a number', function () {
      assert(responseDelay.delayTimeInMs(42) === 42);
    });

    it('should have a simple delay when given a string that coerce to a number', function () {
      assert(responseDelay.delayTimeInMs('42') === 42);
    });
  });

  describe('Ranged delays', function () {
    describe('Lower range', function () {
      beforeEach(function () {
        var fakeRandomNumberGenerator = function () {
          return 0;
        };
        responseDelay = new ResponseDelay(fakeRandomNumberGenerator);
      });

      it('should have minimum delay of 500ms when using auto parameter', function () {
        assert(responseDelay.delayTimeInMs('auto') === 500);
      });

      it('should have minimum delay of 150ms when using fast parameter', function () {
        assert(responseDelay.delayTimeInMs('fast') === 150);
      });

      it('should have minimum delay of 1500ms when using slow parameter', function () {
        assert(responseDelay.delayTimeInMs('slow') === 1500);
      });

      it('should have minimum delay of 1ms when given an invalid parameter', function () {
        assert(responseDelay.delayTimeInMs('invalid parameter') === 1);
      });
    });

    describe('Upper range', function () {
      beforeEach(function () {
        var fakeRandomNumberGenerator = function () {
          return 1;
        };
        responseDelay = new ResponseDelay(fakeRandomNumberGenerator);
      });

      it('should have maximum delay of 1750ms when using auto parameter', function () {
        assert(responseDelay.delayTimeInMs('auto') === 1750);
      });

      it('should have maximum delay of 1000ms when using fast parameter', function () {
        assert(responseDelay.delayTimeInMs('fast') === 1000);
      });

      it('should have maximum delay of 3000ms when using slow parameter', function () {
        assert(responseDelay.delayTimeInMs('slow') === 3000);
      });

      it('should have maximum delay of 1ms when given an invalid parameter', function () {
        assert(responseDelay.delayTimeInMs('invalid parameter') === 1);
      });
    });

    describe('Custom ranges', function() {
      it('should use the given upper bound to calculate the delay', function () {
        var fakeRandomNumberGenerator = function () {
          return 1;
        };
        responseDelay = new ResponseDelay(fakeRandomNumberGenerator);

        assert.equal(responseDelay.delayTimeInMs({lowerBound: 50, upperBound: 100}), 100);
      });

      it('should use the given lower bound to calculate the delay', function () {
        var fakeRandomNumberGenerator = function () {
          return 0;
        };
        responseDelay = new ResponseDelay(fakeRandomNumberGenerator);

        assert.equal(responseDelay.delayTimeInMs({lowerBound: 50, upperBound: 100}), 50);
      });
    });

    it('should round delays to the millisecond', function () {
      var fakeRandomNumberGenerator = function () {
        return 0.001;
      };
      responseDelay = new ResponseDelay(fakeRandomNumberGenerator);

      assert(responseDelay.delayTimeInMs('fast') === 150);
    });
  });
});

