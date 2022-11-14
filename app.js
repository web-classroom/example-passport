var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var GitHubStrategy = require('passport-github2').Strategy;

var cookieParser = require('cookie-parser')

// Configure passport
passport.use(new Strategy(
  function (username, password, done) {
    if (username === "user" && password === "pass") {
      return done(null, { username: username });
    } else {
      return done(null, false);
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.username);
});

passport.deserializeUser(function (username, done) {
  done(null, { username: username });
});

// Application
var app = express();

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser())
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
var accounts = new Map();

app.get('/', function (req, res) {
  var balance = 0;
  if (req.user) {
    if (!accounts.has(req.user.username)) {
      accounts.set(req.user.username, 10000);
    }
    balance = accounts.get(req.user.username)
  }
  res.render('index', { user: req.user, balance: balance });
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
  res.redirect('/');
});

app.get('/logout', function (req, res) {
  req.logout(() => { res.redirect('/') });
});

// Restricted access
function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/withdraw', loggedIn, function (req, res) {
  res.render('withdraw');
});

app.post('/withdraw', loggedIn, function (req, res) {
  var amount = parseInt(req.body.amount);
  var balance = accounts.get("user") - amount;
  accounts.set(req.user.username, balance);
  res.redirect('/');
});


// Github Auth
passport.use(new GitHubStrategy(
  {
    clientID: "clientID",
    clientSecret: "clientSecret",
    callbackURL: "http://127.0.0.1:3000/auth/github/callback"
  },
  function (accessToken, refreshToken, profile, done) {
    done(null, profile);
  }
));

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

module.exports = app;
