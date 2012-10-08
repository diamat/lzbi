var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/address');
var async = require('async');

var data = {
		c_id: '1',
		index: 12432,
		city: 'Спб',
		street: 'Кузнецовская',
		house: '48'
	};
	
var data2 = {
		c_id: '2',
		index: 3432,
		city: 'Морковия',
		street: 'Свеаборгская',
		house: '48'
	};


	
var contact = new Cust(client);
	
var semen = contact.create(data);
var semen2 = contact.create(data2);


var с_id = 38;
var arr=[];
if(semen!= 'error' && semen2!= 'error'){
	async.series([
	function (callback){
		semen.save(с_id, 'u',function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			callback(null, 'Сохранили Юр!');
			}
		});
	},
	function (callback){
		semen2.save(с_id, 'f', function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			callback(null, 'Сохранили Факт!');
			}
		});
	},
	function (callback){
		contact.findUAddress(с_id, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл Ю!');}
		});	
	},
	function (callback){
		contact.findFAddress(с_id, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл Ф!');}
		});	
	},
	function (callback){
		semen2.update(с_id, 'u',function (err, res) {
		if(err) callback(err);
		else {callback(null, 'Обновил Ю');}
		});	
	},
	function (callback){
		contact.findUAddress(с_id, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл Ю!');}
		});	
	},
	function (callback){
		contact.remove(с_id, 'u', function (err, res) {
		if(err) callback(err);
		else callback(null, 'удалил!');
		});	
	},
	function (callback){
		contact.findUAddress(с_id, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл Ю!');}
		});	
	}
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
} else console.log('Ошибка создания semen');
