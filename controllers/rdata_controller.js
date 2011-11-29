var sys = require('util');
var events = require('events');
var redis = require('redis');
var client = redis.createClient();
var RData = require('../models/rdata');
var sessionsave = require('../lib/sessionsave');
var erraccess = 'error/err-access.html';

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu){
switch(action){
	case 'main': {
				
					var DateArray = new RData();
					DateArray.SelectMain('products');
					DateArray.on('finished', function(result){
					var user = req.session.user;
					user.lastaccess = req.session.lastAccess;
					var newsocketio = new sessionsave();
					newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
					res.render(req.params.menu, {
							locals: {
								user: user, 
								main_menu: main_menu,
								result: result,
								action: req.params.menu,
								edit: 'нет',
								table: result
							}
						});
					});
			};
		break;
		
	
	case 'edit': {
			var DateArray = new RData();
			DateArray.SelectProd(req.params.id);
					
			DateArray.on('finished', function(result){
				var user = req.session.user;
				user.lastaccess = req.session.lastAccess;
				var newsocketio = new sessionsave();
				newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
				res.render(req.params.menu+'/edit', {
					locals: {
							user: user, 
							main_menu: main_menu,
							action: 'нет',
							edit: 'нет',
							editform: req.params.form,
							dataedit: result[0]
					}
				});
			});
		}
		break;	
	}
};