'use strict';

function PrismUtils() {

  this.absoluteUrl = function(proxy, url) {
    return (proxy.config.https ? 'https://' : 'http://') + proxy.config.host + ':' + proxy.config.port + url;
  };
}

module.exports = PrismUtils;