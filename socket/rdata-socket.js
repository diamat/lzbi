var my_sys = require('../lib/my_sys');
var sanitize = require('validator').sanitize;
var redis = require('redis');
var RData = require('../models/rdata');

exports.SocketAction = function (socket, client) {

		socket.on('new_prod', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value){
				var RDataSQL = new RData();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}
					
				}

				socket.emit('start_save');
				RDataSQL.New_Prod(array_table, table_active);	
				
				RDataSQL.on('save_new_prod_ok', function (new_prod) {
					socket.emit('end_save', new_prod); 
				});
				
				RDataSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('update_form_save', function (name_form, id, array_table) {
			console.log('Вход1!'+array_table);
			if(array_table[0].value && array_table[1].value){
				var RDataSQL = new RData();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}
				}
				
				console.log('Вход!');
				
				socket.emit('start_save');
			
				RDataSQL.UpdateRData('products', id, array_table);	
				
				RDataSQL.on('update_ok', function () {
					socket.emit('end_save'); 
				});
				
				RDataSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});

};