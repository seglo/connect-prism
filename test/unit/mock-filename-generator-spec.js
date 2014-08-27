'use strict';

var assert = require('assert');
var di = require('di');

var MockFilenameGenerator = require('../../lib/services/mock-filename-generator');

var injector = new di.Injector([]);

describe('mock filename generator', function() {
  var mockFilenameGenerator = injector.get(MockFilenameGenerator);

  it('should support overriding of the filename generator function', function(){
    function testFilenameCallback(config, req) {
      return 'test';
    }

    var prism = {
      config: {
        name: 'foo',
        mocksPath: './mocks',
        mockFilenameCallback: testFilenameCallback
      }
    };

    var mockResponsePath = mockFilenameGenerator.getMockPath(prism, undefined); 

    assert.equal(mockResponsePath, 'mocks/foo/test.json');
  });
});