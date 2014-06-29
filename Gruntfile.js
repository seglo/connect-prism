'use strict';

var prism = require('./index');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        'lib/*.js',
        'test/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Stub connect server to add prism middleware to.
    connect: {
      server: {
        options: {
          port: 9000,
          hostname: 'localhost',
          middleware: function(connect, options) {
            return [prism.middleware];
          }
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }

  });

  var options = {
    options: {
      mode: 'proxy',
      mocksPath: './mocks',
      context: '/defaultContext',
      host: 'localhost',
      port: 8090,
      https: false
    },
    proxyTest: {
      options: {
        mode: 'proxy',
        mocksPath: './mocks',
        context: '/proxyRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    recordTest: {
      options: {
        mode: 'record',
        mocksPath: './mocks',
        context: '/recordRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    jsonRecordTest: {
      options: {
        mode: 'record',
        mocksPath: './mocks',
        context: '/jsonRecordRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    mockTest: {
      options: {
        mode: 'mock',
        mocksPath: './mocksToRead',
        context: '/readRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    jsonMockTest: {
      options: {
        mode: 'mock',
        mocksPath: './mocksToRead',
        context: '/jsonMockRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    modeOverrideTest: {
      options: {
        mode: 'proxy',
        mocksPath: './mocks',
        context: '/proxyOverrideRequest',
        host: 'localhost',
        port: 8090,
        https: false
      }
    },
    inheritRootOptionsTest: {
      options: {}
    }
  };

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', function() {
    grunt.task.run(['clean', 'jshint']);

    prism.create(options, 'proxyTest');
    prism.create(options, 'recordTest');
    prism.create(options, 'jsonRecordTest');
    prism.create(options, 'mockTest');
    prism.create(options, 'jsonMockTest');
    prism.create(options, 'modeOverrideTest', 'record');
    prism.create(options, 'inheritRootOptionsTest');

    grunt.task.run(['connect:server', 'mochaTest']);
  });

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};