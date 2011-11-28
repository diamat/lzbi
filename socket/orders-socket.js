var orderssql = require('../models/orders_main');
var sanitize = require('validator').sanitize;
var ordersval = require('../validator/orders-val');
var sessionsave = require('../lib/sessionsave');
var my_sys = require('../lib/my_sys');


exports.SocketAction = function (socket, client) {

		socket.on('new_order', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value){
				var OrdersSQL = new orderssql();
				var valid = new ordersval();
				var table_active = [];
				if(array_table[3].value === "") array_table[3].value = my_sys.DateNorm();
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}	
				}
				
				valid.Orders(array_table, table_active);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					OrdersSQL.New_Order(array_table, table_active);	
				});
				
				OrdersSQL.on('save_new_order_ok', function (new_order) {
					socket.emit('end_save', new_order); 
				});
				
				OrdersSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('new_suborder', function (name_form, id, array_table) {
			if(array_table[0].value){
				var OrdersSQL = new orderssql();
				var valid = new ordersval();
				var table_active = [];
				if(array_table[1].value === "") array_table[1].value = my_sys.DateNorm();
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}	
				}
				
				valid.empty();
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					OrdersSQL.New_SubOrder(array_table, table_active);	
				});
				
				OrdersSQL.on('save_new_suborder_ok', function (new_suborder) {
					socket.emit('end_save', new_suborder); 
				});
				
				OrdersSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('update_form_save', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value){
				var OrdersSQL = new orderssql();
				var valid = new ordersval();
				var newsocketio = new sessionsave();
				var table_active = [];
				if(array_table[1].value === "" && name_form === "suborder_main") array_table[1].value = my_sys.DateNorm();
				if(name_form === "order_main") if(array_table[3].value === "") array_table[3].value = my_sys.DateNorm();
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}
					
				}
				
				var nameedit;
				
				if(name_form === "order_main") {nameedit = 'main'; valid.Orders(array_table, table_active);}
				if(name_form === "suborder_main") {nameedit = 'suborder'; valid.empty();}
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					newsocketio.SocketEditDelete ('orders/edit/'+nameedit+'/'+id);
				});
				
				newsocketio.on('SocketEditDelete_Ok', function(){
					var table_name;
					console.log(array_table);
					if(name_form === 'order_main') table_name = 'orders'; 
					if(name_form === 'suborder_main') table_name = 'suborders'; 
					OrdersSQL.UpdateMainOrder(table_name, id, array_table);	
				});
				
				OrdersSQL.on('update_ok', function () {
					newsocketio.SocketTimeDocSave ('orders/edit/'+nameedit+'/'+id);
					socket.emit('end_save'); 
				});
				
				OrdersSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});

};