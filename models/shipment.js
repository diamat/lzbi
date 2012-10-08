//shipment.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var sprav = require('../lib/sprav');
var async = require('async');
var Customers = require('./customers');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * p_id - id постовщика
 * sh_id - id отгрузки
 * sh_id - id отгрузки
 * number_p - кол-во подонов.
 * prod_id - id товара в приложения;
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastSHID: <sh_id> - счетчик sh_id
 * (zset) shipment:zset:date:prod_sid:<prod_sid>:sh_id: <date> <sh_id>  - упорядоченный список отгрузок продукции из справочника, дата явялется оценкой.
 * (zset) shipment:zset:date:sh_id: <date> <sh_id>  - упорядоченный список всех отгрузок, дата явялется оценкой. 
 * (zset) shipment:zset:date:p_id:<p_id>:sh_id: <date> <sh_id>  - упорядоченный список всех отгрузок данного поставщика, дата явялется оценкой. 
 * (set) bill:<bill_id>:sh_id: <sh_id> - список отгрузок связанных с этим счетом. 
 * (set) shipment:plan:sh_id:: <sh_id> - список планируемых отгрузок. 
 *
 *
 * (hashes) shipment:<sh_id>:main: {
  *		c_id: <c_id>
 *		bill_id: <bill_id>
 *		prod_id: <prod_id>
 *		p_id: <p_id>
 *		number_p: <number_p>
 *		date: <дата отгрузки>
 *		note: <примечание>
 *		status: <статус план/факт 0/1>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * create(data) - содание модели счет;
 * save() - сохранение ранее созданой модели;
 * addBill(ib_id, bill_id, sum) - функция добавления счета
 */
 

 // Модель ShipmentModel
var ShipmentModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
ShipmentModel.prototype.create = function (data) {
	if(data.c_id ||data.bill_id ||  data.prod_id || data.p_id || data.date || data.number_p){
		var model = new ShipmentModel(this.client);
		model.c_id  = data.c_id;
		model.bill_id  = data.bill_id;
		model.prod_id = data.prod_id;
		model.p_id = data.p_id;
		model.number_p = data.number_p;
		model.date = data.date;
		model.note = data.note;
		model.status = data.status || '0';
		model.dateupdate = my_sys.dateSave();
		model.isCreate = true;
		console.log(model);
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
ShipmentModel.prototype.exportmodel = function (data, id) {
    var model = new Object;
	model.sh_id = id;
	model.c_id  = data[0];
	model.bill_id  = data[1];
	model.prod_id = data[2];
	model.p_id = data[3];
	model.number_p = data[4];
	model.date = data[5];
	model.formatdate = my_sys.formatDate(data[5]);
	model.note = data[6];
	model.status = data[7];
	model.dateupdate = data[8];
    return model;
};



// Возвращает имя ключа для global:lastSHID:
ShipmentModel.prototype.pLastID = function () {
    return 'global:lastSHID:';
};

// Возвращает имя ключа для shipment:zset:date:prod_sid:<prod_sid>:sh_id:
ShipmentModel.prototype.pDateProdSID = function (prod_sid) {
    return 'shipment:zset:date:prod_sid:'+prod_sid+':sh_id:';
};

// Возвращает имя поля для shipment:zset:date:sh_id:
ShipmentModel.prototype.pAllDate = function () {
    return 'shipment:zset:date:sh_id:';
};

// Возвращает имя поля для  shipment:plan:sh_id:
ShipmentModel.prototype.pAllPlan = function () {
    return 'shipment:plan:sh_id:';
};

// Возвращает имя поля для shipment:zset:date:p_id:<p_id>:sh_id:
ShipmentModel.prototype.pDatePID = function (p_id) {
    return 'shipment:zset:date:p_id:'+p_id+':sh_id:';
};

// Возвращает имя поля для bill:<bill_id>:sh_id:
ShipmentModel.prototype.pBillSHID = function (bill_id) {
    return 'bill:'+bill_id+':sh_id:';
};

// Возвращает имя поля для shipment:<sh_id>:main:
ShipmentModel.prototype.pMain = function (sh_id) {
    return 'shipment:'+sh_id+':main:';
};

  // Возвращает имя поля для bill_id:
ShipmentModel.prototype.kBillID = function () {
    return 'bill_id:';
}; 
		
  // Возвращает имя поля для c_id:
ShipmentModel.prototype.kCID = function () {
    return 'c_id:';
}; 
 
 // Возвращает имя поля для prod_id:
ShipmentModel.prototype.kProdID = function () {
    return 'prod_id:';
}; 

 // Возвращает имя поля для p_id:
ShipmentModel.prototype.kPID = function () {
    return 'p_id';
}; 
 
// Возвращает имя поля для date:
ShipmentModel.prototype.kDate = function () {
    return 'date:';
}; 
 
// Возвращает имя поля для number_p:
ShipmentModel.prototype.kNumber = function () {
    return 'number_p:';
}; 

// Возвращает имя поля для note:
ShipmentModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для status:
ShipmentModel.prototype.kStatus = function () {
    return 'status:';
};

// Возвращает имя поля для dateupdate:
ShipmentModel.prototype.kDataupdate = function () {
    return 'dateupdate:';
};


// инкремент 
function lastID(callback) {
	this.client.incr(this.pLastID, function(err, result) {
	if (err) {
				callback ('Ошибка инкремента!');
		} else {
				callback(null, result);
			};
	});
};

// проверка наличия модели
function isCreateTrue (callback){
	if (this.isCreate) {
			callback(null, 'Модель существует!');
	} else {
			callback('Модель должна быть создана перед сохранением!');
		}
}


//ShipmentModel.save();
ShipmentModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		lastID: [function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', 'isCreateTrue', function(callback,  results){
			saveModel.call(thism, results.lastID,  callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else {callback(null, results);}
    });
};

// Основная функция выполняющая сохранение
function saveModel(id, callback) {
	var q1 = ['srem', this.pAllPlan(), id];
	if (this.status === '0') q1 = ['sadd', this.pAllPlan(), id];
	var q = [
	['hmset', this.pMain(id), this.kCID(), this.c_id, this.kBillID(), this.bill_id, this.kProdID(), this.prod_id, this.kPID(), this.p_id, this.kNumber(), this.number_p, this.kDate(), this.date, this.kNote(), this.note, this.kStatus(), this.status, this.kDataupdate(), this.dateupdate],
	['zadd', this.pDateProdSID(this.prod_id),  this.date, id],
	['zadd', this.pAllDate(),  this.date, id],
	['zadd', this.pDatePID(this.p_id), this.date, id],
	['sadd', this.pBillSHID(this.bill_id), id],
	q1
	];
	this.client.multi(q).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, id);
			};
	});
};


// запрос к Redis и возврат результата в виде модели
function selectRedis (id, callback){
	var thism = this;
	var q = [this.pMain(id), this.kCID(),  this.kBillID(), this.kProdID(), this.kPID(), this.kNumber(), this.kDate(),  this.kNote(), this.kStatus(), this.kDataupdate(), ];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
					var result = this.exportmodel(repl, id);

					callback(null, result);

			}

	}.bind(this));
};

ShipmentModel.prototype.findListOrders = function (callback) {
	var date1 =  my_sys.dateNorm('12.11.2010');
	var date2 =  my_sys.dateNorm('01.05.2013');
	console.log(date1);
	console.log(date2);
	this.client.zrangebyscore(this.pListDate(), date1, date2, function(err, repl) {
		if(err) {console.log(err);callback(err);}
		else {
		console.log(repl);
		callback(null, repl);
		}
	});
};

ShipmentModel.prototype.findListShipment = function (callback) {
	var thism = this;
	var list = [];
	this.client.smembers(this.pAllPlan(), function(err, repl) {
		if(err) {console.log(err);callback(err);}
		else {
			async.forEach(repl, function(id, callback){
				selectRedis.call (thism, id, function(err, result) {
						if (err) callback(err);
						else {
						list.push(result);
						callback();
						}
					});
			}, function(err){
				if (err) callback('Ошибка загрузки списка планируемых отгрузок - '+err);
				else callback(null, list);
			});
		}
	}.bind(this));
};

ShipmentModel.prototype.findShipment = function (id, callback) {
	selectRedis.call (this, id, function(err, result) {
				if (err) callback(err);
				else {
						callback(null, result);
					}
		});
};
