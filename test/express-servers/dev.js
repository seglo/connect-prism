var express = require('express');
var app = express();
app.disable('etag');
app.get('/api/users', function(req, res) {
  res.send([{
    user: 'john',
    fave_genre: 'science fiction',
    last_book_purchased: 'the light of other days'
  }, {
    user: 'genevieve',
    fave_genre: 'fantasy',
    last_book_purchased: 'game of thrones: a dance with dragons'
  }, {
    user: 'zach',
    fave_genre: 'non-fiction',
    last_book_purchased: 'freakonomics'
  }]);
});
app.get('/api/books', function(req, res) {
  res.send([{
    book: 'the light of other days',
    authors: ['arthur c clarke', 'stephen baxter'],
    genre: 'science fiction'
  }, {
    book: 'game of thrones: a dance with dragons',
    authors: ['george r martin'],
    genre: 'fantasy'
  }, {
    book: 'freakonomics',
    authors: ['stephen j dubner', 'steven d. levitt'],
    genre: 'non-fiction'
  }]);
});
app.get('/api/authors', function(req, res) {
  res.send([{
    name: 'arthur c clarke',
  }, {
    name: 'stephen baxter'
  }, {
    name: 'george r martin'
  }, {
    name: 'stephen j dubner'
  }, {
    name: 'steven d. levitt'
  }]);
});
module.exports = app;