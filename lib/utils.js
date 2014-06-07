'use strict';

var crypto = require('crypto');

module.exports = {
  hashUrl: function(url) {
    var shasum = crypto.createHash('sha1');
    shasum.update(url);
    return shasum.digest('hex');
  },
  absoluteUrl: function(proxy, url) {
    return (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + url;
  }
};