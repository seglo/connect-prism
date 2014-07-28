# connect-prism

> Record, mock, and proxy HTTP traffic as middleware for the connect middleware framework.

## Getting Started

This middleware can be installed a la npm with the following command.

```shell
npm install connect-prism --save-dev
```

## Overview

Prism is similar to the Ruby project [VCR](https://github.com/elcuervo/vcr.js).

The purpose of this middleware is to provide an easy way for front end developers to record HTTP responses returned by their API (or some other remote source) and then be able replay the responses in the future.  It's basically an HTTP cache, but for developers working on a Single Page Application (SPA).

It's useful for mocking complex & high latency API calls during development.  It's also useful when writing e2e tests for your SPA only, removing the server from the equation.  This results in much faster execution of your e2e test suite.

Prism works by adding a custom connect middleware to a the [connect](https://www.npmjs.org/package/connect) middleware server.

### Modes

There are currently 4 supported modes of operation.

#### Record

The record mode will allow you to both record and proxy all HTTP traffic for a certain endpoint on your connect development server.  For example, if in production your API sits at an endpoint `/api` then you may be currently proxying requests to a server you're hosting locally on another port or to an integration machine somewhere else.  You may have also attempted to mock out services that make HTTP calls in your client side code itself.  While in record mode you can navigate your application and trigger all the types of API calls you would like to have recorded.  Prism will then listen for responses and serialize them to disk.  When you want to read these responses instead of proxying traffic to the real server you shutdown and switch to the 'mock' mode.

To make mocks more readable, responses with a content-type of `json` or `javascript` will have their data stringified as an object.  If the content-type is anything other than json or if stringification fails then it falls back to a string.

If the server returns a compressed response (gzip or deflate are supported), then prism will decompress the payload when recording the response.

Example mock generated:

```javascript
  {
    "requestUrl": "/api/ponies",
    "contentType": "application/json",
    "statusCode": 200,
    "data": {
      "text": "my little ponies"
    }
  }
```

#### Mock

The mock (read) mode will listen for requests to a certain endpoint.  When a request matches an endpoint it will attempt to find a previously recorded response in the directory you defined mocks to be saved in (./mocks by default).  

If a matching response is not found then prism will return a 404.  Prism will also create a mock during a 404.  This is useful when you want to mock API endpoints that may not exist yet.  To avoid having the subsequent request from returning the generated empty mock, the file has a .404 extension.  To use the mock, populate it with the appropriate values and remove the .404 extension.  This feature was contributed by [Miloš Mošovský](https://github.com/MilosMosovsky).

#### Mock & Record

As its name implies this operation will mock and record.  This mode will first attempt to load a mock if one exists.  If a mock does not exist it will then proxy the request and record the response instead of returning a 404.

#### Proxy

And finally, prism supports simple proxying in much the same way as the [grunt-connect-proxy](https://github.com/drewzboto/grunt-connect-proxy) plugin works.  In fact, this plugin is heavily inspired by that project.  While in proxy mode, listening events for recording and mocking are disabled.

### Adding the middleware to connect

Simple add the middleware to your connect instance as in the example.  You can configure prism before or after the middleware is added.

```js
  var connect = require('connect');
  var prism = require('connect-prism');

  prism.create({
    name: 'api',
    context: '/api'
    host: 'localhost'
  });

  var app = connect()
    .use(prism.middleware)
    .use(connect.static('public'))
    .use(function(req, res){
      res.end('hello world\n');
    })

  http.createServer(app).listen(3000);
```

### Using connect-prism with Grunt.js

If you're using grunt then head on over to the [grunt-connect-prism](http://github.com/seglo/grunt-connect-prism) page for more details.

### Using connect-prism with gulp

If you're using gulp then you would just use the core library along with gulp.  For a sample configuration see the [gulpfile.js](https://github.com/seglo/prism-sample-project/blob/master/gulpfile.js) in the [prism-sample-project](https://github.com/seglo/prism-sample-project).

## Configuration 

### Setting up prism

To initialize a prism instance call prism.create.  You can call prism.create more than once to run multiple configurations.

```js
  var prism = require('connect-prism');
  
  prism.create({
    name: 'api',
    mode: 'record',
    context: '/api'
    host: 'localhost',
    port: 8090,
    changeOrigin: true
  });
```

### Options

#### mode

Type: `String`

Default: `'proxy'`

Values: `'record'` | `'mock'` | `'proxy'` | `'mockrecord'`

By setting a mode you create an explicit declaration that the context you're proxying will always be in the configured mode.  You can optionally override the mode of all the proxies for a target by passing in a 3rd parameter to the prism grunt task prism:[target]:[mode]

i.e. `grunt prism:server:mock`

#### mocksPath

Type: `String`

Default: `'./mocks'`

Path to the root directory you want to record and mock responses.  If the directory does not exist then prism will attempt to create it.  If prism is executed with a target then recorded and mocked responses will be read from `'./mocks/targetName'`.  If no target is defined then only the default prism options will be used.

#### context

Type: `String`

Default: n/a

The starting context of your API that you are proxying.  This should be from the root of your webserver.  All requests that start with this context string will be used.

#### host

Type: `String`

Default: n/a

The server name or IP of the API that you are proxying.

#### port

Type: `Integer`

Default: n/a

The port number of the API that you are proxying.

#### https

Type: `Boolean`

Default: false

The http scheme of the API you are proxying.  `true` === `https`, `false` === `http`

#### changeOrigin

Type: `Boolean`

Default: false

Whether to change the origin on the request to the proxy, or keep the original origin.

#### delay

Type: `String` or `Integer`

Default: 0

Values: A number in milliseconds | `'auto'` | `'fast'` | `'slow'`

Delay will work with all modes.

This option allows you to simulate a delay when returning a mock response to the user.  Sometimes it's handy to simulate a delay because this will give you a better impression of how the user experience of your app will be when fully integrated with a backend server.

You can configure an exact delay in milliseconds or one of the precreated options which returns a random delay in a certain range.

* auto: 500 to 1750 ms
* fast: 150 to 1000 ms
* slow: 1500 to 3000 ms

Thanks again to [Miloš Mošovský](https://github.com/MilosMosovsky) for this feature.

#### rewrite

Type: `Object`

Default: `{}`

Add rewrite rules that prism will apply to all requests.  This functionality was copied from [grunt-connect-proxy and works the exact same way](https://github.com/drewzboto/grunt-connect-proxy#optionsrewrite).  You can configure a list of rewrite rules with an object.

```js
  {
    '^/removingcontext': '',
    '^/changingcontext': '/anothercontext'
  }
```

## TODO Wishlist
* mockrecord mode which will mock responses and attempt to record responses that don't exist yet.

## Release History
* 0.1.0 Initial release.
* 0.1.1 Stop recording all response headers.  Only capture content-type.
* 0.2.0 Support 'cassettes' by putting mocks into directories named after target.  Use http-proxy 0.10.4 to workaround around socket hangup issues in 1.1.4.
* 0.2.1 Fixed record mode and tests so we don't release broken again!
* 0.2.2 Support change origin.
* 0.3.0 Forked from grunt-connect-prism to core library.  Added delay and mock/404 feature from [Miloš Mošovský](https://github.com/MilosMosovsky).
* 0.4.0 Added rewrite functionality.  'mockrecord' mode.  More non-verbose logging for mock and recording operations.
* 0.4.1 Fix for delay auto > 0 bug and support delay in proxy mode by [generalov](https://github.com/generalov).  Fix for invalid SSL cert bug by [Josh Miller](https://github.com/velveteer).  Thanks much <3.  Made non-verbose logging more consistent.  Fixed broken verbose logging.
* 0.4.2 Fix for recording response from a rewrite rule outside of the context of a prism configuration from [Mike Kibbel](https://github.com/skibblenybbles).
* 0.5.0 Decompress responses when recording responses.