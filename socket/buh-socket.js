var Customers = require('../models/customers');
var customersBank = require('../models/customerbank');
var Address = require('../models/address');
var Contact = require('../models/contact');
var sanitize = require('validator').sanitize;
var bankBik = require('../models/bankbik');
var validator = require('../validator/customers-val');
var validatorBuh = require('../validator/buh-val');
var sessionsave = require('../lib/sessionsave');
var my_sys = require('../lib/my_sys');
var Bills = require('../models/bills');
var InBank = require('../models/inbank');

exports.SocketAction = function (socket, client) {
	
		socket.on('new_cid', function (inn, name, u_id) {
			var data = {};
			data.inn = inn;
			data.name = my_sys.strSanitize(name);
			data.u_id = u_id;
			data.type = '0';
			console.log(data);
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
		
		
		socket.on('update_cname', function (c_id, inn, name, u_id) {
			var data = {};
			data.inn = inn;
			data.name = my_sys.strSanitize(name);
			data.type = '0';
			data.u_id = u_id;
			validator.validForm(data, 0, function(err, result){
			if(err) socket.emit('err_save', err);
			else {
					var customer = new Customers(client);
					socket.emit('start_save');
						customer.updatecname(c_id, data.name, function (err, res) {
									if(err) socket.emit('err_save', err);
									else {
										socket.emit('end_save');
										}
							});
				}
			});
		});
		
		socket.on('accept', function (bill_id, accept) {
			bill_id = parseInt(bill_id);
			if(isNaN(bill_id) != true && (accept === 0 || accept === 1 )){
				var bill = new Bills(client);
				socket.emit('start_save');
				bill.Accept(bill_id, accept, function (err, res) {
								if(err) socket.emit('err_save', err);
								else {
									socket.emit('end_save');
									}
							});
			} else socket.emit('err_save', 'bill_id или accept не соответствуют типу');
		});
		
		socket.on('remove', function (ib_id, accept) {
			ib_id = parseInt(ib_id);
			if(isNaN(ib_id) != true){
				socket.emit('start_save');
				var inbank = new InBank(client);
				inbank.remove(ib_id,  function (err, res) {
								if(err) socket.emit('err_save', err);
								else {
									socket.emit('end_remove');
									}
							});
			} else socket.emit('err_save', 'ib_id не соответствуют типу');
		});
		
		socket.on('status', function (bill_id, status) {
			bill_id = parseInt(bill_id);
			if(isNaN(bill_id) != true && (status === 0 || status === 1 || status === 2)){
				var bill = new Bills(client);
				socket.emit('start_save');
				bill.Status (bill_id, status, function (err, res) {
								if(err) socket.emit('err_save', err);
								else {
									socket.emit('end_save');
									}
							});
			} else socket.emit('err_save', 'bill_id или status не соответствуют типу');
		});
		
		socket.on('addBill', function (arr) {
			var data = my_sys.returnObj(arr);
			validatorBuh.validForm(data, 0, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					var model = new InBank (client);
					model.addBill(data.ib_id, data.bill_id, data.sum, function (error, res) {
							if(error) socket.emit('err_save', error);
							else {
								socket.emit('end_save');
								}
						});
				}
			});
		});
		
		socket.on('delBill', function (bill_id, ib_id) {
				socket.emit('start_save');
				var model = new InBank (client);
				model.removeBill(ib_id, bill_id, function (error, res) {
						if(error) socket.emit('err_save', error);
						else {
							socket.emit('end_save');
						}
				});
		});
		
		socket.on('date_format', function (arr) {
				var date1 =  my_sys.dateNorm(arr[0].value);
				var date2 =  my_sys.dateNorm(arr[1].value)+(3600000*24)-10;
				var c_id =  parseInt(arr[2].value);
				if(isNaN(date1) || isNaN(date2)){
					socket.emit('err_NaN');
				}
				else if(date1>date2){
					socket.emit('err_date');
				}
				else socket.emit('end_format', date1, date2, c_id);
		});

};
