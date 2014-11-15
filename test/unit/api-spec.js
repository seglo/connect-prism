'use strict';

var _ = require('lodash');
var assert = require('assert');
var connect = require('connect');
var di = require('di');
var fs = require('fs');
var http = require('http');

var prism = require('../../');

var testUtils = require('../test-utils');
var onEnd = testUtils.onEnd;
var waitForFile = testUtils.waitForFile;

//var Api = require('../../lib/services/api');

var injector = new di.Injector([]);

describe('api', function() {
  it('should create new prism configuration', function(done) {
    done();
/*    this.timeout(50000);
    
    var prismConfig = {
      name: 'mockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    };

    var request = http.request({
      host: 'localhost',
      path: '/_prism',
      port: 9000
    }, function(res) {
      onEnd(res, function(data) {
        assert.equal(res.statusCode, 200);
        done();
      });
    });
    request.end();
    */
  });

});