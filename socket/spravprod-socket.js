var my_sys = require('../lib/my_sys');
var redis = require('redis');
var SpravProdModel = require('../models/spravprod');

exports.SocketAction = function (socket, client) {

		socket.on('new_prod', function (array_table) {
			var spravprod = new SpravProdModel(client);
			socket.emit('start_save');
			array_table[1].value = my_sys.strSanitize(array_table[1].value);
			array_table[2].value = my_sys.strSanitize(array_table[2].value);
			array_table[0].value = my_sys.strSanitize(array_table[0].value);
			spravprod.save(array_table[1].value,array_table[2].value, array_table[0].value, function (err, res) {
				if(err) {
						socket.emit('err_save', ''+err);
					}
				else {
						socket.emit('end_save', res.saveInRedis);
					}
			});
			/*
			semen.on ('error', function(error){
				socket.emit('err_save', ''+error);
			});*/
			
		});
		
		socket.on('update', function (prod_sid, array_table) {
			var spravprod = new SpravProdModel(client);
			socket.emit('start_save');
			array_table[1].value = my_sys.strSanitize(array_table[1].value);
			array_table[2].value = my_sys.strSanitize(array_table[2].value);
			array_table[0].value = my_sys.strSanitize(array_table[0].value);
			spravprod.update(prod_sid, array_table[1].value,array_table[2].value, array_table[0].value, function (err, res) {
				if(err) socket.emit('err_save', err);
				else socket.emit('end_save');
			});
			/*
			semen.on ('error', function(error){
				socket.emit('err_save', ''+error);
			});*/
		});

};