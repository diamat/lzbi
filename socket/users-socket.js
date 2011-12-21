var my_sys = require('../lib/my_sys');
var redis = require('redis');
var UserModel = require('../models/user');

exports.SocketAction = function (socket, client) {

		socket.on('new_user', function (array_table) {
			var user = new UserModel(client);
			socket.emit('start_save');
			var time1 = new Date();
			var time2 = my_sys.DateSave();
			var salt = my_sys.getHash(time1.toString(), time2).substring(0,10);;
			var semen = user.create(array_table[5].value, array_table[1].value, array_table[0].value, salt, array_table[6].value, array_table[4].value, array_table[2].value, array_table[3].value);	
			semen.save(function (err, res) {
				if(err) {
						socket.emit('err_save', ''+err);
					}
				else {
						semen.findByUserName(array_table[5].value, function (err, res, callback) {
							if(err) socket.emit('err_save', ''+err);
							else socket.emit('end_save',res);
						});
					}
			});
			
			semen.on ('error', function(error){
				socket.emit('err_save', ''+error);
			});
			
		});
		
		socket.on('update_user', function (array_table) {
			var user = new UserModel(client);
			socket.emit('start_save');
			var time1 = new Date();
			var time2 = my_sys.DateSave();
			var salt = my_sys.getHash(time1.toString(), time2).substring(0,10);;
			var semen = user.create(array_table[5].value, array_table[1].value, array_table[0].value, salt, array_table[6].value, array_table[4].value, array_table[2].value, array_table[3].value);	
			semen.update(array_table[5].value ,function (err, res) {
				if(err) {
					 socket.emit('err_save', err);
					}
				else {
						semen.findByUserName(array_table[5].value, function (err, res, callback) {
							if(err) socket.emit('err_save', ''+err);
							else socket.emit('end_save');
						});
					}
			});
			
			semen.on ('error', function(error){
				socket.emit('err_save', ''+error);
			});
		});

};