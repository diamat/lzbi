var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/drivers');
var async = require('async');

var data = {
		c_id: 1,
		fio: 'Разыграев Семён Сергеевич',
		series: '4091',
		number: '409134',
		distribut: '29 а/м фыв 234 234 234 ', 
		datedistribut: '1983598213756972135',
		phones: '9213847948'
	};
	
var data2 = {
		fio: 'Диок',
		series: '4091',
		number: '609334',
		distribut: 'ывпыеп 25235 ваы пвп ва вапжфыпежофедод мдбытрва.ю ыпюльючясбьыявдлапб унюлвюапб ыюваждлваозфцуекапрд', 
		datedistribut: '195656359821372135'
	};


	
var contact = new Cust(client);
	
var semen = contact.create(data);
var semen2 = contact.create(data2);


var id = 3;
var arr=[3,4,5];
if(semen!= 'error' && semen2!= 'error'){
	async.series([
	function (callback){
		semen2.save(function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			id=res.saveInRedis;
			callback(null, 'Сохранили!');
			}
		});
	},
	function (callback){
		contact.findByDriverID(id,function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'нашёл!');}
		});	
	},
	function (callback){
		contact.findCustomerDriver(1, function (err, res) {
		if(err) callback(err);
		else {console.log(res);callback(null, 'Список контактов');}
		});	
	},
	function (callback){
		contact.findDriversList(arr, function (err, res) {
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
	},
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
