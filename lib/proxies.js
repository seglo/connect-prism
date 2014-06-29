'use strict';

var _ = require('lodash');

var utils = require('./utils');

var proxies = [];

// ripped from grunt-connect-proxy to match contexts
function matchContext(context, url) {
  var positiveContexts, negativeContexts, positiveMatch, negativeMatch;
  var contexts = context;
  if (!_.isArray(contexts)) {
    contexts = [contexts];
  }
  positiveContexts = _.filter(contexts, function(c) {
    return c.charAt(0) !== '!';
  });
  negativeContexts = _.filter(contexts, function(c) {
    return c.charAt(0) === '!';
  });
  // Remove the '!' character from the contexts
  negativeContexts = _.map(negativeContexts, function(c) {
    return c.slice(1);
  });
  negativeMatch = _.find(negativeContexts, function(c) {
    return url.lastIndexOf(c, 0) === 0;
  });
  // If any context negates this url, it must not be proxied.
  if (negativeMatch) {
    return false;
  }
  positiveMatch = _.find(positiveContexts, function(c) {
    return url.lastIndexOf(c, 0) === 0;
  });
  // If there is any positive match, lets proxy this url.
  return positiveMatch != null;
}

module.exports = {
  getProxy: function(path) {
    return _.find(proxies, function(proxy) {
      return matchContext(proxy.config.context, path);
    });
  },
  proxies: function() {
    return proxies;
  },
  add: function(proxy) {
    proxies.push(proxy);
  }
};