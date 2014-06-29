'use strict';

var crypto = require('crypto');
var path = require('path');

function hashUrl(url) {
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex');
}

module.exports = {
  getMockPath: function(proxy, url) {
    var urlHash = hashUrl(url);
    return path.join(proxy.config.mocksPath, proxy.config.name, urlHash + '.json');
  },
  absoluteUrl: function(proxy, url) {
    return (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + url;
  }
};