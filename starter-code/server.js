'use strict';

// Install and require the Node packages into your project, and ensure that it's now a new dependency in your package.json. DO NOT FORGET to run 'npm i'
const pg = require('pg'); // 3rd party package
const fs = require('fs'); // native Node
const express = require('express'); // 3rd party package

// REVIEW: Require in body-parser for post requests in our server
const bodyParser = require('body-parser'); // 3rd party package
const PORT = process.env.PORT || 3000;
const app = express();

// Complete the connection string for the url that will connect to your local postgres database
// Windows and Linux users; You should have retained the user/pw from the pre-work for this course.
// Your url may require that it's composed of additional information including user and password
// const conString = 'postgres://USER:PASSWORD@HOST:PORT/DBNAME';
const conString = 'postgres://patrick:test@localhost:5432/kilovolt';

// REVIEW: Pass the conString to pg, which creates a new client object
const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins so that our app is aware and can use the body-parser module
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources

// NOTE: The user sends a AJAX request for the index page. The server sends a response of the index.html. this is a CRUD "Read" operation that goes through numbers 2,5,1 in the drawing.
app.get('/', function(request, response) {
  response.sendFile('index.html', {root: '.'});
});

// NOTE: The user sends a AJAX request for the mew page. The server sends a response of the new.html. this is a CRUD "Read" operation that goes through numbers 2,5,1 in the drawing
app.get('/new', function(request, response) {
  response.sendFile('new.html', {root: '.'});
});


// REVIEW: Routes for making API calls to use CRUD Operations on our database

// NOTE: The user sends an AJAX request for all articles to the server from Article.fetchAll(), then the server forms that request into a SQL query to the database and returns to the user a response containing the results of the request. This is a CRUD "READ" operation that goes through numbers 2,3,4,5 in the drawing.
app.get('/articles', function(request, response) {
  client.query('SELECT * FROM articles')
  .then(function(result) {
    response.send(result.rows);
  })
  .catch(function(err) {
    console.error(err)
  })
});

// NOTE:The user sends an AJAX request to add a new record to the server which then makes a SQL query to the article database which then returns a console message of 'insert complete' when done or an err message if there was an error. This is a CRUD "UPDATE" operation that goes through numbers 2,3,4,5 in the drawing.
app.post('/articles', function(request, response) {
  client.query(
    `INSERT INTO
    articles(title, author, "authorUrl", category, "publishedOn", body)
    VALUES ($1, $2, $3, $4, $5, $6);
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body
    ]
  )
  .then(function() {
    response.send('insert complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:The user sends an AJAX request to update an existing article at specified Id to the server which then makes a SQL query to the database. The database then sends back a success message or error back to the server which then displays a console message of 'update complete' This is a CRUD "UPDATE" operation that goes through numbers 2,3,4,5 in the drawing.
app.put('/articles/:id', function(request, response) {
  client.query(
    `UPDATE articles
    SET
      title=$1, author=$2, "authorUrl"=$3, category=$4, "publishedOn"=$5, body=$6
    WHERE article_id=$7;
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body,
      request.params.id
    ]
  )
  .then(function() {
    response.send('update complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:The user sends an AJAX request to the server to delete a single article at a specified Id and then the server sends a SQL query to the database to delete a specified record from the database. The database then sends the server back a success message or err message a which will cause the server to display a different console message depending the success. This is a CRUD "DESTROY" operation that goes through numbers 2,3,4,5 in the drawing.
app.delete('/articles/:id', function(request, response) {
  client.query(
    `DELETE FROM articles WHERE article_id=$1;`,
    [request.params.id]
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE:The user sends an AJAX request to delete all records but, not the table, to the server which then sends a SQL query to the database to delete all articles. The database then responds to the server with success or err and the server then dipslays a console message of 'delete complete' or an error. This is a CRUD "DESTROY" operation that goes through numbers 2,3,4,5 in the drawing.
app.delete('/articles', function(request, response) {
  client.query(
    'DELETE FROM articles;'
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// NOTE: runs the loadDB function
loadDB();

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
// NOTE: This is an AJAX request sent to the server for filling to fill the database with articles. The server then sends a SQL query to the database to fill the table articles data. It does this by seeing if there are articles in the database already and if not, add them. This is a CRUD "CREATE" operation that goes through numbers 2,3 in the drawing because we do not recieve a response when completed.
function loadArticles() {
  client.query('SELECT COUNT(*) FROM articles')
  .then(result => {
    if(!parseInt(result.rows[0].count)) {
      fs.readFile('./public/data/hackerIpsum.json', (err, fd) => {
        JSON.parse(fd.toString()).forEach(ele => {
          client.query(`
            INSERT INTO
            articles(title, author, "authorUrl", category, "publishedOn", body)
            VALUES ($1, $2, $3, $4, $5, $6);
          `,
            [ele.title, ele.author, ele.authorUrl, ele.category, ele.publishedOn, ele.body]
          )
        })
      })
    }
  })
}

// NOTE:The user sends an AJAX request to the server to create the table if one does not exist. The server then sends a SQL query to create a table in the database if one does not exist already. And to the run the function .loadArticles on the newly created database table. This is a CRUD "CREATE" operation that goes through numbers 2,3 in the drawing.
function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      "authorUrl" VARCHAR (255),
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL);`
    )
    .then(function() {
      loadArticles();
    })
    .catch(function(err) {
      console.error(err);
    }
  );
}
