var Customers = require('../models/customers');
var customersBank = require('../models/customerbank');
var Address = require('../models/address');
var Contact = require('../models/contact');
var sanitize = require('validator').sanitize;
var bankBik = require('../models/bankbik');
var validator = require('../validator/customers-val');
var sessionsave = require('../lib/sessionsave');
var my_sys = require('../lib/my_sys');

exports.SocketAction = function (socket, client) {
	
		socket.on('new_customer', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			data.u_id = socket.userid;
			data.type = '0';
			validator.validForm(data, 0, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					var customer = new Customers(client);
					var model = customer.create(data);	
					if(model != 'error'){
						model.save(function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								socket.emit('end_save', res.saveInRedis);
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения заказчика');
				}
			});
		});
			
	
		/*socket.on('find_bik', function (bik) {
			var bankbik = new bankBik(client);
			
			bankbik.findByBankBik(bik, function(err, res){
				if(err) socket.emit('bankbik', ''+err);
				else socket.emit('bankbik', res.name+'; к/с:'+res.ks); 
			});

		});*/
		
		socket.on('new_bik_save', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			validator.validForm(data, 1, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					var bankbik = new bankBik(client);
					bankbik.findByBankBik(data.bik, function(err, res){
						if(err) socket.emit('err_save', ''+err);
						else {
							socket.emit('start_save');
							var customerbank = new customersBank(client);
							customerbank.add(data.c_id, data.bik, data.rs, function (error, result) {
								if(error) socket.emit('err_save', ''+error);
								else socket.emit('end_save', result); 
							});
						}
					});
				}
			});

		});
		
		socket.on('new_contact_save', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			validator.validForm(data, 2, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					var contact = new Contact(client);
					var model = contact.create(data);
					if(model != 'error'){
						model.save(function (error, res) {
							if(error) socket.emit('err_save', ''+error);
							else {
							socket.emit('end_save', res.saveInRedis);
							}
						});
					} else socket.emit('err_save', 'Ошибка сохранения контакта');
				}
			});
		
		});
		
		socket.on('new_address_save', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			validator.validForm(data, 3, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					var address = new Address(client);
					var model = address.create(data);
					var flag = 'f';
					if(name_form === 'save_u_address_form') flag = 'u';
					if(model != 'error'){
						model.save(data.c_id, flag, function (error, res) {
							if(error) socket.emit('err_save', ''+error);
							else {
							socket.emit('end_save', res.saveInRedis);
							}
						});
					} else socket.emit('err_save', 'Ошибка сохранения адресса');
				}
			});
		
		});
		
		socket.on('update_main_customer', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			var newsocketio = new sessionsave();
			data.type = '0';
			validator.validForm(data, 0, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					newsocketio.socketEditDelete ('customers/edit/main/'+id);
				}
			});
			
			newsocketio.on('error', function(){
				socket.emit('err_save', 'error socketEditDelete');
			});
			
			newsocketio.on('SocketEditDelete_Ok', function(){
					var customer = new Customers(client);
					var model = customer.create(data);	
					if(model != 'error'){
						model.update(id, function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								newsocketio.socketTimeDocSave('customers/edit/main/'+id);
								socket.emit('end_save');
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения заказчика');
			});
		});
		
		socket.on('update_contact', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			var newsocketio = new sessionsave();
	
			validator.validForm(data, 2, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					newsocketio.socketEditDelete ('customers/edit/contact/'+id);
				}
			});
			
			newsocketio.on('error', function(){
				socket.emit('err_save', 'error socketEditDelete');
			});
			
			newsocketio.on('SocketEditDelete_Ok', function(){
					var contact = new Contact(client);
					var model = contact.create(data);	
					if(model != 'error'){
						model.update(id, function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								newsocketio.socketTimeDocSave('customers/edit/contact/'+id);
								socket.emit('end_save');
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения контакта');
			});
		});
		
		socket.on('update_address', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			var newsocketio = new sessionsave();
			var flag = 'f';
			var addressFlag = 'faddress';
			if(name_form === 'save_u_address_form') {flag = 'u'; address = 'uaddress';}
			
			validator.validForm(data, 3, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					newsocketio.socketEditDelete ('customers/edit/'+addressFlag+'/'+id);
				}
			});
			
			newsocketio.on('error', function(){
				socket.emit('err_save', 'error socketEditDelete');
			});
			
			newsocketio.on('SocketEditDelete_Ok', function(){
					var address = new Address(client);
					var model = address.create(data);	
					if(model != 'error'){
						model.update(id, flag, function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								newsocketio.socketTimeDocSave('customers/edit/'+addressFlag+'/'+id);
								socket.emit('end_save');
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения адреса');
			});
		});
		

};
