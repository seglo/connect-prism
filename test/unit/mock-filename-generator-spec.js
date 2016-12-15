'use strict';

var assert = require('assert');
var assertPathEqual = require('../test-utils').assertPathEqual;
var path = require('path');

var PrismUtils = require("../../lib/services/prism-utils");
var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

describe('mock filename generator', function() {
  var prismUtils = new PrismUtils();
  var mockFilenameGenerator = new MockFilenameGenerator(prismUtils);

  it('should support overriding of the filename generator function', function() {
    function testFilenameCallback(config, req) {
      return 'test.json';
    }

    var prism = {
      config: {
        name: 'foo',
        mocksPath: './mocks',
        mockFilenameGenerator: testFilenameCallback
      }
    };

    var mockResponsePath = mockFilenameGenerator.getMockPath(prism, undefined);

    assertPathEqual(mockResponsePath, 'mocks/foo/test.json');
  });

  it('should support a human readable filename generator function', function() {
    var req = {
      url: '/is/this/url?really=that&readable=at&all'
    };

    var prism = {
      config: {
        name: 'foo',
        mocksPath: './mocks',
        mockFilenameGenerator: 'humanReadable'
      }
    };

    var mockResponsePath = mockFilenameGenerator.getMockPath(prism, req);

    assertPathEqual(mockResponsePath, 'mocks/foo/_is_this_url_really=that&readable=at&all_09b2ed55fb2b388fbe02c69e94bca5d86ff7247c.json');
  });

  it('should support a human readable filename generator function and support ignoreParameters configuration', function() {
    var req = {
      url: '/is/this/url?really=that&readable=at&all'
    };

    var prism = {
      config: {
        name: 'foo',
        mocksPath: './mocks',
        mockFilenameGenerator: 'humanReadable',
        ignoreParameters: true
      }
    };

    var mockResponsePath = mockFilenameGenerator.getMockPath(prism, req);

    assertPathEqual(mockResponsePath, 'mocks/foo/_is_this_url_really=that_237a2df1a4dfefe26d84b37103583200b8cd9c48.json');
  });

  it('should support a human readable filename generator function with truncation', function() {
    var req = {
      url: '/is/this/url?really=that&readable=at&all&aBigNumber=999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'
    };

    var prism = {
      config: {
        name: 'foo',
        mocksPath: './mocks',
        mockFilenameGenerator: 'humanReadable'
      }
    };

    var mockResponsePath = mockFilenameGenerator.getMockPath(prism, req);

    assert.equal(mockResponsePath.split(path.sep)[2].length, 255);
    assertPathEqual(mockResponsePath, 'mocks/foo/_is_this_url_really=that&readable=at&all&aBigNumber=9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999_ae2f067764e7839efdb85d791fbe031a9d1f63e9.json');
  });
});
