'use strict';

var assert = require('assert');
var di = require('di');

var PrismUtils = require('../../lib/services/prism-utils');

var injector = new di.Injector([]);

describe('prism utils', function() {

  var prismUtils = injector.get(PrismUtils);

  it('isValidValue should return true for a regular expression', function() {
    assert(prismUtils.isValidValue(/[a-b]/));
  });

  it('isValidValue should return true for an array of strings', function() {
    assert(prismUtils.isValidValue(["a", "b"]));
  });

  it('isValidValue should return true for boolean true', function() {
    assert(prismUtils.isValidValue(["a", "b"]));
  });

  it('isValidValue should return false for boolean false', function() {
    assert(!prismUtils.isValidValue(false));
  });

  it('isValidValue should return false for empty array', function() {
    assert(!prismUtils.isValidValue([]));
  });

  it('isValidValue should return false for undefined', function() {
    assert(!prismUtils.isValidValue(undefined));
  });

  it('isValidValue should return false for null', function() {
    assert(!prismUtils.isValidValue(null));
  });

});