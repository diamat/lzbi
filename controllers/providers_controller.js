var Сustomers = require('../models/customers');
var Contact = require('../models/contact');
var UserModel = require('../models/user');
var sessionsave = require('../lib/sessionsave');
var errveiw = require('../config/error');
var customersBank = require('../models/customerbank');
var SpravProdModel = require('../models/spravprod');
var mysys = require('../lib/my_sys');
var roleaccess = require('../config/role');
var sprav = require('../lib/sprav');
var addressModel = require('../models/address');
var async = require('async');

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu, client){
switch(action){
	case 'main': {
				var сustomers = new Сustomers(client);
				сustomers.findListCustomers('1', function(err, result){
					if(err) console.log('Ошибка customers_controller - main');
					else {
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
						var spravPG = [];
						if(role === 'bigboss') spravPG = sprav.spravProdGroup;
						else spravPG = sprav.spravProdGroup[1];
						newsocketio.on('SocketnameSave_Ok', function(){
							res.render(req.params.menu, {
									user: user, 
									main_menu: main_menu,
									forma_sob: sprav.formaSob,
									action: req.params.menu,
									edit: 'нет',
									customers: result,
									spravProdGroup: spravPG
							});
						});
					}
				});
			};
		break;
		
	case 'id': {
			if(req.params.form === 'main'){
				var address = new addressModel(client);	
				var сustomers = new Сustomers(client);
				var customersbank = new customersBank(client);
				var spravprod = new SpravProdModel(client);
				var contact = new Contact(client);
				var customer;
				var uaddress;
				var faddress;
				var rslist;
				var prodlist;
				var number = 0;
				
				async.parallel([
					function(callback){
						address.findUAddress(req.params.id, function (err, res) {
							if(err) callback(null, err);
							else {uaddress = res; callback(null, 'Нашёл юридический!');}
						});	
					},
					function(callback){
						address.findFAddress(req.params.id, function (err, res) {
							if(err) callback(null, err);
							else {faddress = res; callback(null, 'Нашёл фактичсекий!');}
						});	
					},
					function(callback){
						сustomers.findByCustomerID(req.params.id, function(err, res){
							if(err) callback(err);
							else { customer = res; callback(null, 'Нашёл заказчика!');}
						});	
					},
					function(callback){
						customersbank.findByRS(req.params.id ,function(err, res){
							if(err) callback(null, err);
							else { rslist = res; callback(null, 'Нашёл заказчика!');}
						});	
					},
					function(callback){
						contact.findCustomerContacts(req.params.id ,function(err, res){
							if(err) callback(err);
							else { contactlist = res; callback(null, 'Нашёл контакты!');}
						});	
					},
					function(callback){
						spravprod.findList(function(err, res){
							if(err) callback(err);
							else {prodlist = res; callback(null, 'Нашёл список продуции!');}
						});	
					},
					function(callback){
						spravprod.findNumber(req.params.id,1,function(err, res){
							if(err) callback(err);
							else {
								if(number){number = res;
								} 
								callback(null, 'Нашёл кол-во на поддоне');
							}
						});	
					}
				],
				function(err, results){
					if(err) {console.log('Ошибка async.parallel!'); console.log(err); res.render (errveiw.errselect);}
					else {
							//if(prodlist) prodlist = mysys.sortFunct(prodlist, 'name');
							var user = req.session.user;
							user.lastaccess = req.session.lastAccess;
							var newsocketio = new sessionsave();
							newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
							var access = roleaccess.RoleAccess (role, action, req.params.menu, user.id, customer.u_id);
							customer.note = customer.note.replace(/\r\n|\r|\n/g,"<br/>");
							newsocketio.on('SocketnameSave_Ok', function(){
								res.render(req.params.menu+'/provider', {
										user: user, 
										customer: customer,
										main_menu: main_menu,
										forma_sob: sprav.formaSob,
										action: 'нет',
										action2: req.params.menu,
										edit: 'нет',
										access: access,
										rslist: rslist,
										contactlist: contactlist,
										uaddress: uaddress,
										faddress: faddress,
										prodlist: prodlist,
										number: number
								});
							});
					}
				});
			}
			else res.render (errveiw.errselect);
		};
		break;
	case 'edit': {
			if(req.params.form === 'main' || req.params.form === 'uaddress' || req.params.form === 'faddress' || req.params.form === 'contact'){
				var newsocketio = new sessionsave();
				var edit = {field: req.params.menu+'/edit/'+req.params.form+'/'+req.params.id, value: req.session.user.lastname+' '+req.session.user.name+' - '+req.session.user.position};
				newsocketio.socketEditFind (edit.field);
				
				newsocketio.on('SocketEditFind_Ok', function(nameuser, time_save){
					if(nameuser === null || nameuser === edit.value){
						newsocketio.socketEditSave(edit.field, edit.value, mysys.dateSave());
						var name_view;
						var access = 0;	
						var сustomers;
						var contact;
						var address;

						async.series([
							function(callback){
								if(req.params.form === 'main') {сustomers = new Сustomers(client); name_view = 'edit_main'; сustomers.findByCustomerID(req.params.id, callback);}
								if(req.params.form === 'contact') { contact = new Contact(client); name_view = 'edit_contact'; contact.findByContactID(req.params.id, callback);}
								if(req.params.form === 'uaddress') { address = new addressModel(client); name_view = 'edit_address'; address.findUAddress(req.params.id, callback);}
								if(req.params.form === 'faddress') { address = new addressModel(client); name_view = 'edit_address'; address.findFAddress(req.params.id, callback);}
							},
							function(callback){
								if(role === 'bigboss' && req.params.form === 'main') {var users = new UserModel(client); users.ListUserByRole('manager', callback);}
								else callback (null, null);
							},
						],
						function(err, result){
							if(err) {console.log('Ошибка async.parallel!'); console.log(err); res.render (errveiw.errselect);}
							else {
								var access = roleaccess.RoleAccess (role, action, req.params.menu, req.session.user.id, result[0].u_id);
								if(access === 1){
									var listmanager = result[1];
									if(listmanager)listmanager[listmanager.length] = {u_id: req.session.user.id, lastname: req.session.user.lastname, name: req.session.user.name}
									result = mysys.returnNull(result[0]);
									result.id = req.params.id;
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
												listmanager: listmanager,
												editform: req.params.form,
												forma_sob: sprav.formaSob,
												dateopen: date_open,
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