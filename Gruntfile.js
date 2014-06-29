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

    var jsonMockTest = {
      name: 'jsonMockTest',
      mode: 'mock',
      mocksPath: './mocksToRead',
      context: '/jsonMockRequest',
      host: 'localhost',
      port: 8090
    };

    prism.create(proxyTest);
    prism.create(recordTest);
    prism.create(jsonRecordTest);
    prism.create(mockTest);
    prism.create(jsonMockTest);

    grunt.task.run(['mochaTest']);
  });

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};