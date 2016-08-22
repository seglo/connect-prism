'use strict';

var _ = require('lodash');
var assert = require('assert');
var di = require('di');
var fs = require('fs');
var path = require('path');

var prism = require('../../');

var injector = new di.Injector([]);

describe('prism', function() {
  var manager = prism.manager;

  afterEach(function() {
    manager.reset();
  });

  describe('task initialization', function() {
    it('should have initialized 2 proxies', function() {
      prism.create({
        name: 'proxy1',
        context: '/proxy1',
        host: 'localhost'
      });
      prism.create({
        name: 'proxy2',
        context: '/proxy2',
        host: 'localhost'
      });

      assert.equal(2, manager.prisms().length);
    });

    it('request options should be correctly mapped', function() {
      prism.create({
        name: 'proxyTest',
        mode: 'proxy',
        context: '/proxyRequest',
        host: 'localhost',
        port: 8090
      });

      var proxy = manager.get('/proxyRequest');

      assert.equal(_.isUndefined(proxy), false);
      assert.equal(proxy.config.mode, 'proxy');
      assert.equal(proxy.config.mocksPath, './mocks');
      assert.equal(proxy.config.context, '/proxyRequest');
      assert.equal(proxy.config.host, 'localhost');
      assert.equal(proxy.config.port, 8090);
      assert.equal(proxy.config.https, false);
    });

    describe('clear mocks on start', function() {
      var config = {
        mode: 'mock',
        name: 'clearOnStartTest',
        mocksPath: 'mocks',
        host: 'foo',
        context: '/context',
        clearOnStart: true
      };

      var mocksDir = path.join(config.mocksPath, config.name);
      var testMockFile = path.join(config.mocksPath, config.name, 'foo.json');
      var test404File = path.join(config.mocksPath, config.name, 'foo.json.404');

      beforeEach(function() {
        config.mode = 'proxy';
        if (!fs.existsSync(config.mocksPath)) {
          fs.mkdirSync(config.mocksPath);
        }
        if (!fs.existsSync(mocksDir)) {
          fs.mkdirSync(mocksDir);
        }
        // touch mock files
        fs.closeSync(fs.openSync(testMockFile, 'w'));
        fs.closeSync(fs.openSync(test404File, 'w'));
      });

      afterEach(function() {
        console.log('delete mock files');
        if (fs.existsSync(testMockFile)) {
          fs.unlinkSync(testMockFile);
        }
        if (fs.existsSync(test404File)) {
          fs.unlinkSync(test404File);
        }
      });

      it('in proxy mode don\'t clear mocks', function() {
        config.mode = 'proxy';
        prism.create(config);

        assert.equal(fs.existsSync(testMockFile), true);
      });
      it('in mock mode don\'t clear mocks', function() {
        config.mode = 'mock';
        prism.create(config);

        assert.equal(fs.existsSync(testMockFile), true);
      });
      it('in record mode clear mocks', function() {
        config.mode = 'record';
        prism.create(config);

        assert.equal(fs.existsSync(testMockFile), false);
        assert.equal(fs.existsSync(test404File), false);
      });
    });
  });
});