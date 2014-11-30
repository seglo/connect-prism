'use strict';

function RequestStateMachine() {
  var filenameSegments;
  var _global = -1;
  var hashCounters = {};

  this.getIteratedPath = function(filename) {

    _global += 1;

    if (!(filename in hashCounters)) {
      hashCounters[filename] = 0;
    }
    
    else if (hashCounters[filename] != '$'){
      hashCounters[filename] = hashCounters[filename] + 1;
    }
    filenameSegments = /^(.*)(\.\w+)$/.exec(filename);
    
    // when a sequenz has already ended, we return the generic filename 
    return filenameSegments[1] + (hashCounters[filename] != '$' ? ('_' + hashCounters[filename]) : '')  + filenameSegments[2]
    
  }

  this.terminated = function(filename){
    return hashCounters[filename] == '$';
  }
  
  this.terminate = function(filename) {
    hashCounters[filename] = '$';
    return this.getIteratedPath(filename);
  }

  this.reset = function(filename) {
    if (typeof filename !== 'undefined') {
      hashCounters[filename] = -1;
    }
    else {
      _global = -1;
      hashCounters = {}
    }
  }

}

module.exports = RequestStateMachine;
