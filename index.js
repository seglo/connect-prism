'use strict';

var di = require('di');
var director = require('director');

var injector = new di.Injector([]);

var Api = injector.get(require('./lib/services/api'));
var Prism = injector.get(require('./lib/prism'));
var PrismManager = injector.get(require('./lib/prism-manager'));
var HttpEvents = injector.get(require('./lib/http-events'));

var router = new director.http.Router();

Api.setRouter(router);

module.exports = {
  manager: PrismManager,
  create: Prism.create,
  useApi: Api.init,
  middleware: function(req, res, next) {
    var handledByApi = router.dispatch(req, res);

    if (handledByApi) {
      // we can only resolve the request body when we're not
      // proxying a request (i.e for our api)
      var buffer = '';
      req.on('data', function(data) {
        buffer += data;

        // Too much POST data, kill the connection!
        if (buffer.length > 1e6) {
          req.connection.destroy();
        }
      });
      req.on('end', function() {
        req.body = buffer;
      });
    } else {
      HttpEvents.handleRequest(req, res, next);
    }
  }
};