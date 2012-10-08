var sys = require('util');
var events = require('events');
var SpravProdModel = require('../models/spravprod');
var sessionsave = require('../lib/sessionsave');
var sprav = require('../lib/sprav');
var erraccess = 'error/err-access.html';

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu, client){
switch(action){
	case 'main': {
				console.log('Вход1!');
				var spravprod = new SpravProdModel(client);
				spravprod.findList(function(err, result){
					if(err) console.log('Ошибка controllerRouting spravprod_main');
					else {
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);
						res.render(req.params.menu, {
									user: user, 
									main_menu: main_menu,
									action: req.params.menu,
									edit: 'нет',
									unit: sprav.spravUnit,
									group: sprav.spravProdGroup,
									table: result
							});
					}
				});
			};
		break;
		
	
	case 'edit': {
			var spravprod = new SpravProdModel(client);
			spravprod.findByProdSID(req.params.id, function(err, result){
				if(err) console.log('Ошибка controllerRouting spravprod_edit');
				else {
					var user = req.session.user;
					user.lastaccess = req.session.lastAccess;
					var newsocketio = new sessionsave();
					newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);
					res.render(req.params.menu+'/edit', {
							user: user, 
							main_menu: main_menu,
							action: 'нет',
							edit: 'нет',
							unit: sprav.spravUnit,
							group: sprav.spravProdGroup,
							prod: result
						});
				} 
			});
			};
		break;
	
	}	
};

