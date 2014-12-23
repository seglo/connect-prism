'use strict';

var assert = require('assert');
var connect = require('connect');
var di = require('di');
var http = require('http');

var prism = require('../../');
var testUtils = require('../test-utils');
var httpGet = testUtils.httpGet;

var injector = new di.Injector([]);

describe('proxy mode', function() {
  var manager = prism.manager;

  afterEach(function() {
    manager.reset();
  });

  it('can proxy a response', function(done) {
    prism.create({
      name: 'proxyTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090
    });

    httpGet('/test', function(res, data) {
      assert.equal(data, 'a server response');
      done();
    });

  });

  it('can delay a proxied response by approximately 50ms', function(done) {
    prism.create({
      name: 'proxyDelayTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090,
      delay: 50
    });

    var startTime = Date.now();
    httpGet('/test', function(res, data) {
      var delta = Date.now() - startTime;
      assert.equal(delta > 30, true);
      assert.equal(delta < 70, true);
      done();
    });
  });

  it('can rewrite a request', function(done) {
    prism.create({
      name: 'rewriteTest',
      mode: 'proxy',
      context: '/test',
      host: 'localhost',
      port: 8090,
      rewrite: {
        '^/test': '/rewrite',
      }
    });

    httpGet('/test', function(res, data) {
      assert.equal(data, 'a rewritten server response');
      done();
    });
  });
});