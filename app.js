/*global console:false, __dirname:false, process:false */

/**
 * Module dependencies.
 */
	
var requirejs = require('requirejs');

requirejs.config({
	nodeRequire: require
});

requirejs([
	'express',
	'mongoose',
	'server/api/events'
], function(
	express,
	mongoose,
	api_events
){
	"use strict";

	// connect to MongoDB
	var mgUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/myevents';
	mongoose.connect(mgUri);
	
	var app = express();

	app.configure(function(){
		app.use(express.favicon());
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(app.router);
	});

	app.configure('development', function(){
		app.use(express.logger('dev'));
		app.use(express['static'](__dirname + '/public'));
		app.use(express.errorHandler({
			dumpExceptions: true, 
			showStack: true
		}));
	});

	app.configure('production', function(){
		// build client if directory client-build not found
		var path = require('path');
		if (!path.existsSync("client-build")) {
			require('./build');
		}
		app.use(express['static'](__dirname + '/client-build'));
	});

	// ROUTES
	app.get('/api/events', api_events.getAll);
	app.del('/api/events/:id', api_events.remove);
	app.post('/api/events', api_events.create);

/*
	app.get('/', function(req, res){
		//Apache-like static index.html (public/index.html)
		//res.redirect("/index.html");
		//Or render from view
		//res.render("index.html")
	});
*/

	// HTTP
	var port = process.env.PORT || 8080;
	app.listen(port);

	//console.log("Http server listening on port 80");
});
