//admin.js
var UsersController = require('./users_controller');
var RDataController = require('./rdata_controller');
var SysController = require('./sys_controller');
var role = 'admin';
var erraccess = 'error/err-access.html';
var errselect = 'error/err-select.html';
var sessionsave = require('../lib/sessionsave');

var main_menu = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'2', name: 'Сообщения', url:'/'},
	{id:'users', name: 'Пользователи', url:  '/'+role+'/users'},
	{id:'rdata', name: 'Справ. данные', url:  '/'+role+'/rdata'},
	{id:'sys', name: 'Система', url:  '/'+role+'/sys'}
	];

module.exports = {

  index: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else{
		var user = req.session.user;
		user.lastaccess = req.session.lastAccess;
		var newsocketio = new sessionsave();
		newsocketio.SocketnameSave(role+'-socket.js', user.lastaccess);
		res.render(role, {
					locals: {
						user: user,
						main_menu: main_menu,
						action: '1',
						edit: 'нет'
					}
				});
	}
  },

  
  menu: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else if(req.params.menu === 'users'){
		UsersController.controllerRouting('main', req, res, role, main_menu);
	} 
	else if(req.params.menu === 'rdata'){
		RDataController.controllerRouting('main', req, res, role, main_menu);
	} 
	else if(req.params.menu === 'sys'){
		SysController.controllerRouting('main', req, res, role, main_menu);
	}
	else res.render(errselect);
  },
  
  edit: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else if(req.params.menu === 'users' && req.params.form === 'user'){
		UsersController.controllerRouting('edit', req, res, role, main_menu);
	} 
	else if(req.params.menu === 'rdata' && req.params.form === 'prod'){
		RDataController.controllerRouting('edit', req, res, role, main_menu);
	} else res.render(errselect);		
  },
  
};
