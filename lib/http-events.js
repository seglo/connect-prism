'use strict';

var di = require('di');

var injector = new di.Injector([]);

var PrismManager = require('./prism-manager.js');
var UrlRewrite = require('./services/url-rewrite');
var RequestStateMachine = require('./services/request-state-machine.js');
var MockFilenameGenerator = require('./services/mock-filename-generator');

function HttpEvents(prismManager, urlRewrite, rsmachine, mockFilenameGenerator) {

  this.handleRequest = function(req, res, next) {
    var prism = prismManager.get(req.url);
    if (prism.config.sequential === true) {
      var filename = mockFilenameGenerator.getMockFilename(prism, req);
      rsmachine.iteratePath(filename);
    }
    if (prism) {
	// rewrite request if applicable
	if (prism.config.rules.length) {
          prism.config.rules.forEach(urlRewrite.rewriteRequest(req));
	}

	prism.config.requestHandler(req, res, prism);
      } else {
	next();
      }
    };

    this.handleResponse = function(proxyRes, req, res) {
      var prism = prismManager.get(req.originalUrl);

      if (prism) {
	prism.config.responseHandler(req, proxyRes, prism);
      }
    };
  }

  di.annotate(HttpEvents, new di.Inject(PrismManager, UrlRewrite, RequestStateMachine, MockFilenameGenerator));

  module.exports = HttpEvents;
