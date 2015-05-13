var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var LocalStrategy = require('passport-local');

mongoose.connect('mongodb://localhost/competeFit');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

var userSchema = mongoose.Schema({

  email: String,
  password: String,
  competitions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Competition'}]
});
var User = mongoose.model('User', userSchema);

var competitionSchema = mongoose.Schema({
  startDate: Date,
  endDate: Date,
  users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});
var Competition = mongoose.model('Competition', competitionSchema);

var weighInSchema = mongoose.Schema({
  date: Date,
  weight: Number,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  competition: {type: mongoose.Schema.Types.ObjectId, ref: 'Competition'},
});
var WeighIn = mongoose.model('WeighIn', weighInSchema);

var router = express.Router();

var app = express();

passport.use(new LocalStrategy({usernameField: 'email'}, function(username, password, done) {
  User.findOne({email: username}).exec(function(err, user) {
    if (err) { return done(err); }
    
    if (!user) { 
      return done(null, false, { message: 'Unknown user ' + username }); 
    }
    
    if (user.password != password) {
      return done(null, false, { message: 'Invalid password' }); 
    }
    
    return done(null, user);
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(session({ 
  secret: 'herpderpdurrhurr',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
      res.status(403).send({message: 'Try logging in', error: true});
    }
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/authenticate', passport.authenticate('local'), function(req, res) {
    res.json({status: 'success'});
});
  
  
// Actual routes
router.get('/users', isLoggedIn, function(req, res, next) {
  User.find(function (error, records) {
      res.json(records);
  });
});
router.get('/users/:id', function(req, res, next) {
  User.findById(req.params.id, function (error, record) {
      res.json(record);
  });
});
router.post('/users/add', function(req, res, next) {
  var user = new User(req.body);
  user.save();
  res.json(weighIn);
});


router.get('/competitions', function(req, res, next) {
  Competition.find(function (error, records) {
      res.json(records);
  });
});
router.get('/competitions/:id', function(req, res, next) {
  Competition.findById(req.params.id, function (error, record) {
      res.json(record);
  });
});
router.post('/competitions/add', function(req, res, next) {
  var comptetition = new Competition(req.body);
  comptetition.save();
  res.json(weighIn);
});


router.get('/weigh-ins', function(req, res, next) {
  WeighIn.find(function (error, records) {
      res.json(records);
  });
});
router.get('/weigh-ins/:id', function(req, res, next) {
  WeighIn.findById(req.params.id, function (error, record) {
      res.json(record);
  });
});
router.post('/weigh-ins/add', function(req, res, next) {
  var weighIn = new WeighIn(req.body);
  weighIn.save();
  res.json(weighIn);
});

app.use(router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});


module.exports = app;
