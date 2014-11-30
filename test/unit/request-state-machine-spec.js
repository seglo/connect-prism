'use strict';

var assert = require('assert');
var assertPathEqual = require('../test-utils').assertPathEqual;
var di = require('di');

var RequestStateMachine = require('../../lib/services/request-state-machine');

var injector = new di.Injector([]);

describe('mock request state machine', function() {
  var rsmachine = injector.get(RequestStateMachine);
  var filename = "myfile.json";
  var filename2 = "mysecondfile.json";

  it('should record filenames and append a sequential number to the name path of a file', function() {
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_0.json');
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_1.json');
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_2.json');
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_3.json');
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_4.json');
  });


  it('should spit out the original filename if its record has been terminated', function() {
    rsmachine.terminate(filename);
    assert.equal(rsmachine.getIteratedPath(filename), filename);
  });

  it('should be able to tell if a filename was terminated', function() {
    assert.equal(rsmachine.terminated(filename), true);
  });

  it('should be resetable for a single file', function() {
    rsmachine.getIteratedPath(filename2);
    rsmachine.reset(filename);
    // reset
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_0.json');    
    //not reset
    assert.equal(rsmachine.getIteratedPath(filename2), 'mysecondfile_1.json');    
  });


  it('should be resetable for every file', function() {
    rsmachine.reset();
    assert.equal(rsmachine.getIteratedPath(filename), 'myfile_0.json');
    assert.equal(rsmachine.getIteratedPath(filename2), 'mysecondfile_0.json');    
  });
  
});
