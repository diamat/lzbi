var redis = require('redis');
var client = redis.createClient();
var Cust = require('./models/orders');
var async = require('async');

var data = {
		c_id: '13',
		name: '55 км',
		note: 'Плохой объект',
		date: '1203326216345'
	};
	
var data2 = {
		o_id: '15',
		name: '25235325 км',
		status: '0',
		note: 'Jxtym asf asf df роший объект',
		date: '1203326216345'
	};

var data3 = {
		prod_sid: '1142',
		subo_id: '1',
		addname: 'Вася',
		price: '230',
		number: '1500'
	};
	
var order = new Cust(client);
	
var semen = order.createOrder(data);
//var semen = order.createSubOrder(data2);
//var semen = order.createSubOrderProd(data3);


var id = 48;
var id2 = data3.subo_id;
var arr = [1,2,3];
if(semen!= 'error'){
	async.series([
	function (callback){
		order.findByProdID (id, function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл договор!');}
		});	
	}
	/*function (callback){
		order.findByID(id,'SubOrder','all', function (err, res) {
			if(err) callback(null, err);
			else {console.log(res); callback(null, 'Нашёл договор!');}
		});	
	}/*,
	function (callback){
		order.findList('Order', arr, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'Загрузил массив!');
			}
		});
	},
	function (callback){
		semen.save('Order', function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			id=res.lastID;
			callback(null, 'Сохранили - '+id);
			}
		});
	},
	function (callback){
		order.findByID('Order', id, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'Нашёл!');
			}
		});
	}/*,
	function (callback){
		order.remove('SubOrderProd', id,  id2, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'Удалил!' - id );
			}
		});
	},
	function (callback){
		order.findByID('SubOrderProd', id, function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			callback(null, 'Нашёл!');
			}
		});
	},
	/*function (callback){
		semen.update('SubOrderProd', 5,function (err, res) {
		if(err) callback(err);
		else {
			console.log(res);
			id=res;
			callback(null, 'Обновил- '+id);
			}
		});
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
} else console.log('Ошибка создания semen');
