var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.disable('etag');

app.all('/test', function(req, res) {
  if (req.headers && req.headers['x-proxied-header']) {
    res.send('a server response with proxied header value of "'+ req.headers['x-proxied-header'] +'"');
  }
  else {
    res.send('a server response');
  }
});

app.post('/test_post', function(req, res) {
  res.send(req.body.foo);
});

app.get('/json', function(req, res) {
  res.json({"text": "a server response"});
});

app.get('/rewrite', function(req, res) {
  res.send('a rewritten server response');
});

module.exports = app;
