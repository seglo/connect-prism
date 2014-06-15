'use strict';

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
            return [require("./lib/events.js").handleRequest];
          }
        }
      }
    },

    prism: {
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
    'jshint',
    'prism:proxyTest',
    'prism:recordTest',
    'prism:mockTest',
    'prism:modeOverrideTest:record',
    'prism:inheritRootOptionsTest',
    'connect:server',
    'mochaTest'
  ]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};