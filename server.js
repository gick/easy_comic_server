// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
let ENV = process.env.NODE_ENV
let PORT = process.env.PORT
// Lets use this location as a convention
let CERT_PATH=process.env.HOME+'/.cert/'
var fs=require('fs')
var https = require('https')

var mongoose = require('mongoose');
var passport = require('passport');
var Grid = require('gridfs-stream');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var busboyBodyParser = require('busboy-body-parser');
var configDB = require('./app/config/database.js');
var webdir = __dirname +'/svelte-comic/public'
Grid.mongo = mongoose.mongo;
// configuration ===============================================================
mongoose.connect(configDB[0].url); // connect to our database
require('./app/config/passport.js')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json({limit: '50mb'}));
//app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(busboyBodyParser());
app.use(express.static(webdir))
    // required for passport
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
var gfs = new Grid(mongoose.connection.db);




// routes ======================================================================
require('./app/route/routes.js')(app, passport,webdir,gfs); // load our routes and pass in our app and fully configured passport
//require('./app/route/imageAnalysisRoute.js')(app, gfs,passport);

// launch ======================================================================
if (ENV === "production") {
	var secureServer = https.createServer({
			key: fs.readFileSync(CERT_PATH+'privkey.pem'),
			cert: fs.readFileSync(CERT_PATH+'cert.pem')
		}, app)
		.listen(PORT, function () {
			console.log('Secure Server listening on port ' + PORT)
		})
}

//start a simple server for developpement
if (ENV === "dev") {
	app.listen(PORT)
}
