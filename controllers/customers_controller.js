var CustomerSQL = require('../models/customers_main');
var sessionsave = require('../lib/sessionsave');
var erraccess = 'error/err-access.html';
var errtype = 'error/err-type.html';
var errselect = 'error/err-select.html';
var erraccessedit = 'error/err-access-edit.html';
var check = require('validator').check;
var mysys = require('../lib/my_sys');
var roleaccess = require('../config/role');

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu){
switch(action){
	case 'main': {
				var DateArray = new CustomerSQL();
				DateArray.SelectMain();
				
				DateArray.on('finished', function(forma_sob, list_customers){
					var user = req.session.user;
					user.lastaccess = req.session.lastAccess;
					var newsocketio = new sessionsave();
					newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
							
					newsocketio.on('SocketnameSave_Ok', function(){
						res.render(req.params.menu, {
							locals: {
								user: user, 
								main_menu: main_menu,
								action: req.params.menu,
								edit: 'нет',
								forma_sob: forma_sob,
								list_customers: list_customers
							}
						});
					});
				});
			};
		break;
		
	case 'id': {
			
			if(req.params.form === 'main'){
				var DateArray = new CustomerSQL();
				DateArray.SelectCustomer(req.params.id);
							
				var flag = 0;
				var UAddress = {};
				var FAddress = {};
				var Customer_date = [];
				var List_Contact;
				var List_Bank;
				var access = 0;
				
				DateArray.on('noresult', function(){
					res.render (errselect);
				});
				
				DateArray.on('finished', function(result_customer, name_select){
					flag++;
					if(name_select === 'customers_u_address') UAddress = result_customer[0];
					if(name_select === 'customers_f_address') FAddress = result_customer[0];
					if(name_select === 'SelectContact') List_Contact = result_customer;
					if(name_select === 'SelectListBank') List_Bank = result_customer; 
					if(name_select === 'SelectCustomer') {
						Customer_date = result_customer[0];
						DateArray.SelectEdit('customers_u_address','CUSTOMER_ID',req.params.id);
						DateArray.SelectEdit('customers_f_address','CUSTOMER_ID',req.params.id);
						DateArray.SelectListContact(req.params.id);
						DateArray.SelectListBank(req.params.id);
					}
					
					if(flag === 5){
							var user = req.session.user;
							user.lastaccess = req.session.lastAccess;
							var newsocketio = new sessionsave();
							newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);		
							
							Customer_date.NOTE = Customer_date.NOTE.replace(/\r\n|\r|\n/g,"<br />");
							
							var access = roleaccess.RoleAccess (role, action, req.params.menu, user.id, Customer_date.UID);
							
							newsocketio.on('SocketnameSave_Ok', function(){
								res.render(req.params.menu+'/customer', {
										locals: {
											user: user, 
											main_menu: main_menu,
											action: 'нет',
											edit: 'нет',
											access: access,
											action2: req.params.menu,
											customer: Customer_date,
											uaddress: UAddress,
											faddress: FAddress,
											listcontact: List_Contact,
											listbank: List_Bank
											}
								});
							});
					} 
				});
			}
			else res.render (errselect);
		};
		break;
		
	case 'edit': {
			if(req.params.form === 'main' || req.params.form === 'uaddress' || req.params.form === 'faddress' || req.params.form === 'contact' || req.params.form === 'bank'){
				var newsocketio = new sessionsave();
				var edit = {field: req.params.menu+'/edit/'+req.params.form+'/'+req.params.id, value: req.session.user.lastname+' '+req.session.user.name+' - '+req.session.user.position+' '+req.session.user.companyname}
				newsocketio.SocketEditFind (edit.field);
				newsocketio.on('SocketEditFind_Ok', function(nameuser, time_save){
					if(nameuser === null || nameuser == edit.value){
						newsocketio.SocketEditSave (edit.field, edit.value, mysys.DateSave());
						edit.time = ' (документ открыт для редактирования - '+time_save+')';
						var DateArray = new CustomerSQL();
						var result;
						var forma_sob = [];
						var flag = 0;
						var flag_proverk = 1;
						var name_view;
						var access = 0;
						
						
						if(req.params.form === 'main') {flag_proverk = 2; name_view = 'edit_main'; DateArray.SelectCustomer(req.params.id); DateArray.SelectFormaSob(); }
						if(req.params.form === 'uaddress') { name_view = 'edit_address'; DateArray.SelectEdit('customers_u_address','CUSTOMER_ID',req.params.id, 1);}
						if(req.params.form === 'faddress') {name_view = 'edit_address'; DateArray.SelectEdit('customers_f_address','CUSTOMER_ID',req.params.id, 1);}
						if(req.params.form === 'contact') {name_view = 'edit_contact'; DateArray.SelectEdit('customers_contact','ID',req.params.id, 1);}
						if(req.params.form === 'bank') {name_view = 'edit_bank'; DateArray.SelectEdit('customers_bank','ID',req.params.id, 1);}
						
						DateArray.on('noresult', function(){
							newsocketio.SocketEditDelete(edit.field); 
							res.render (errselect);
						});
						
						DateArray.on('finished', function(result_customer, name_select){	
							flag++;
							if(name_select === 'SelectFormaSob') forma_sob = result_customer;
							if(name_select === 'SelectCustomer') result = result_customer[0];
							if(name_select === 'customers_u_address') result = result_customer[0];
							if(name_select === 'customers_f_address') result = result_customer[0];
							if(name_select === 'customers_contact') result = result_customer[0];
							if(name_select === 'customers_bank') result = result_customer[0];
							
							if(flag === flag_proverk){
								var access = roleaccess.RoleAccess (role, action, req.params.menu, req.session.user.id, result.UID);
								if(access == 1){
										var user = req.session.user;
										user.lastaccess = req.session.lastAccess;
										newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
										var date_open = new Date();
										date_open = date_open.getTime();
										newsocketio.on('SocketnameSave_Ok', function(){
											res.render(req.params.menu+'/'+name_view, {
													locals: {
															user: user, 
															main_menu: main_menu,
															action: 'нет',
															edit: edit,
															editform: req.params.form,
															forma_sob: forma_sob,
															dateopen: date_open,
															dataedit: result
													}
												});
										});
								}
								else {
									newsocketio.SocketEditDelete(edit.field); 
									res.render (erraccess);
								}
							};
						});
					}
					else {
						res.render(erraccessedit, {
												locals: {
														user: nameuser+' (документ открыт для редактирования - '+time_save+')',
														backurl: req.session.user.role+'/'+req.params.menu+'/'+req.params.id
												}
								});
					}
				});
			} else res.render (errselect);
		};
		break;
	}
}