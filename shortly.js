var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
//added cookieParser
var cookieParser = require('cookie-parser');
//added express session
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(cookieParser());
app.use(session({
  saveUninitialized: false, 
  resave: false,
  secret: 'keyboard cat'}));

// function restrict(req, res, next) {
//   if (req.session.user) {
//     next();
//   } else {
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// }

app.get('/', 
function(req, res) {
  if (req.session.user) {
    res.render('index'); 
  }else{
    //res.location('/login').end();
    res.redirect('/login');
  }
  //if theyre not logged in, display the log-in page
  //when they try to log-in, run the log-in function
});

app.get('/login',
function(req, res) {
  res.render('login');
})

app.get('/signup',
function(req, res) {
  res.render('signup');
})
//signup
// app.get('/signup',
//   function(req, res) {
//     res.render('signup');
//   })

app.get('/create', 
function(req, res) {
  if (req.session.user) {
    res.render('index'); 
  } else {  
      res.location('/login').end();
  }
});

app.get('/links', 
function(req, res) {
  if (req.session.user) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {  
      res.location('/login').end();
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/signup',
function(req, res) {
  User.forge({
    username: req.body.username,
    password: req.body.password
  })
  .save()
  .then(function (user) {
  req.session.user = 'hi';
  res.redirect('/').json({error: false, data: {username: user.get('username')}});
  })
  .catch(function (err) {
    res.status(500).json({error: true, data: {message: err.message}});
  }); 
})

app.post('/login',
function(req, res) {
  if (req.session.user) {
    req.session.destroy();
  }
  Users.fetch().then(function(){ 
    util.isValidUser(req.body.username, function(result){
      if (result===true) {
        req.session.user = 'hi';
        res.redirect('/');
      } else {
        res.render('login');
      }
    })
  });
});


  
  //end session info/clear session
  //redirect/render login
// })



//make a logout button--put it on the ole index
  //on click, delete the information from the session
//when you create an account it should auto log you in

/************************************************************/
// Write your dedicated authentication routes here
// e.g. login, logout, etc.
/************************************************************/

//login function that logs someone in

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
