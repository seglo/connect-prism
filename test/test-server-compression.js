var express = require('express');
var compression = require('compression');

var app = express();

app.disable('etag');

// compress everything
app.use(compression({
  threshold: 0
}));

app.all('/test', function(req, res) {
  res.send('a server response');
});

module.exports = app;