'use strict';

var _ = require('lodash');
var di = require('di');

function PrismManager() {

  var prisms = [];

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

  this.getByName = function(name) {
    return _.find(prisms, function(prism) {
      return prism.config.name === name;
    });
  };

  this.get = function(path) {
    return _.find(prisms, function(prism) {
      return matchContext(prism.config.context, path);
    });
  };

  this.prisms = function() {
    return prisms;
  };

  this.add = function(prism) {
    prisms.push(prism);
  };

  this.remove = function(prism) {
    prism.server.close();
    var index = prisms.indexOf(prism);
    prisms.splice(index, 1);
  };

  this.reset = function() {
    prisms = [];
  };
}

module.exports = PrismManager;