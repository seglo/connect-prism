'use strict';

module.exports = {
  create: require('./lib/prism'),
  middleware: require('./lib/events').handleRequest
};