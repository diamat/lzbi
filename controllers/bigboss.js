//bigboss.js
var role = 'bigboss';
var erraccess = 'error/err-access.html';
var errselect = 'error/err-select.html';
var sessionsave = require('../lib/sessionsave');
var CustomersController = require('./customers_controller');
var OrdersController = require('./orders_controller');
var BuhController = require('./buh_controller');
var ProvidersController = require('./providers_controller');
var ShipmentController = require('./shipment_controller');
var redis = require('redis');
var client = redis.createClient();
var Bills = require('../models/bills');

var main_menu = [ 
	{id:'1', name: 'Главная', url:'/'},
	{id:'customers', name: 'Клиенты', url:'/customers'},
	{id:'orders', name: 'Заказы', url:'/orders'},
	{id:'buh', name: 'Финансы', url:'/buh'}
	,{id:'shipment', name: 'Отгрузки', url:'/shipment'},
	{id:'providers', name: 'Поставщики', url:'/providers'}
	];

module.exports = {

  index: function(req, res){
	if(req.session.user.role != role) res.render(erraccess);
	else{
		var bills = new Bills(client);
		bills.findListLastBills(function(err, result){
			if(err) callback(null, 'Не нашел список счетов');
			else {
			var user = req.session.user;
			user.lastaccess = req.session.lastAccess;
			var newsocketio = new sessionsave();
			newsocketio.socketnameSave(role+'-socket.js', user.lastaccess);
			res.render(role, {
							user: user,
							main_menu: main_menu,
							billslist: result,
							action: '1',
							edit: 'нет'
					});
			}
		});
	}
  },
  
 menu:  function(req, res){
		var controllerBuff = menuController (req.params.menu);
		if(req.session.user.role != role) res.render(erraccess);
		else if(controllerBuff) controllerBuff.controllerRouting('main', req, res, role, main_menu, client);
		else res.render(errselect);
	},

  id:  function(req, res){
		var controllerBuff = menuController (req.params.menu);
		if(req.session.user.role != role) res.render(erraccess);
		else if(controllerBuff) controllerBuff.controllerRouting('id', req, res, role, main_menu, client);
		else res.render(errselect);
	},
	
	
  edit: function(req, res){
		var controllerBuff = menuController (req.params.menu);
		if(req.session.user.role != role) res.render(erraccess);
		else if(controllerBuff) controllerBuff.controllerRouting('edit', req, res, role, main_menu, client);
		else res.render(errselect);	
	},
	
  upload: function(req, res){
		if(req.session.user.role != role) res.render(erraccess);
		else if(req.params.menu === 'buh') BuhController.controllerRouting('upload', req, res, role, main_menu, client);
		else res.render(errselect);	
	},
	
  print: function(req, res){
		if(req.session.user.role != role) res.render(erraccess);
		else if(req.params.menu === 'buh') BuhController.controllerRouting('print', req, res, role, main_menu, client);
		else res.render(errselect);	
	},
	
  date: function(req, res){
		if(req.session.user.role != role) res.render(erraccess);
		else if(req.params.menu === 'buh') BuhController.controllerRouting('date', req, res, role, main_menu, client);
		else res.render(errselect);	
	}
  
  
};

function menuController (menu){
	var controllerName;
	switch(menu) {
	case 'customers': 
		controllerName = CustomersController;
		break;
	case 'orders': 
		controllerName = OrdersController;
		break;
	case 'buh': 
		controllerName = BuhController;
		break;
	case 'providers': 
		controllerName = ProvidersController;
		break;
	case 'shipment': 
		controllerName = ShipmentController;
		break;
	default:
		controllerName = null;
	}
	return (controllerName);
}
