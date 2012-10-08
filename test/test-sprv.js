var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/spravprod');
var async = require('async');

var data = {
		no: '112',
		rs: '80702810655100185887',
		sum: '25000',
		pop: 'Платёж счета 1235',
		inn: '1251252435',
		bik: '144030653',
		date: '12403326216345'
	};
	
var bills = new Cust(client);
	
//var semen = bills.create(data);
//var semen = bills.createProd(data2);
//var semen = order.createSubOrderProd(data3);

var arr = [];
for(var i=0;i<22;i++){
	arr.push(i);
}
console.log(arr);
var id = [1,2,3,4,5,6,7,8,9,10,15,16];
var id2 = 2;
	async.series([
	function (callback){
		bills.removeRS(arr,function (err, res) {
			if(err) callback(null, err);
			else {callback(null, 'Перезалил!!');}
		});	
	}
	/*function (callback){
		semen.save (function (err, res) {
			if(err) callback(null, err);
			else {console.log(res);  callback(null, 'Сохранил!');}
		});	
	},
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
