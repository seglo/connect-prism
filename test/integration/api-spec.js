// 'use strict';

// var assert = require('assert');
// var di = require('di');
// var http = require('http');
// var querystring = require('querystring');

// var prism = require('../../');

// var Api = require('../../lib/services/api');
// var PrismManager = require('../../lib/prism-manager');

// describe('api', function() {
//   var manager = prism.manager;

//   afterEach(function() {
//     manager.reset();
//   });

//   var api;

//   // beforeEach(function() {
//   //   function MockPrismManager() {
//   //     this.getApiConfig = function() {
//   //       return {
//   //         enabled: true,
//   //         route: '/_prism/'
//   //       };
//   //     };
//   //   }

//   //   // NOTE: it's important to annotate before getting the injector instance
//   //   di.annotate(MockPrismManager, new di.Provide(PrismManager));
//   //   var injector = new di.Injector([MockPrismManager]);

//   //   api = injector.get(Api);
//   // });


//   describe('api url validation', function() {
//     var api;

//     beforeEach(function() {
//       prism.create({
//         name: 'foo',
//         context: '/test',
//         host: 'localhost',
//         port: 8090
//       });

//       api = injector.get(Api);
//     });

//     it('should validate a real prism api request', function() {
//       var validApiRequest = api.isApiRequest({
//         "url": "/_prism/foo"
//       });

//       assert.equal(validApiRequest, true);
//     });

//     it('should invalidate an incorrect prism api request', function() {
//       var validApiRequest = api.isApiRequest({
//         "url": "/anyOtherRequest/foo"
//       });

//       assert.equal(validApiRequest, false);
//     });
//   });

//   it.only('should create a new prism instance', function() {
//     var request = httpMocks.createRequest({
//       method: 'POST',
//       url: '/_prism/create'
//     });

//     var postData = querystring.stringify({
//       name: 'mockTest',
//       mode: 'mock',
//       mocksPath: './mocksToRead',
//       context: '/readRequest',
//       host: 'localhost',
//       port: 8090
//     });

//     request.write(postData);
//     request.end();

//     var response = httpMocks.createResponse();

//     api.requestHandler(request, response);
//   });
// });