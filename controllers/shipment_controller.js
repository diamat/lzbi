var Orders = require('../models/orders');
var Сustomers = require('../models/customers');
var Shipment = require('../models/shipment');
var Drivers = require('../models/drivers');
var UserModel = require('../models/user');
var sessionsave = require('../lib/sessionsave');
var errveiw = require('../config/error');
var customersBank = require('../models/customerbank');
var SpravProdModel = require('../models/spravprod');
var my_sys = require('../lib/my_sys');
var roleaccess = require('../config/role');
var sprav = require('../lib/sprav');
var addressModel = require('../models/address');
var Bills = require('../models/bills');
var async = require('async');

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu, client){
switch(action){
	case 'main': {
				var shipment = new Shipment(client);
				var list_plan_ship;
				
				async.parallel([
					function(callback){
						shipment.findListShipment(function (err, res) {
						if(err) {console.log(err);callback(null, 'Не нашел водитлелей');}
						else {list_plan_ship = res; callback(null, 'Нашёл водителй');}
						});	
					}
				],
				function(err, results){
					if(err) console.log('Ошибка orders_controller - main');
					else {
						console.log(list_plan_ship);
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
						newsocketio.on('SocketnameSave_Ok', function(){
							res.render(req.params.menu, {
									user: user, 
									main_menu: main_menu,
									action: req.params.menu,
									edit: 'нет',
									list_plan_ship: list_plan_ship
							});
						});
					}
				});
			};
		break;
		
	case 'id': {
			if(req.params.form === 'newship'){
				var bills = new Bills(client);
				var сustomers = new Сustomers(client);
				var list_customers;
				var u_id;
				var prod;
				var bill;
				
				async.series([
					function(callback){
						if(req.params.form === 'newship' ){
							bills.findByBillSubID(req.params.id, function (err, res) {
								if(err) {console.log(err);callback(null, 'Не нашел приложения');}
								else {bill = res; callback(null, 'Нашёл приложения');}
							});
						} else callback(null, 'Нет функций');
					},
					function(callback){
						if(req.params.form === 'newship'){
							bills.findByProd (req.params.id, req.params.id2, function (err, res) {
								if(err) callback(err);
								else {
									prod = res;
									//prod.bill.date = bill[1];
									u_id = prod.bill.order.u_id;
									console.log(u_id);
									callback(null, 'Нашёл счет!');
								}
							});
						} else callback(null, 'Нет функций');
					},
					function(callback){
						if(req.params.form === 'newship' && prod[0].prod_sid){
							сustomers.findListCustomersProd (prod[0].prod_sid, function (err, res) {
								if(err) {console.log(err);callback(null, 'Не нашел поставщиков');}
								else {list_customers = res; callback(null, 'Нашёл поставщиков');}
							});
						} else callback(null, 'Нет функций');
					},
				],
				function(err, results){
					if(err) {console.log(err); res.render (errveiw.errselect);}
					else {
							var user = req.session.user;
							user.lastaccess = req.session.lastAccess;
							var newsocketio = new sessionsave();
							newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
							var access = roleaccess.RoleAccess (role, action, req.params.menu, user.id, u_id);
							if(access!=0){
								newsocketio.on('SocketnameSave_Ok', function(){
									res.render(req.params.menu+'/'+req.params.form, {
											user: user,
											main_menu: main_menu,
											access: access,
											action: 'нет',
											edit: 'нет',
											prod: prod,
											list_customers: list_customers
									});
								});
							} else res.render (errveiw.erraccess);
					}
				});
			} else res.render (errveiw.errselect);
		};
		break;
	case 'edit': {
			if(req.params.form === 'main' || req.params.form === 'suborder' || req.params.form === 'suborderprod'){
				var newsocketio = new sessionsave();
				var edit = {field: req.params.menu+'/edit/'+req.params.form+'/'+req.params.id, value: req.session.user.lastname+' '+req.session.user.name+' - '+req.session.user.position};
				newsocketio.socketEditFind (edit.field);
				
				newsocketio.on('SocketEditFind_Ok', function(nameuser, time_save){
					if(nameuser === null || nameuser === edit.value){
						newsocketio.socketEditSave(edit.field, edit.value, my_sys.dateSave());
						var name_view;
						var access = 0;	
						var orders = new Orders(client);
						var list_customers;
						var u_id = 0;
						var prodlist;
						var billslist = [];
						var subo_id;
						
						async.series([
							function(callback){
								if(req.params.form === 'main') {name_view = 'edit_main'; orders.findByID(req.params.id,'Order','all', callback);}
								if(req.params.form === 'suborder') {name_view = 'edit_suborder'; orders.findByID(req.params.id,'SubOrder','all', callback);}
								if(req.params.form === 'suborderprod') {
								name_view = 'edit_suborderprod'; 
								orders.findByID(req.params.id,'SubOrderProd','all', function(err, res){
									if(err) callback(err);
									else {subo_id = res.subo_id; callback(null, res);}
									});
								}
							},
							function(callback){
								if(req.params.form === 'main') {
									var сustomers = new Сustomers(client);
									сustomers.findListActive(function (err, res) {
									if(err) callback(err);
									else {list_customers = res; callback(null, 'Нашёл заказчиков!');}
									});
								} else if(req.params.form === 'suborderprod'){
									var spravprod = new SpravProdModel(client);
									spravprod.findList(function(err, res){
									if(err) callback(err);
									else {prodlist = res; callback(null, 'Нашёл список продуции!');}
									});	
								} else callback(null, 'Нет функций');
							},
							function(callback){
								if(req.params.form === 'suborderprod' ){
									var bills = new Bills(client);
									bills.findListBills(subo_id ,function(err, res){
									if(err) callback(err);
									else {billslist = res; callback(null, 'Нашёл список счетов!');}
									});	
								} else callback(null, 'Нет функций');
							}
						],
						function(err, result){
							if(err) {console.log('Ошибка async.parallel!'); console.log(err); res.render (errveiw.errselect);}
							else {
								if(list_customers) list_customers = my_sys.sortFunct(list_customers, 'name');
								if(req.params.form === 'main') u_id = result[0].customer.u_id;
								if(req.params.form === 'suborder') u_id = result[0].order.customer.u_id;
								if(req.params.form === 'suborderprod') u_id = result[0].suborder.order.customer.u_id;
								var access = roleaccess.RoleAccess (role, action, req.params.menu, req.session.user.id, u_id);
								if(access === 0){
									newsocketio.socketEditDelete(edit.field); 
									res.render (errveiw.erraccess);
								} else if(billslist.length === 0 || access > 1){
									result = my_sys.returnNull(result[0]);
									result.id = req.params.id;
									if(prodlist) prodlist = my_sys.sortFunct(prodlist, 'name');
									var user = req.session.user;
									user.lastaccess = req.session.lastAccess;
									newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
									var date_open = new Date();
									date_open = date_open.getTime();
									newsocketio.on('SocketnameSave_Ok', function(){
										res.render(req.params.menu+'/'+name_view, {
												user: user, 
												main_menu: main_menu,
												action: 'нет',
												edit: edit,
												list_customers: list_customers,
												editform: req.params.form,
												status: sprav.statusSubOrder,
												dateopen: date_open,
												prodlist: prodlist,
												dataedit: result
										});
									});
								} else {
									newsocketio.socketEditDelete(edit.field); 
									res.render (errveiw.erraccess);
								}
							};
						});
					} else {
							var backurl = req.params.menu+'/view/'+req.params.form+'/'+req.params.id;
							if(req.params.form === 'uaddress' || req.params.form === 'faddress' || req.params.form === 'contact') backurl = req.params.menu;
							res.render(errveiw.erraccessedit, {
										user: nameuser+' (документ открыт для редактирования - '+time_save+')',
										backurl: backurl
								});
						}
				});
			} else res.render (errveiw.errselect);
		};
		break;
	}
		

}