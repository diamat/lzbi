//admin.js
var UsersController = require('./users_controller');
var role = 'admin';
var erraccess = 'error/err-access.html';
var sessionsave = require('../lib/sessionsave');

var main_menu = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'2', name: 'Сообщения', url:'/'},
	{id:'users', name: 'Пользователи', url:  '/'+role+'/users'},
	{id:'menu', name: 'Система', url:  '/'+role+'/menu'}
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
  },
  
  id: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else if(req.params.menu === 'users'){
		UsersController.controllerRouting('edit', req, res, role, main_menu);
	}			
  },
  
};
