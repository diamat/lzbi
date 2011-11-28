var OrderSQL = require('../models/orders_main');
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
				var DateArray = new OrderSQL();
				if (role === 'manager') DateArray.SelectMain(req.session.user.id, 1);
				else DateArray.SelectMain(req.session.user.id, 0);
				
				DateArray.on('finished', function(list_customers, list_orders){
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
								list_customers: list_customers,
								list_orders: list_orders
							}
						});
					});
				});
			};
		break;
		
	case 'id': {
			if(req.params.form === 'main' || req.params.form === 'suborder'){
				var DateArray = new OrderSQL();
				var cftlag = 1;
				var nameview;
				if(req.params.form === 'main' ){cftlag = 2; nameview = 'order'; DateArray.SelectListSubOrder(req.params.id); DateArray.SelectOrder(req.params.id);}
				if(req.params.form === 'suborder') {nameview = 'suborder'; DateArray.SelectSubOrder(req.params.id); }					
				var flag = 0;
				var order;
				var list_suborder;
				
				DateArray.on('noresult', function(){
					res.render (errselect);
				});
				
				
				DateArray.on('finished', function(result, name_select){
					flag++
					if(name_select === 'SelectOrder' || name_select === 'SelectSubOrder') order = result; 
					if(name_select === 'SelectListSubOrder') list_suborder = result; 
					
						if(flag == cftlag){
							var user = req.session.user;
							user.lastaccess = req.session.lastAccess;
							var newsocketio = new sessionsave();
							newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);	
							
							var access = roleaccess.RoleAccess (role, action, req.params.menu, user.id, order.UID);
							
							order.NOTE = order.NOTE.replace(/\r\n|\r|\n/g,"<br />");
								
							newsocketio.on('SocketnameSave_Ok', function(){
								res.render(req.params.menu+'/'+nameview, {
										locals: {
											user: user, 
											main_menu: main_menu,
											action: 'нет',
											edit: 'нет',
											action2: req.params.menu,
											access: access,
											order: order,
											listsuborders: list_suborder
											}
								});
							});
						} 
				});
			} else res.render (errselect);
		};
		break;
		
	case 'edit': {
			if(req.params.form === 'main' || req.params.form === 'suborder'){
				var newsocketio = new sessionsave();
				var edit = {field: req.params.menu+'/edit/'+req.params.form+'/'+req.params.id, value: req.session.user.lastname+' '+req.session.user.name+' - '+req.session.user.position+' '+req.session.user.companyname}
				newsocketio.SocketEditFind (edit.field);
				newsocketio.on('SocketEditFind_Ok', function(nameuser, time_save){
					if(nameuser === null || nameuser == edit.value){
						newsocketio.SocketEditSave (edit.field, edit.value, mysys.DateSave());
						edit.time = ' (документ открыт для редактирования - '+time_save+')';
						var DateArray = new OrderSQL();
						var name_view;
						
						if(req.params.form === 'main') {name_view = 'edit_main'; DateArray.SelectMain(req.session.user.id, 1, req.params.id);}
						if(req.params.form === 'suborder')  {name_view = 'edit_suborder'; DateArray.SelectSubOrder(req.params.id, 'edit');}
						
						
						DateArray.on('noresult', function(){
							newsocketio.SocketEditDelete(edit.field);
							res.render (errselect);
						});
						
						DateArray.on('finished', function(result1, result2){	
								var access = roleaccess.RoleAccess (role, action, req.params.menu, req.session.user.id, result2[0].UID);
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
															customers: result1,
															dateopen: date_open,
															dataedit: result2[0]
													}
												});
										});
								} else {
									newsocketio.SocketEditDelete(edit.field); 
									res.render (erraccess);
								}
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