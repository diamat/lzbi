var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/shipment');
var async = require('async');

var data = {
		c_id: '2',
		bill_id: '5',
		prod_id: '3',
		p_id: '1',
		number_p: '10',
		date: '12403326216345',
		note:'asfg asd',
		status: '0'
	};
	
var shipment = new Cust(client);
	
var semen = shipment.create(data);
//var semen = bills.createProd(data2);
//var semen = order.createSubOrderProd(data3);


var id = [1,2,3,4,5,6,7,8,9,10,15,16];
var id2 = 2;
if(semen!= 'error'){
	async.series([
	function (callback){
		semen.save(function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Сохранил!!');}
		});	
	},
	function (callback){
		shipment.findListShipment (function (err, res) {
			if(err) callback(null, err);
			else {console.log(res);  callback(null, 'Нашёл!');}
		});	
	}/*,
	function (callback){
		bills.findInbank (id,  function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл счет!');}
		});	
	},
	function (callback){
		semen.savemain (function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Сохранил!');}
		});	
	},
	function (callback){
		bills.findListLastBills ( function (err, res) {
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
