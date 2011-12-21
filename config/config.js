var express = require('express');
var path = require('path');
var path_dirname = path.dirname(__dirname);
var RedisStore = require('connect-redis')(express);

exports.boot_config =  function bootConfig(app) {
 // app.use(express.logger(':method :url :status'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: "keyboard cat",
    store: new RedisStore
	}));
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
  app.set('views', path_dirname + '/views');
  app.register('.html', require('ejs'));
  app.set('view engine', 'html');

}
