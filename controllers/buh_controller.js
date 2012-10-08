var Orders = require('../models/orders');
var Сustomers = require('../models/customers');
var UserModel = require('../models/user');
var sessionsave = require('../lib/sessionsave');
var errveiw = require('../config/error');
var customersBank = require('../models/customerbank');
var SpravProdModel = require('../models/spravprod');
var my_sys = require('../lib/my_sys');
var roleaccess = require('../config/role');
var sprav = require('../lib/sprav');
var Bills = require('../models/bills');
var InBank = require('../models/inbank');
var async = require('async');
var fs = require("fs");
var sys = require("sys");
var Iconv  = require('iconv').Iconv;
var addressModel = require('../models/address');

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu, client){
switch(action){
	case 'main': {
				var bills = new Bills(client);
				var inbank = new InBank(client);
				var сustomers = new Сustomers(client);
				var billslist;
				var inbank_list;
				var list_customers;
				async.parallel([
					function(callback){
						bills.findListLastBills(function(err, result){
							if(err) callback(null, 'Не нашел список счетов');
							else {billslist = result; callback(null, 'Нашёл список счетов!');}
						});	
					},
					function(callback){
						inbank.findListNewOrders(function(err, result){
							if(err) {callback(null, 'Не нашел список п/п');}
							else {inbank_list = result; callback(null, 'Нашёл список п/п!');}
						});	
					},
					function(callback){
						if(role === 'bigboss' || role === 'buhmanager') {
							сustomers.findListCustomers('0',function (err, res) {
							if(err) callback(null, 'Не нашел заказчиков!');
							else {list_customers = res; callback(null, 'Нашёл заказчиков!');}
							})	
						} else {
							сustomers.findListByUID(req.session.user.id, function (err, res) {
							if(err) callback(null, 'Не нашел заказчиков!');
							else {list_customers = res; callback(null, 'Нашёл заказчиков!');}
							})	
							
						}
					}
				],
				function(err, results){
					if(err) console.log('Ошибка buh_controller - main');
					else {
						if(list_customers) list_customers = my_sys.sortFunct(list_customers, 'formatname');
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
						var access = roleaccess.RoleAccess (role, action, req.params.menu, 0, 0);
						newsocketio.on('SocketnameSave_Ok', function(){
							res.render(req.params.menu, {
									user: user, 
									main_menu: main_menu,
									action: req.params.menu,
									edit: 'нет',
									access: access,
									billslist: billslist,
									inbank_list: inbank_list,
									list_customers: list_customers
							});
						});
					}
				});
			};
		break;
	case 'date': {
			if(req.params.form === 'inbank' || req.params.form === 'bill'){
				var bills = new Bills(client);
				var inbank = new InBank(client);
				var сustomers = new Сustomers(client);
				var inbank_list = [];
				var billslist = [];
				var customer = {c_id: '0'};
				var date1 =	my_sys.formatDate(req.params.date1);
				var date2 =	my_sys.formatDate(req.params.date2);
				async.parallel([
					function(callback){
						if(req.params.form === 'inbank'){
							inbank.findByDate(req.params.date1, req.params.date2, function(err, result){
								if(err) {callback(null, 'Не нашел список п/п');}
								else {inbank_list = result; callback(null, 'Нашёл список п/п!');}
							});	
						} else
						{
							bills.findByDate(req.params.date1, req.params.date2, function(err, result){
								if(err) {callback(null, 'Не нашел список п/п');}
								else {billslist = result; callback(null, 'Нашёл список п/п!');}
							});	
						}
					},
					function(callback){
						сustomers.findByCustomerID(req.params.id, function(err, result){
								if(err) {callback(null, 'Не нашел список п/п');}
								else {customer = result; callback(null, 'Нашёл список п/п!');}
							});	
					}
				],
				function(err, results){
					if(err) console.log('Ошибка buh_controller - main');
					else {
						console.log(billslist);
						var user = req.session.user;
						user.lastaccess = req.session.lastAccess;
						var newsocketio = new sessionsave();
						newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
						var access = roleaccess.RoleAccess (role, action, req.params.menu, 0, 0);
						newsocketio.on('SocketnameSave_Ok', function(){
							res.render(req.params.menu+'/date', {
									user: user, 
									main_menu: main_menu,
									action: 'нет',
									edit: 'нет',
									access: access,
									billslist: billslist,
									inbank_list: inbank_list,
									date1: date1,
									date2: date2,
									customer: customer
							});
						});
					}
				});
			} else res.render (errveiw.erraccess);
			};
		break;
	case 'upload': {
		if(req.session.user.role === 'bigboss'){
		checkFile(req.files.userfile.path, function (error, result, res2) {
			if(error) res.render(errveiw.errupload, {msg: error});
			else{
				var in_bank = [];
				fs.readFile(req.files.userfile.path, function (err, data) {
				if (err) console.log('Ошибка чтения файла!');
				else {
						var conv = new Iconv('windows-1251', 'utf-8');
						data = conv.convert(data).toString();
						data1 = data.split('\r\n');
						var n = 39;
						var start = 20;
						for(var i=20;i<data1.length;i++)
						if(data1[i].substr(0)==='ПолучательИНН='+result){
							if(data1[i-1].substr(0,13)!=='ДатаПоступило') {
								if(data1[i-8].substr(14)!='000000000000' && data1[i-8].substr(14)){
									var buff = {};
									buff.in_rs = data1[i+2].substr(19);
									buff.no = data1[i-15].substr(6);
									buff.date= my_sys.dateNorm(res2);
									buff.formatdate = res2;
									buff.sum = data1[i-13].substr(6);
									buff.inn = data1[i-8].substr(14);
									buff.name = my_sys.replaceQM(data1[i-7].substr(12));
									buff.formatname = my_sys.strSanitize(data1[i-7].substr(12));
									buff.rs = data1[i-6].substr(19);
									buff.bik = data1[i-3].substr(14);
									buff.pop = my_sys.strSanitize(data1[i+10].substr(18));
									in_bank.push(buff);
								}
							} else{
								var g = i-1;
								if(data1[g-8].substr(14)!='000000000000' && data1[g-8].substr(14)){
									var buff = {};
									buff.in_rs = data1[g+3].substr(19);
									buff.no = data1[g-15].substr(6);
									buff.date= my_sys.dateNorm(data1[g].substr(14));
									buff.formatdate = data1[g].substr(14);
									buff.sum = data1[g-13].substr(6);
									buff.inn = data1[g-8].substr(14);
									buff.name = my_sys.replaceQM(data1[g-7].substr(12));
									buff.formatname = my_sys.strSanitize(data1[g-7].substr(12));
									buff.rs = data1[g-6].substr(19);
									buff.bik = data1[g-3].substr(14);
									buff.pop = my_sys.strSanitize(data1[g+11].substr(18));
									in_bank.push(buff);
								}
							}
						};
					var inbank = new InBank(client);
					var arg = [];
					async.forEach(in_bank, function(pp, callback){
						var model = inbank.create(pp);
						if(model)
						model.save (function (err, result2) {
							if(err) pp.status = err;
							else { 
							pp.status = 'П/п успешно сохранено в БД';
							pp.c_id = result2.findCID[0];
							pp.ib_id = result2.lastID;
							pp.c_name = result2.findCID[1];
							pp.u_id = result2.findCID[2];
							}
							if(pp.status!='error1') arg.push(pp);
							callback();
						});	
					}, function(err){
							if (err) console.log('Ошибка загрузки счета - '+err);
							else  {
								var user = req.session.user;
								user.lastaccess = req.session.lastAccess;
								var newsocketio = new sessionsave();
								newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
								newsocketio.on('SocketnameSave_Ok', function(){
									res.render(req.params.menu+'/upload', {
											user: user, 
											main_menu: main_menu,
											action: 'нет',
											edit: 'нет',
											in_bank: arg
									});
								});
							}
					});
				} 
				});
			}
		});
		} else res.render (errveiw.erraccess);
		}
		break;
	
	case 'id': {
			if(req.params.form === 'inbank' || req.params.form === 'bill'){
				var bills = new Bills(client);
				var inbankmodel = new InBank(client);
				var bill;
				var listprod;
				var listbill;
				var inbank;
				var nameview;
				var u_id;	
				var	billslist;	
				var	bills_sum;						
				async.series([
					function(callback){
						if(req.params.form === 'inbank'){
							nameview = 'inbank';
							inbankmodel.findInbank (req.params.id,  function (err, res) {
								if(err) callback(err);
								else {u_id = res.customer.u_id; inbank = res; callback(null, 'Нашёл п/п!');}
							});	
						} else if(req.params.form === 'bill'){
							nameview = 'bill';
							bills.findByBillID (req.params.id,  function (err, res) {
								if(err) callback(err);
								else {bill = res; u_id = res.order.u_id;  callback(null, 'Нашёл счет!');}
							});	
						} else  callback(null, 'Нет функции!');
					},
					function(callback){
						if(req.params.form === 'bill' && bill.order.subo_id){
							bills.findListProd (req.params.id, bill.order.subo_id, function (err, res) {
								if(err) callback(err);
								else {listprod = res; callback(null, 'Нашёл счет!');}
							});	
						} else if(req.params.form === 'inbank'){
								bills.findListBillsCID(inbank.c_id ,function(err, res){
									if(err) callback(null, 'Не нашел список счетов');
									else {billslist = res; callback(null, 'Нашёл список счетов!');}
								});		
						} else  callback(null, 'Нет функции!');
					
					},
					function(callback){
						if(req.params.form === 'inbank'){
							inbankmodel.findBillsByIbID (req.params.id,  function (err, res, res_sum) {
								if(err) callback(err);
								else {listbill = res; bills_sum = res_sum; callback(null, 'Нашёл счета!');}
							});	
						} else  callback(null, 'Нет функции!');
					}
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
									res.render(req.params.menu+'/'+nameview, {
											user: user,
											main_menu: main_menu,
											access: access,
											action: 'нет',
											edit: 'нет',
											inbank: inbank,
											bill: bill,
											listprod: listprod,
											billslist: billslist,
											bills_sum: bills_sum,
											listbill: listbill
									});
								});
							} else res.render (errveiw.erraccess);
					}
				});
			} else res.render (errveiw.errselect);
		};
		break;
		
	case 'print': {
			if(req.params.form === 'bill'){
				var bills = new Bills(client);
				var address = new addressModel(client);	
				var bill;
				var listprod;
				var nameview;
				var u_id;	
				var subo_id;
				var uaddress;				
				async.series([
					function(callback){
						if(req.params.form === 'bill'){
							nameview = 'print-bill';
							bills.findByBillID (req.params.id,  function (err, res) {
								if(err) callback(null, err);
								else {bill = res; u_id = res.order.u_id; subo_id = res.order.subo_id; callback(null, 'Нашёл счет!');}
							});	
						}
					},
					function(callback){
						if(req.params.form === 'bill' && subo_id){
							bills.findListProd (req.params.id, subo_id, function (err, res) {
								if(err) callback(null, err);
								else {listprod = res; callback(null, 'Нашёл счет!');}
							});	
						}
					
					},
					function(callback){
						if(req.params.form === 'bill' && bill.order.c_id){
							address.findUAddress(bill.order.c_id, function (err, res) {
								if(err) callback(null, 'Не нашел юридический адрес!');
								else {uaddress = res; callback(null, 'Нашёл юридический!');}
							});	
						}
					
					}
					
				],
				function(err, results){
					if(err) {console.log('Ошибка async.parallel!'); console.log(err); res.render (errselect);}
					else {
							var user = req.session.user;
							user.lastaccess = req.session.lastAccess;
							var newsocketio = new sessionsave();
							newsocketio.socketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
							var access = roleaccess.RoleAccess (role, action, req.params.menu, user.id, u_id);
							if(access!=0){
								newsocketio.on('SocketnameSave_Ok', function(){
									res.render(req.params.menu+'/'+nameview, {
											user: user,
											main_menu: main_menu,
											access: access,
											action: 'нет',
											edit: 'нет',
											inbank: inbank,
											bill: bill,
											listprod: listprod,
											uaddress: uaddress,
											mycomp: sprav.myComp[bill.id_comp]
									});
								});
							} else res.render (errveiw.erraccess);
					}
				});
			} else res.render (errveiw.errselect);
		};
		break;/*
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
									if(err) callback(null, 'Не нашел список продуции');
									else {subo_id = res.subo_id; callback(null, res);}
									});
								}
							},
							function(callback){
								if(req.params.form === 'main') {
									var сustomers = new Сustomers(client);
									сustomers.findListActive(function (err, res) {
									if(err) callback(null, 'Не нашел заказчиков!');
									else {list_customers = res; callback(null, 'Нашёл заказчиков!');}
									});
								} else if(req.params.form === 'suborderprod'){
									var spravprod = new SpravProdModel(client);
									spravprod.findList(function(err, res){
									if(err) callback(null, 'Не нашел список продуции');
									else {prodlist = res; callback(null, 'Нашёл список продуции!');}
									});	
								} else callback(null, 'Нет функций');
							},
							function(callback){
								if(req.params.form === 'suborderprod' ){
									var bills = new Bills(client);
									bills.findListBills(subo_id ,function(err, res){
									if(err) callback(null, 'Не нашел список счетов');
									else {billslist = res; callback(null, 'Нашёл список счетов!');}
									});	
								} else callback(null, 'Нет функций');
							}
						],
						function(err, result){
							if(err) {console.log('Ошибка async.parallel!'); console.log(err); res.render (errselect);}
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
		break;*/
	}	
}

function checkFile (filename, callback){
	fs.open(filename, "r+", 0644, function(err, file_handle) {
		if (!err) {
			fs.read(file_handle, 300, null, 'ascii', function(error, data) {
						if (!error) {
							data = data.split('\r\n');
							if(data[0]!='1CClientBankExchange') callback('Файл не относится к заданному типу данных');
							else {
								var flag = 0;
								var inn;
								for(var i=0;i<sprav.myRS.length;i++)
								if(data[9].substr(9) === sprav.myRS[i].rs) {flag = 1; inn = sprav.myComp[sprav.myRS[i].c_id].inn;}
								if(flag != 1) callback('Данный файл выгрузки не относится к нашему р/с');
								else callback(null, inn, data[8].substr(10));
							}
							
						} else {
							callback('Ошибка чтения файла!');
						}
					});
		} else {
			callback('Ошибка открытия файла!');
		}
	});
}