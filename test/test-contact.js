var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/contact');
var async = require('async');

var data = {
		c_id: 1,
		fio: 'Разыграев Семён Сергеевич',
		email: 'diamat@list.ru'
	};
	
var data2 = {
		c_id: 1,
		fio: 'Диок',
		email: 'diochek@list.ru'
	};


	
var contact = new Cust(client);
	
var semen = contact.create(data);
var semen2 = contact.create(data2);


var id = 2;
var arr=[];
if(semen!= 'error' && semen2!= 'error'){
	async.series([
	/*function (callback){
		semen.save(function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			id=res.saveInRedis;
			callback(null, 'Сохранили!');
			}
		});
	},
	function (callback){
		contact.findByContactID(id,function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл!');}
		});	
	},
	function (callback){
		contact.findCustomerContacts(1, function (err, res) {
		if(err) callback(err);
		else {console.log(res);arr=res;callback(null, 'Список контактов');}
		});	
	},
	function (callback){
		contact.findContactsList(arr, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Массив контактов');}
		});	
	}
	/*
	function (callback){
		contact.findListContacts(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список всех контактов');}
		});	
	},
	
	function (callback){
		semen2.update(id, function (err, res) {
		if(err) callback(err);
		else callback(null, 'обновил!');
		});	
	},*/
	function (callback){
		contact.findByContactID(id,function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл!');}
		});	
	}/*,
	function (callback){
		contact.remove(id, function (err, res) {
		if(err) callback(err);
		else callback(null, 'удалил!');
		});	
	},
	function (callback){
		contact.findCustomerContacts(1, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список контактов');}
		});	
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
} else console.log('Ошибка создания semen');
