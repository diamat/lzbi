var express = require('express');
var path = require('path');
var path_dirname = path.dirname(__dirname);
var redisStore = require('connect-redis')(express);
var JUST = require('just');
var just = new JUST({ root : '/home/lzbi/views' });
var fs = require('fs');

exports.boot_config =  function bootConfig(app) {
 // app.use(express.logger(':method :url :status'));
	app.use(express.bodyParser());
	app.use(express.cookieParser('keyboard cat'));
	app.use(express.session({ store: new redisStore}));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path_dirname + '/public'));

	// Example 500 page
	app.use(function(err, req, res, next){
		res.render('error/500');
	});

	// Example 404 page via simple Connect middleware
	app.use(function(req, res){
		res.render('error/404');
	});

		
	// Setup ejs views as default, with .html as the extension
	//app.set('views', { root : __dirname + '/view' });
	app.engine('.html', function(path, options, fn){
		var str = path.replace('.html', '');
		str = str.replace('/home/lzbi/views', '');
		//str = str.replace('/var/www/semen/lzbi/views', '');
		just.render(str, options, function(error, html) {
			if(error) console.log(error);
			else fn(null, html)
			});
	});
	app.set('view engine', 'html');
	/*
	process.addListener("uncaughtException", function (err) {
		console.log("Uncaught exception: " + err);
		console.trace();
	});
		*/
}
