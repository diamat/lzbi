var customersql = require('../models/customers_main');
var sanitize = require('validator').sanitize;
var customersval = require('../validator/customers-val');
var sessionsave = require('../lib/sessionsave');
var my_sys = require('../lib/my_sys');

exports.SocketAction = function (socket, client) {

		socket.on('new_customer', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value && array_table[2].value){
				var CustomerSQL = new customersql();
				var valid = new customersval();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}
					
				}
				
				valid.CustomersU(array_table, table_active);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					array_table[array_table.length] = {name: "MANAGER", value: socket.userid};
					table_active[array_table.length-1] = 1;
					CustomerSQL.New_Customer(array_table, table_active);	
				});
				
				CustomerSQL.on('save_new_customer_ok', function (new_customer) {
					socket.emit('end_save', new_customer); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
			
	
		socket.on('find_bik', function (bik) {
			var valid = new customersval();
			var CustomerSQL = new customersql();
			var array_val = [];
			array_val[0] = {value: bik};
			array_val[1] = {value: '11111111111111111111'}; 
			valid.CustomersBik(array_val);
			
			valid.on('valid_error', function (err) {
				socket.emit('bankbik','Ошибка валидации БИК!'); 
			});
			
			valid.on('valid_OK', function () {
				CustomerSQL.findbankbik(bik, 0);
			});
			
			CustomerSQL.on('error', function (msg) {
				socket.emit('bankbik',msg); 
			});
			
			CustomerSQL.on('findbankbik_ok', function (res) {
				socket.emit('bankbik', res.name+'; к/с:'+res.ks); 
			});
		});
		
		
		socket.on('update_main_customer', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value && array_table[2].value){
				var CustomerSQL = new customersql();
				var valid = new customersval();
				var newsocketio = new sessionsave();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {
					table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();
					}
					
				}
				
				valid.CustomersU(array_table, table_active);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					newsocketio.SocketEditDelete ('customers/edit/main/'+id);
				});
				
				newsocketio.on('SocketEditDelete_Ok', function(){
					CustomerSQL.UpdateMainCustomer('customers_u',id, array_table);	
				});
				
				CustomerSQL.on('update_ok', function () {
					newsocketio.SocketTimeDocSave('customers/edit/main/'+id);
					socket.emit('end_save'); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
			
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('new_form_save', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value && array_table[2].value && array_table[3].value){
				var CustomerSQL = new customersql();
				var valid = new customersval();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode(); array_table[i].value = sanitize(array_table[i].value).xss();}
				}
				
				valid.CustomersUAddress(array_table);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					socket.emit('start_save');
					if(name_form === 'save_u_address_form') var table_name = 'customers_u_address';
					else var table_name = 'customers_f_address';
					CustomerSQL.New_Address(table_name, array_table, table_active);
				});
				
				CustomerSQL.on('save_new_customers_u_address_ok', function () {
					socket.emit('end_save'); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
				
				
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('new_contact_save', function (name_form, id, array_table) {
			if(array_table[0].value){
				var CustomerSQL = new customersql();
				var table_active = [];
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode();array_table[i].value = sanitize(array_table[i].value).xss();}
				}
				
				socket.emit('start_save');
				var table_name = 'customers_contact';
				CustomerSQL.New_Contact(table_name, array_table, table_active);
				
				CustomerSQL.on('save_new_customers_contact_ok', function (id_new_contact) {
					socket.emit('end_save', id_new_contact[0].ID); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
				
				
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('new_bik_save', function (name_form, id, array_table) {
			if(array_table[0].value && array_table[1].value){
				var CustomerSQL = new customersql();
				var valid = new customersval();
				var table_active = [];
				var bankdata;
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode();array_table[i].value = sanitize(array_table[i].value).xss();}
				}
				valid.CustomersBik(array_table);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					CustomerSQL.findbankbik(array_table[0].value, 0); 
				});
				
				CustomerSQL.on('findbankbik_ok', function (res) {
					socket.emit('start_save');
					var table_name = 'customers_bank';
					bankdata = res;
					CustomerSQL.New_BankBik(table_name, array_table, table_active);
				});
				
				CustomerSQL.on('save_new_customers_bank_ok', function (id_new_contact) {
					id_new_contact[0].bankname = bankdata.name;
					id_new_contact[0].ks = bankdata.ks;
					socket.emit('end_save', id_new_contact[0]); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});

			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});
		
		socket.on('update_form_save', function (name_form, id, array_table) {
			if(array_table[0].value){
				var CustomerSQL = new customersql();
				var valid = new customersval();
				var newsocketio = new sessionsave();
				var table_active = [];
				var docname;
				for(var i=0;i<array_table.length;i++){
					if(!array_table[i].value) table_active[i] = 0;
					else {table_active[i] = 1; array_table[i].value = my_sys.addslashes(array_table[i].value); array_table[i].value = sanitize(array_table[i].value).entityEncode();array_table[i].value = sanitize(array_table[i].value).xss();}
				}
				
				if(name_form === 'customers_contact_form') valid.empty();
				if(name_form === 'customers_bank_form') valid.CustomersBik(array_table);
				if(name_form === 'save_u_address_form'||name_form === 'save_f_address_form') valid.CustomersUAddress(array_table);
				
				valid.on('valid_error', function (err) {
					socket.emit('err_save', err);
				});
				
				valid.on('valid_OK', function () {
					if(name_form === 'save_u_address_form') docname = 'customers/edit/uaddress/'+array_table[array_table.length-1].value;
					if(name_form === 'save_f_address_form')  docname = 'customers/edit/faddress/'+array_table[array_table.length-1].value;
					if(name_form === 'customers_contact_form')  docname = 'customers/edit/contact/'+id;
					if(name_form === 'customers_bank_form')  CustomerSQL.findbankbik(array_table[0].value, 0); 
					else {socket.emit('start_save');newsocketio.SocketEditDelete(docname);}
				});
				
				CustomerSQL.on('findbankbik_ok', function () {
					CustomerSQL.Select_Bank('customers_bank', array_table);
				});
				
				CustomerSQL.on('select_bank', function (res) {
					newsocketio.SocketEditDelete('customers/edit/bank/'+id);
				});
				
				newsocketio.on('SocketEditDelete_Ok', function(){
					var table_name;
					if(name_form === 'save_u_address_form') table_name = 'customers_u_address'; 
					if(name_form === 'save_f_address_form') table_name = 'customers_f_address'; 
					if(name_form === 'customers_contact_form') table_name = 'customers_contact'; 
					if(name_form === 'customers_bank_form') table_name = 'customers_bank'; 
					CustomerSQL.UpdateMainCustomer(table_name, id, array_table);
				});
				
				CustomerSQL.on('update_ok', function () {
					newsocketio.SocketTimeDocSave(docname);
					socket.emit('end_save'); 
				});
				
				CustomerSQL.on('error', function (err) {
					socket.emit('err_save', err);
				});
				
				
			}
			else socket.emit('err_save','Не указанны обязательные поля!');
		});

};
