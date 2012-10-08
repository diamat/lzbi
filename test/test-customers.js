var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/customers');
var async = require('async');

var data = {
		u_id: '3',
		forma_sob: 'ООО',
		name: 'Друг',
		okpo: '2334',
		inn: '123403326216',
		type: '1'
	};

	
var customer = new Cust(client);
	
var semen = customer.create(data);


var id = 10;
if(semen!= 'error'){
	async.series([
		function (callback){
			customer.findUID(id,function (err, res) {
			if(err) callback(err);
			else {console.log(res);callback(null, 'Список!');}
			});
		}/*,
	function (callback){
		semen.save(function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			id=res.saveInRedis;
			callback(null, 'Сохранили!');
			}
		});
	}/*,
	function (callback){
		semen.findCustomersActive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список активных!');}
		});	
	},
	function (callback){
		semen.findCustomersArchive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список архивных!');}
		});	
	},
	function (callback){
		semen.addArchvive(id, function (err, res) {
		if(err) callback(err);
		else callback(null, 'добавить в архив!');
		});	
	},
	function (callback){
		semen.findCustomersActive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список активных!');}
		});	
	},
	function (callback){
		semen.findCustomersArchive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список архивных!');}
		});	
	},
	function (callback){
		semen.addActive(id, function (err, res) {
		if(err) callback(err);
		else callback(null, 'добавить в актив!');
		});	
	},
	function (callback){
		semen.findCustomersActive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список активных!');}
		});	
	},
	function (callback){
		semen.findCustomersArchive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список архивных!');}
		});
	},
	function (callback){
		customer.remove('Модель существует!',function (err, res) {
		if(err) callback(err);
		else callback(null, 'удалил!');
		});	
	}/*,
	function (callback){
		semen.findCustomersActive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список активных!');}
		});	
	},
	function (callback){
		semen.findCustomersArchive(function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список архивных!');}
		});
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
} else console.log('Ошибка создания semen');
