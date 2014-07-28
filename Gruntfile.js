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
    grunt.task.run(['clean', 'jshint', 'connect:server']);

    var proxyTest = {
      name: 'proxyTest',
      mode: 'proxy',
      context: '/proxyRequest',
      host: 'localhost',
      port: 8090
    };

    var proxyDelayTest = {
      name: 'proxyDelayTest',
      mode: 'proxy',
      context: '/proxyDelayRequest',
      host: 'localhost',
      port: 8090,
      delay: 50
    };

    var recordTest = {
      name: 'recordTest',
      mode: 'record',
      context: '/recordRequest',
      host: 'localhost',
      port: 8090
    };

    var jsonRecordTest = {
      name: 'jsonRecordTest',
      mode: 'record',
      context: '/jsonRecordRequest',
      host: 'localhost',
      port: 8090
    };

    var mockTest = {
      name: 'mockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/readRequest',
      host: 'localhost',
      port: 8090
    };

    var mockDelayTest = {
      name: 'mockDelayTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/mockDelayRequest',
      host: 'localhost',
      port: 8090,
      delay: 50
    };

    var jsonMockTest = {
      name: 'jsonMockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/jsonMockRequest',
      host: 'localhost',
      port: 8090
    };

    var rewriteTest = {
      name: 'rewriteTest',
      mode: 'proxy',
      mocksPath: './mocksToRead',
      context: '/rewriteRequest',
      host: 'localhost',
      port: 8090,
      rewrite: {
        '^/rewriteRequest': '/rewrittenRequest',
      }
    };

    var mockRecordTest = {
      name: 'mockRecordTest',
      mode: 'mockrecord',
      mocksPath: './mocksToRead',
      context: '/mockRecordTest',
      host: 'localhost',
      port: 8090
    };

    var rewriteAndRecordTest = {
      name: 'rewriteAndRecordTest',
      mode: 'record',
      context: '/rewriteAndRecordTest',
      host: 'localhost',
      port: 8090,
      rewrite: {
        '^/rewriteAndRecordTest/foo': '/bar',
      }
    };

    var handleCompressedResponse = {
      name: 'compressedResponse',
      mode: 'record',
      context: '/compressedResponse',
      host: 'localhost',
      port: 8091 // created a 2nd connect instance that supports compression
    };

    prism.create(proxyTest);
    prism.create(proxyDelayTest);
    prism.create(recordTest);
    prism.create(jsonRecordTest);
    prism.create(mockTest);
    prism.create(mockDelayTest);
    prism.create(jsonMockTest);
    prism.create(rewriteTest);
    prism.create(mockRecordTest);
    prism.create(rewriteAndRecordTest);
    prism.create(handleCompressedResponse);

    grunt.task.run(['mochaTest']);
  });

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};