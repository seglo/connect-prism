'use strict';

function RequestStateMachine() {
  var _global = -1;
  var hashCounters = {};

  this.getRawFilename = function(filenameWithSequentialNumber) {
    var filenameSegments;
    filenameSegments = /^(.*)(_\d+)?(\.\w+)$/.exec(filenameWithSequentialNumber);
    return filenameSegments[1]+filenameSegments[3];
  }
  
  this.iteratePath = function(filename) {
    filename = this.getRawFilename(filename);

    _global += 1;

    if (!(filename in hashCounters)) {
      hashCounters[filename] = 0;
    }
    
    else if (hashCounters[filename] != '$'){
      hashCounters[filename] = hashCounters[filename] + 1;
    }
    return this.getIteratedPath(filename);
  }
  
  this.getIteratedPath = function(filename) {
    var filenameSegments;
    filename = this.getRawFilename(filename);

    if (this.terminated(filename)) {
      return filename;
    }

    if (!hashCounters[filename]) {
      this.iteratePath(filename);
    }

    filenameSegments = /^(.*)(\.\w+)$/.exec(filename);
    
    // when a sequenz has already ended, we return the generic filename 
    return filenameSegments[1] + (hashCounters[filename] != '$' ? ('_' + hashCounters[filename]) : '')  + filenameSegments[2]
    
  }

  this.terminated = function(filename){
    filename = this.getRawFilename(filename);
    return hashCounters[filename] == '$';
  }
  
  this.terminate = function(filename) {
    filename = this.getRawFilename(filename);
    hashCounters[filename] = '$';
    return this.getIteratedPath(filename);
  }

  this.reset = function(filename) {
    if (typeof filename !== 'undefined') {
      filename = this.getRawFilename(filename);
      hashCounters[filename] = -1;
    }
    else {
      _global = -1;
      hashCounters = {}
    }
  }

}

module.exports = RequestStateMachine;
