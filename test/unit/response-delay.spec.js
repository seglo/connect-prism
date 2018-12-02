'use strict';

var assert = require('assert');

var ResponseDelay = require('../../lib/services/response-delay');

describe('Response delay', function() {
    var responseDelay;

    beforeEach(function() {
        responseDelay = new ResponseDelay();
    });

    describe('No delay', function() {
        it('should have no delay by default', function() {
            assert(responseDelay.delayTimeInMs() === 0);
        });

        it('should have no delay when given null parameter', function() {
            assert(responseDelay.delayTimeInMs(null) === 0);
        });

        it('should have no delay when given a parameter that coerce to false', function() {
            assert(responseDelay.delayTimeInMs(false) === 0);
            assert(responseDelay.delayTimeInMs(0) === 0);
            assert(responseDelay.delayTimeInMs('') === 0);
            assert(responseDelay.delayTimeInMs(NaN) === 0);
        });
    });

    describe('Simple delays', function() {
        it('should have a simple delay when given a number', function() {
            assert(responseDelay.delayTimeInMs(42) === 42);
        });
    });

    describe('Ranged delays', function() {
        describe('Lower range', function() {
            beforeEach(function() {
                var fakeRandomNumberGenerator = function() {return 0;};
                responseDelay = new ResponseDelay(fakeRandomNumberGenerator);
            });

            it('should have minimum delay of 500ms when using auto parameter', function() {
                assert(responseDelay.delayTimeInMs('auto') === 500);
            });

            it('should have minimum delay of 150ms when using fast parameter', function() {
                assert(responseDelay.delayTimeInMs('fast') === 150);
            });

            it('should have minimum delay of 1500ms when using slow parameter', function() {
                assert(responseDelay.delayTimeInMs('slow') === 1500);
            });

            it('should have minimum delay of 1ms when given an invalid parameter', function() {
                assert(responseDelay.delayTimeInMs('invalid parameter') === 1);
            });
        });
    });
});

