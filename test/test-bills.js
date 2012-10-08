var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/bills');
var async = require('async');

var data = {
		c_id: '3',
		subo_id: '2',
		note: 'Плохой объект - хороший!',
		date: '12403326216345'
	};
	
var data2 = {
		price: '200',
		number: '1000'
	};

var data3 = {
		prod_sid: '1142',
		subo_id: '1',
		addname: 'Вася',
		price: '230',
		number: '1500'
	};
	
var bills = new Cust(client);
	
var semen = bills.createMain(data);
//var semen = bills.createProd(data2);
//var semen = order.createSubOrderProd(data3);


var id = 13;
var id2 = 2;
var arr = [1,2,3];
if(semen!= 'error'){
	async.series([
	/*function (callback){
		semen.saveprod  (id, id2, function (err, res) {
			if(err) callback(null, err);
			else {console.log(res);  callback(null, 'Сохранил!');}
		});	
	},
	function (callback){
		bills.findByProd (id, id2, function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл счет!');}
		});	
	},
	function (callback){
		semen.savemain (function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Сохранил!');}
		});	
	},*/
	function (callback){
		bills.findListOrders (function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл счет!');}
		});	
	}/*,
	function (callback){
		bills.findListBills (id2, function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл счет!');}
		});	
	}
	function (callback){
		bills.findListProd (id, id2, function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл счет!');}
		});	
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
} else console.log('Ошибка создания semen');
