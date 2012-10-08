var sys = require('util');
var events = require('events');
var UserModel = require('../models/user');
var sessionsave = require('../lib/sessionsave');
var erraccess = 'error/err-access.html';
var list_customers = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'users', name: 'Клиенты', url:'/users'}
	];

var listcustomers = [ 
	{id:'1', name: 'ЛЗБИ'},
	{id:'2', name: 'ВФП'}
	];
	
exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu, client){
switch(action){
	case 'main': {
				var users = new UserModel(client);
				users.findUsersActive(function(err, result){
					if(err) console.log('Ошибка controllerRouting users_main');
					else {
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);
						res.render(req.params.menu, {
									user: user, 
									main_menu: main_menu,
									listcustomers: listcustomers,
									action: req.params.menu,
									edit: 'нет',
									table: result
							});
					}
				});
			};
		break;
		
	
	case 'edit': {
			var users = new UserModel(client);
			users.findByUserID(req.params.id, function(err, result){
				if(err) console.log('Ошибка controllerRouting users_edit');
				else if (result) {
					var user = req.session.user;
					user.lastaccess = req.session.lastAccess;
					var newsocketio = new sessionsave();
					newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);
					res.render(req.params.menu+'/edit', {
							user: user, 
							main_menu: main_menu,
							listcustomers: listcustomers,
							action: 'нет',
							edit: 'нет',
							users: result
						});
				} else console.log('User not found');
			});
			};
		break;
	
	}	
};

