'use strict';

var crypto = require('crypto');
var path = require('path');

function ResponseHash() {
  /**
   * Get the body of the request so that we can use it to hash a response.
   *
   * NOTE: I'm getting the request body here so that we can reference it in the
   * response when creating a hash.  is there a better way to do this?
   * issue on node-http-proxy tracker: 
   * https://github.com/nodejitsu/node-http-proxy/issues/667
   */
  this.getBody = function(req, bodyCallback) {
    var buffer = '';
    req.on('data', function(data) {
      buffer += data;

      // Too much POST data, kill the connection!
      if (buffer.length > 1e6) {
        req.connection.destroy();
      }
    });
    req.on('end', function() {
      req.body = buffer;
      if (bodyCallback) {
        bodyCallback(buffer);
      }
    });
  };

  function hash(reqData) {
    var shasum = crypto.createHash('sha1');
    shasum.update(reqData);
    return shasum.digest('hex');
  }

  this.getMockPath = function(proxy, req) {
    var reqData = req.url;
    // include request body in hash
    if (proxy.config.hashFullRequest) {
      reqData = req.body + reqData;
    }
    var reqHash = hash(reqData);
    return path.join(proxy.config.mocksPath, proxy.config.name, reqHash + '.json');
  };
}

module.exports = ResponseHash;