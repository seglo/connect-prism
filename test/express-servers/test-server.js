var express = require('express');

var app = express();

app.disable('etag');

app.all('/test', function(req, res) {
  res.send('a server response');
});

app.get('/json', function(req, res) {
  res.json({"text": "a server response"});
});

app.get('/rewrite', function(req, res) {
  res.send('a rewritten server response');
});

module.exports = app;