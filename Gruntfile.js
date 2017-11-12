'use strict';

var prism = require('./index');
var path = require('path');

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

    watch: {
      test: {
        options: {
          atBegin: true
        },
        files: ['lib/**/*.js'],
        tasks: ['test'],
      },
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
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

    express: {
      server: {
        options: {
          port: 8090,
          server: path.resolve('./test/express-servers/test-server.js')
        }
      },
      serverCompression: {
        options: {
          port: 8091,
          server: path.resolve('./test/express-servers/test-server-compression.js')
        }
      },
      dev: {
        options: {
          port: 8092,
          server: path.resolve('./test/express-servers/dev.js')
        }
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
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'jshint', 'express:server', 'express:serverCompression', 'connect:server', 'mochaTest']);

  // Watch mode for tests
  grunt.registerTask('test:watch', ['watch:test']);
  
  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

  // Run in dev mode
  grunt.registerTask('dev', 'run in dev mode', function(prismMode) {
    prismMode = prismMode || 'proxy';

    prism.create({
      name: 'dev',
      mode: prismMode,
      context: '/api',
      host: 'localhost',
      port: 8092,
      rewrite: {
        '^/api/bookauthors': '/api/authors',
        '^/api/authors?/.*': '/api/authors'
      }
    });
    prism.useApi();
    prism.useVerboseLog();

    grunt.task.run(['connect', 'express:server', 'express:serverCompression', 'express:dev', 'express-keepalive']);
  });

};