// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var HTTPS_PORT = 443;
var fs=require('fs')

var port     = process.env.PORT || 8000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var Grid = require('gridfs-stream');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var busboyBodyParser = require('busboy-body-parser');
var configDB = require('./app/config/database.js');
var webdir = require('./app/config/config.js');
Grid.mongo = mongoose.mongo;
// configuration ===============================================================
mongoose.connect(configDB[0].url); // connect to our database
require('./app/config/passport.js')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json({limit: '50mb'}));
//app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(busboyBodyParser());

    // required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
var gfs = new Grid(mongoose.connection.db);




// routes ======================================================================
require('./app/route/routes.js')(app, passport,webdir,gfs); // load our routes and pass in our app and fully configured passport
//require('./app/route/imageAnalysisRoute.js')(app, gfs,passport); 

// launch ======================================================================
app.listen(8080)