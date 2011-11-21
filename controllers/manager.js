//manager.js
var CustomerSQL = require('../models/customers_main');
var CustomerController = require('./customers_controller');
var OrderController = require('./orders_controller');
var sessionsave = require('../lib/sessionsave');
var erraccess = 'error/err-access.html';
var errtype = 'error/err-type.html';
var errselect = 'error/err-select.html';
var customersval = require('../validator/customers-val');

var role = 'manager';
var forma_sob = [];
var list_customers = [];
var main_menu = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'2', name: 'Сообщения', url:'/'},
	{id:'orders', name: 'Заказы', url: '/'+role+'/orders'},
	{id:'customers', name: 'Контрагенты', url: '/'+role+'/customers'},
	{id:'menu', name: 'Система', url: '/'+role+'/menu'}
	];

module.exports = {

  index: function(req, res){
			if(req.session.user.role != role) res.render(erraccess);
			else{
				var user = req.session.user;
				user.lastaccess = req.session.lastAccess;
				var newsocketio = new sessionsave();
				newsocketio.SocketnameSave(role+'-socket.js', user.lastaccess);		
				newsocketio.on('SocketnameSave_Ok', function(){
					res.render(role, {
							locals: {
								user: user,
								main_menu: main_menu,
								action: '1',
								edit: 'нет'
							}
						});
				});
			}
  },
  
  menu: function(req, res){
			if(req.session.user.role != role) res.render(erraccess);
			else {
			if(req.params.menu === 'customers'){
					CustomerController.controllerRouting('main', req, res, role, main_menu);
				} else if(req.params.menu === 'orders'){
					OrderController.controllerRouting('main', req, res, role, main_menu);
				} else res.render(errselect); 	
			}
  },
  
  id: function(req, res){
			var valid = new customersval();
			
			valid.idInt(req.params.id);
			
			valid.on('valid_error', function (err) {
					res.render(errtype);
			});
			
			valid.on('valid_OK', function () {
				if(req.session.user.role != role) res.render(erraccess);
				else {
					if(req.params.menu === 'customers'){
						CustomerController.controllerRouting('id', req, res, role, main_menu);
					}
					else if(req.params.menu === 'orders'){
						OrderController.controllerRouting('id', req, res, role, main_menu);
					} else res.render(errselect);
				}
			});
  },
  
  edit: function(req, res){
			var valid = new customersval();
			
			valid.idInt(req.params.id);
			
			valid.on('valid_error', function (err) {
					res.render(errtype);
			});
			
			valid.on('valid_OK', function () {
				if(req.session.user.role != role) res.render(erraccess);
				else {
					if(req.params.menu === 'customers'){
					 CustomerController.controllerRouting('edit', req, res, role, main_menu);
					}else if(req.params.menu === 'orders'){
					 OrderController.controllerRouting('edit', req, res, role, main_menu);
					} else res.render(errselect);
				}
			});
  }
  
};
