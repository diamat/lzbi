var Orders = require('../models/orders');
var customersBank = require('../models/customerbank');
var Address = require('../models/address');
var Contact = require('../models/contact');
var sanitize = require('validator').sanitize;
var bankBik = require('../models/bankbik');
var validator = require('../validator/orders-val');
var sessionsave = require('../lib/sessionsave');
var my_sys = require('../lib/my_sys');
var Bills = require('../models/bills');

exports.SocketAction = function (socket, client) {
	
		socket.on('new', function (name_form, array_table) {
			var data = my_sys.returnObj(array_table);
			if(!data.date) data.date = my_sys.dateSave();
			else data.date = my_sys.dateNorm(data.date);
			var valid;
			var namemodel;
			var model = 'error';
			if(name_form === 'order') valid = 0;
			if(name_form === 'suborder') valid = 1;
			if(name_form === 'suborderprod') {valid = 2; data.datacreate = my_sys.dateSave();}
			validator.validForm(data, valid, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					var orders = new Orders(client);
					if(name_form === 'order') {namemodel = 'Order'; model = orders.createOrder(data);}	
					if(name_form === 'suborder') {namemodel = 'SubOrder'; model = orders.createSubOrder(data);}	
					if(name_form === 'suborderprod') {namemodel = 'SubOrderProd'; model = orders.createSubOrderProd(data);}	
					if(model != 'error'){
						model.save(namemodel, function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								socket.emit('end_save', res.saveInRedis);
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения '+namemodel);
				}
			});
		});
		
		
		socket.on('sumbill', function (array_table) {
			array_table.splice(0,2);
			var data = {};
			var sum = [];
			var allsum = 0;
			var buff = 0;
			var error = 0;
			var id = [];
			console.log(array_table);
			for(var i=0;i<(array_table.length-1)/2;i++)
			{	
				if(error === 1) break;
				data.id =  array_table[i*2].name.substr(5);
				data.price = my_sys.trim(array_table[i*2].value, ' ');
				data.number = my_sys.trim(array_table[i*2+1].value, ' ');
				if(data.price === '') data.price = '0';
				if(data.number === '') data.number = '0';
				validator.validForm(data, 3, function(err, result){
					if(err) {error = 1; socket.emit('err_bills', err);}
					else {
						buff = data.price*data.number;
						allsum = allsum + buff;
						id.push (data.id);
						sum.push(my_sys.StrToFl(buff, 2 ,' '));
					}
				});
			}
			if(error === 0) socket.emit('end_sum_bills', id, sum, my_sys.StrToFl(allsum, 2 ,' '));	
		});
		
		socket.on('savebill', function (array_table, flag) {
			var dataarr = [];
			var buff = 0;
			var errorflag = 0;
			var sum = 0;
			var gi = 5;
			if(flag) var gi = 6;
			var arr1 = array_table.splice(2,array_table.length-gi);
			var datamain = my_sys.returnObj(array_table);
			if(!datamain.date) datamain.date = my_sys.dateSave();
			else datamain.date = my_sys.dateNorm(datamain.date);
			validator.validForm(datamain, 4, function(err, result){
				if(err) socket.emit('err_save', err);
				else {	
						for(var i=0;i<(arr1.length)/2;i++)
						{	
							if(errorflag === 1) break;
							var data = {};
							data.id =  arr1[i*2].name.substr(5);
							data.price = my_sys.trim(arr1[i*2].value, ' ');
							data.number = my_sys.trim(arr1[i*2+1].value, ' ');
							if(data.price === '') data.price = '0';
							if(data.number === '') data.number = '0';
							if(data.price != '0' && data.number != '0'){
								validator.validForm(data, 3, function(error, res){
									if(error) {errorflag = 1; socket.emit('err_save', error);}
									else {
										sum = sum + (data.price*data.number);
										dataarr.push (data);
									}
								});
							}
						}
						if(errorflag === 0) {
							if(sum!=0){
								socket.emit('start_save');
								datamain.sum = my_sys.StrToFl(sum, 2,'');
								var bills = new Bills(client);
								var model = bills.createMain(datamain);
								if(model != 'error'){
								model.saveAll(dataarr, function (error, res) {
									if(error) socket.emit('err_save', error);
									else socket.emit('end_bill_save');
									});
								} else socket.emit('err_save', 'Ошибка сохранения счета');		
							} else socket.emit('err_save', 'Ошибка - сумма счета равна 0');	
						} 
				}
			});
		});
		
		socket.on('update', function (name_form, id, array_table) {
			var data = my_sys.returnObj(array_table);
			if(!data.date) data.date = my_sys.dateSave();
			else data.date = my_sys.dateNorm(data.date);
			var valid;
			var namemodel;
			var model = 'error';
			var newsocketio = new sessionsave();
			if(name_form === 'order') valid = 0; 
			if(name_form === 'suborder') valid = 1; 
			if(name_form === 'suborderprod') valid = 2; 
			validator.validForm(data, valid, function(err, result){
				if(err) socket.emit('err_save', err);
				else {
					socket.emit('start_save');
					newsocketio.socketEditDelete ('orders/edit/'+name_form+'/'+id);
				}
			});
			
			newsocketio.on('error', function(){
				socket.emit('err_save', 'error socketEditDelete');
			});
			
			newsocketio.on('SocketEditDelete_Ok', function(){
					var orders = new Orders(client);
					console.log(data);
					if(name_form === 'order') {namemodel = 'Order'; model = orders.createOrder(data);}	
					if(name_form === 'suborder') {namemodel = 'SubOrder'; model = orders.createSubOrder(data);}	
					if(name_form === 'suborderprod') {namemodel = 'SubOrderProd'; model = orders.createSubOrderProd(data);}	
					if(model != 'error'){
						model.update(id, namemodel, function (err, res) {
							if(err) socket.emit('err_save', err);
							else {
								newsocketio.socketTimeDocSave('orders/edit/'+name_form+'/'+id);
								socket.emit('end_save');
								}
						});
					} else socket.emit('err_save', 'Ошибка сохранения заказчика');
			});
		});

};
