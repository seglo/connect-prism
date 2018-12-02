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
});

