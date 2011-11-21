var sys = require('util');
var events = require('events');
var redis = require('redis');
var client = redis.createClient();
var UserModel = require('../models/user');
var sessionsave = require('../lib/sessionsave');
var CustomerSQL = require('../models/customers_main');
var role = 'admin';
var erraccess = 'error/err-access.html';

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu){
switch(action){
	case 'main': {
				
				var UsersArray = new ListUserActive();
				UsersArray.on('finished', function(result){
				
					var DateArray = new CustomerSQL();
					DateArray.ListCustomer();
				
					DateArray.on('finished', function(list_customers){
					var user = req.session.user;
					user.lastaccess = req.session.lastAccess;
					var newsocketio = new sessionsave();
					newsocketio.SocketnameSave(role+'-socket.js', user.lastaccess);
					res.render(req.params.menu, {
							locals: {
								user: user, 
								main_menu: main_menu,
								listcustomers: list_customers,
								action: req.params.menu,
								edit: 'нет',
								table: result
							}
						});
					});
				});
			};
		break;
		
	
	case 'edit': {
			var users = new UserModel(client);
			users.findByUserName(req.params.id, function (err, result, callback) {
				if (err) {
					console.log('' + err);
					user.client.quit();
				} else if (result) {
				
					var DateArray = new CustomerSQL();
					DateArray.ListCustomer();
				
					DateArray.on('finished', function(list_customers){
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.SocketnameSave(role+'-socket.js', user.lastaccess);
						res.render(req.params.menu+'/edit', {
							locals: {
								user: user, 
								main_menu: main_menu,
								listcustomers: list_customers,
								action: 'нет',
								edit: 'нет',
								users: result
							}
						});
					});
				} else {
					console.log('User not found');
					this.client.quit();
				}
			});
			};
		break;
	}	
};

function ListUserActive() {
	var users_id = [];
	var list_i = 0;
	var UsersArray = [];
	var self = this;
	
	var users = new UserModel(client);
	
	users.findUsersActive();
	
	users.on('result_findUsersActive', function(result){
		users_id = result;
		users.findByUserID(result[0]);
	});	
	
	users.on('result_findByUserID', function(result){
		UsersArray[list_i] = result;
		list_i = list_i+1;
		if(list_i >= users_id.length) {self.emit('finished', UsersArray);}
		else users.findByUserID(users_id[list_i]);
	});	
	
	users.on('error', function(error){
		console.log(error);
	});	
	
	events.EventEmitter.call(this);
}

sys.inherits(ListUserActive, events.EventEmitter);