'use strict';

module.exports = function(grunt) {

  var prismMiddleware = require("./lib/events.js").handleRequest;

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

    // Configuration to be run (and then tested).
    connect: {
      server: {
        options: {
          port: 9000,
          // change this to '0.0.0.0' to access the server from outside
          hostname: 'localhost',
          middleware: function(connect, options) {
            return [prismMiddleware];
          }
        }
      }
    },

    prism: {
      proxyTest: {
        options: {
          proxies: [{
            mode: 'proxy',
            mocksPath: './mocks',
            context: '/proxyRequest',
            host: 'localhost',
            port: 8090,
            https: false
          }]
        }
      },
      recordTest: {
        options: {
          proxies: [{
            mode: 'record',
            mocksPath: './mocks',
            context: '/recordRequest',
            host: 'localhost',
            port: 8090,
            https: false
          }]
        }
      },
      mockTest: {
        options: {
          proxies: [{
            mode: 'mock',
            mocksPath: './mocksToRead',
            context: '/readRequest',
            host: 'localhost',
            port: 8090,
            https: false
          }]
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
  grunt.registerTask('test', [
    'clean',
    'prism:proxyTest',
    'prism:recordTest',
    'prism:mockTest',
    'connect:server',
    'mochaTest'
  ]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};