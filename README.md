# grunt-connect-prism

> Record, playback, and proxy HTTP traffic as middleware for the grunt-contrib-connect plugin.

## Getting Started
This plugin requires Grunt `~0.4.1` and the [grunt-contrib-connect](https://github.com/gruntjs/grunt-contrib-connect) `~0.7.1` plugin to already be installed.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-connect-prism --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-connect-prism');
```
## Overview

The purpose of this plugin is to provide an easy way for front end developers to record HTTP responses returned by their API (or some other remote source) and then be able replay the responses in the future.  It's basically an HTTP cache, but for developers working on a Single Page Application (SPA).

It's useful for mocking complex & high latency API calls during development.  It's also useful when writing e2e tests for your SPA only, removing the server from the equation.  This results in much faster execution of your e2e test suite.

Prism works by adding a custom connect middleware to the [grunt-contrib-connect](https://github.com/gruntjs/grunt-contrib-connect) plugin.

### Modes

There are currently 3 supported modes of operation.

#### Record

The record mode will allow you to both record and proxy all HTTP traffic for a certain endpoint on your connect development server.  For example, if in production your API sits at an endpoint `/api` then you may be currently proxying requests to a server you're hosting locally on another port or to an integration machine somewhere else.  You may have also attempted to mock out services that make HTTP calls in your client side code itself.  While in record mode you can navigate your application and trigger all the types of API calls you would like to have recorded.  Prism will then listen for responses and serialize them to disk.  When you want to read these responses instead of proxying traffic to the real server you shutdown and switch to the 'mock' mode.

#### Mock

The mock (read) mode will listen for requests to a certain endpoint.  When a request matches an endpoint it will attempt to find a previously recorded response in the directory you defined mocks to be saved in (./mocks by default).  If a matching response is not found then prism will return a 404.

#### Proxy

And finally, prism supports simple proxying in much the same way as the [grunt-connect-prism](https://github.com/drewzboto/grunt-connect-proxy) plugin works.  In fact, this plugin is heavily inspired by that project.  While in proxy mode, listening events for recording and mocking are disabled.

### Adapting the "connect" task

#### Adding the middleware

Note: This configuration was recycled from [grunt-connect-proxy's README.md](https://github.com/drewzboto/grunt-connect-proxy#adding-the-middleware).

##### With Livereload

Add the middleware call from the connect option middleware hook
```js
  connect: {
    livereload: {
      options: {
        middleware: function (connect, options) {
          if (!Array.isArray(options.base)) {
            options.base = [options.base];
          }

          // Setup the proxy
          var middlewares = [require('grunt-connect-prism/lib/events').handleRequest];

          // Serve static files.
          options.base.forEach(function(base) {
            middlewares.push(connect.static(base));
          });

          // Make directory browse-able.
          var directory = options.directory || options.base[options.base.length - 1];
          middlewares.push(connect.directory(directory));

          return middlewares;
        }
      }
    }
  }
```

##### Without Livereload

It is possible to add the proxy middleware without Livereload as follows:

```js
  // server
  connect: {
    server: {
      options: {
        port: 8000,
        base: 'public',
        logger: 'dev',
        hostname: 'localhost',
        middleware: function (connect, options) {
          var prism = require('grunt-connect-prism/lib/events').handleRequest;
          return [
            // Include the proxy first
            prism,
            // Serve static files.
            connect.static(options.base),
            // Make empty directories browsable.
            connect.directory(options.base)
          ];
        }
      }
    }
  }
```

## Configuration 

In your project's Gruntfile, add a section named `prism`.

### Adding prism configuration.

```js
  prism: {
    server: {
      options: {
        proxies: [{
          mode: 'record',
          mocksPath: './mocks',
          context: '/api',
          host: 'localhost',
          port: 8090,
          https: false
        }]
      }
    }
```

### Adding the prism task to the server task
For the server task, add the configureProxies task before the connect task
```js
  grunt.registerTask('server', function (target, prismMode) {
      grunt.task.run([
          'clean:server',
          'compass:server',
          'prism:' + target + ':' prismMode, /* see mode configuration for more details */
          'livereload-start',
          'connect:livereload',
          'open',
          'watch'
      ]);
  });
```

### Options

#### mode:

Type: `String`
Default: `'proxy'`

Values: `'record'`|`'read'`|`'proxy'`

By setting a mode you create an explicit declaration that the context you're proxying will always be in the configured mode.  You can optionally override the mode of all the proxies for a target by passing in a 3rd parameter to the prism grunt task prism:[target]:[mode]

i.e. `grunt prism:server:mock`

#### mocksPath:

Type: `String`
Default: `'./mocks'`

Path to the directory you want to record and mock responses.  If the directory does not exist then prism will attempt to create it.

#### context:

Type: `String`
Default: n/a

The starting context of your API that you are proxying.  This should be from the root of your webserver.  All requests that start with this context string will be used.

#### host:

Type: `String`
Default: n/a

The server name or IP of the API that you are proxying.

#### port:

Type: `Integer`
Default: n/a

The port number of the API that you are proxying.

#### https:

Type: `Boolean`
Default: false

The http scheme of the API you are proxying.  `true` === `https`, `false` === `http`

## TODO Wishlist
* Detect json responses and format data property appropriately.

## Release History
* 0.1.0 Initial release