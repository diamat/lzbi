var path = require('path');
var path_dirname = path.dirname(__dirname);
var dir = require('./dirs');
var route = require('../config/routers-script');

var express = require('express');

exports.bootControllers = function (app) {
  var full_files = new Object();
  full_files.files = [];
  var v = dir.subReaddir (path_dirname + '/controllers', full_files,'');
  v.files.forEach(function(file){
      bootController(app, file);
    });
}


function bootController(app, file) {
  var name = file.replace('.js', '');
  var actions = require('../controllers/' + name);
  var prefix = '/' + name; 
	
// Special case for "app"
  if (name == 'app') prefix = '/';
  
  var script = '';
  
  if(name == 'login') script = 'login';
  else script = 'standart';
  
  Object.keys(actions).map(function(action){
    var fn = controllerAction(name, action, actions[action]);
    route.scriptRouting(app, prefix, action, script , fn);
  });
}

// Proxy res.render() to add some magic


function controllerAction(name, action, fn) {
  return function(req, res, next){
    var render = res.render
      , format = req.params.format
      , path = path_dirname + '/views/' + name + '/' + action + '.html';
	
    res.render = function(obj, options, fn){
	   res.render = render;
      // Template path
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
      }
/*
      // Format support
      if (action == 'show' && format) {
        if (format === 'json') {
          return res.send(obj);
        } else {
          throw new Error('unsupported format "' + format + '"');
        }
      }

      // Render template
      res.render = render;
      options = options || {};
	  plural = name + 's';
	  if (action == 'index' && plural == 'users') {
        options[plural] = obj;
      } else {
        options[name] = obj;
      }
*/	  
      return res.render(path, options, fn);
    };
    fn.apply(this, arguments);
  };
}
