'use strict';

var crypto = require('crypto');
var path = require('path');

function PrismUtils() {

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

  this.absoluteUrl = function(proxy, url) {
    return (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + url;
  };
}

module.exports = PrismUtils;