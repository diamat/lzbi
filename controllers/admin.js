//admin.js
var role = 'admin';
var erraccess = 'error/err-access.html';
var errselect = 'error/err-select.html';
var sessionsave = require('../lib/sessionsave');
var UsersController = require('./users_controller');
var SpravprodController = require('./spravprod_controller');
var redis = require('redis');
var client = redis.createClient();

var main_menu = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'users', name: 'Пользователи', url:'/users'},
	{id:'spavprod', name: 'Справ.прод.', url:'/spravprod'}
	];

module.exports = {

  index: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else{
		var user = req.session.user;
		user.lastaccess = req.session.lastAccess;
		var newsocketio = new sessionsave();
		newsocketio.socketnameSave(role+'-socket.js', user.lastaccess);
		res.render(role, {
						user: user,
						main_menu: main_menu,
						action: '1',
						edit: 'нет'
				});
	}
  },
  
  menu:  function(req, res){
		if(req.session.user.role != role) res.render(erraccess);
		else if(req.params.menu === 'users') UsersController.controllerRouting('main', req, res, role, main_menu, client);
		else if(req.params.menu === 'spravprod') SpravprodController.controllerRouting('main', req, res, role, main_menu, client);
		else res.render(errselect);
	},
	
  edit: function(req, res){
		if(req.session.user.role != role) res.render(erraccess);
		else if(req.params.menu === 'users' && req.params.form === 'user') UsersController.controllerRouting('edit', req, res, role, main_menu, client);
		else if(req.params.menu === 'spravprod') SpravprodController.controllerRouting('edit', req, res, role, main_menu, client);
		else res.render(errselect);		
	}
  
};
