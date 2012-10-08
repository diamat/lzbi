var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/customerbank');
var async = require('async');

var c_id = '6';
var c_id2 = '2';
var bik = '123423';
var bik2 = '645623';
var rs = '104562324323';
var rs2 = '334045624524';
var rs3 = '633972947';

	
var customerbank = new Cust(client);


async.series([
	function (callback){
		customerbank.findByRS(c_id, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'Сохранили rs!');
			}
		});
	}/*,
	function (callback){
		customerbank.add(c_id, bik, rs, function (err, res) {
		if(err) callback(err);
		else {
			console.log('Сохранил '+rs);
			callback(null, 'Сохранили rs!');
			}
		});
	},
	function (callback){
		customerbank.add(c_id2, bik2, rs2, function (err, res) {
		if(err) callback(err);
		else {
			console.log('Сохранил  '+rs2);
			callback(null, 'Сохранили rs2!');
			}
		});
	},
	function (callback){
		customerbank.findCustomer(rs, function (err, res) {
		if(err) callback(err);
		else {
			console.log('Нашёл компанию '+res);
			callback(null, 'Поиск rs2!');
			}
		});
	},
	function (callback){
		customerbank.findByBik(bik, function (err, res, res1) {
		if(err) callback(err);
		else {
			console.log('закладка');
			console.log(res);
			console.log(res1);
			callback(null, 'findByBik');
			}
		});
	},
	function (callback){
		customerbank.findByRS(c_id, function (err, res, res1) {
		if(err) callback(err);
		else {
			console.log(res);
			console.log(res1);
			callback(null, 'findByRS!');
			}
		});
	},
	function (callback){
		customerbank.remove(rs, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'удалил rs!');
			}
		});
	},
	function (callback){
		customerbank.remove(rs2, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'удалил rs2!');
			}
		});
	},
	function (callback){
		customerbank.findByRS(c_id, function (err, res, res1) {
		if(err) callback(err);
		else {
			console.log(res);
			console.log(res1);
			callback(null, 'findByRS!');
			}
		});
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
