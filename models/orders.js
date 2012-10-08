//orders.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var Сustomers = require('../models/customers');
var SpravProdModel = require('../models/spravprod');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика;
 * u_id - id пользователя;
 * o_id - id договора;
 * subo_id - id приложения;
 * prod_id - id товара в приложения;
 * prod_sid - id из справочника продуктов;
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastOrderID: <o_id> - счетчик o_id;
 * (string) global:lastSubOrderID: <subo_id> - счетчик subo_id;
 * (string) global:lastProdID: <prod_id> - счетчик prod_id;
 * (set) orders:c_id:<c_id>:o_id: <o_id>
 * (set) orders:o_id: <o_id>
 * (set) orders:c_id: <c_id>
 * (set) order:o_id:<o_id>:subo_id: <subo_id> 
 * (set) order:subo_id:<subo_id>:prod_id <prod_id>
 * 
 * (hashes) order:<o_id>:main: {
 *		c_id: <c_id>
 *		name: <название договора>
 *		note: <примечание>
 * 		date: <дата заключения договора>
 *		dateupdate: <дата(время) редактирования>
 * }
 * 
 * (hashes) suborder:<subo_id>:main: {
 *		sub_no: <номер приложения>
 *		o_id: <o_id>
 * 		znubmer: <номер заявки>
 *		name: <название приложения>
 *		status: <cтатус приложения>
 *		note: <примечание>
 * 		date: <дата заключения приложения>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * (hashes) suborder:prod_id:<prod_id>:main: {
 *		subo_id: <subo_id>
 *		prod_sid: <prod_sid>
 *		addname: <название приложения>
 *		price: <цена>
 *		number: <кол-во>
 *		graft: <откат>
 *		datacreate: <время первого создания>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * add(c_id, bik, rs) - добавление rs компании;
 * remove(rs) - удаление rs;
 * 
 */
 
  // Модель OrderModel
var OrderModel = module.exports =  function (client) {
    this.client = client;
    this.isCreateOrder = false;
	this.isCreateSubOrder = false;
	this.isCreateSubOrderProd = false;
};
 
  // Модель  OrderModel
var OrderModel = module.exports =  function (client) {
    this.client = client;
};

 // Возвращает имя ключа для global:lastOrderID:
OrderModel.prototype.pLastOrderID = function () {
    return 'global:lastOrderID:';
};

 // Возвращает имя ключа для global:lastSubOrderID:
OrderModel.prototype.pLastSubOrderID = function () {
    return 'global:lastSubOrderID:';
};

 // Возвращает имя ключа для global:lastProdID:
OrderModel.prototype.pLastProdID = function () {
    return 'global:lastProdID:';
};

 // Возвращает имя ключа для orders:o_id:
OrderModel.prototype.pListOrders = function () {
    return 'orders:o_id:';
};

 // Возвращает имя ключа для orders:c_id:
OrderModel.prototype.pListCID = function () {
    return 'orders:c_id:';
};

 // Возвращает имя ключа для orders:c_id:<c_id>:o_id:
OrderModel.prototype.pCIDOrderID = function (c_id) {
    return 'orders:c_id:'+c_id+':o_id:';
};

 // Возвращает имя ключа для order:o_id:<o_id>:subo_id:
OrderModel.prototype.pOrderIDSubOID = function (o_id) {
    return 'order:o_id:'+o_id+':subo_id:';
};

 // Возвращает имя ключа для order:subo_id:<subo_id>:prod_id
OrderModel.prototype.pSubOIDProd = function (subo_id) {
    return 'order:subo_id:'+subo_id+':prod_id';
};

 // Возвращает имя ключа для order:<o_id>:main:
OrderModel.prototype.pOrderMain = function (o_id) {
    return 'order:'+o_id+':main:';
};

 // Возвращает имя ключа для c_id:
OrderModel.prototype.kCID = function () {
    return 'c_id:';
};

 // Возвращает имя ключа для name:
OrderModel.prototype.kName = function () {
    return 'name:';
};

 // Возвращает имя ключа для note:
OrderModel.prototype.kNote = function () {
    return 'note:';
};

 // Возвращает имя ключа для date:
OrderModel.prototype.kDate = function () {
    return 'date:';
};

 // Возвращает имя ключа для dateupdate:
OrderModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
};

 // Возвращает имя ключа для suborder:<subo_id>:main:
OrderModel.prototype.pSubOrderMain = function (subo_id) {
    return 'suborder:'+subo_id+':main:';
};

  // Возвращает имя ключа для sub_no:
OrderModel.prototype.kSubNo = function () {
    return 'sub_no:';
};

 // Возвращает имя ключа для o_id:
OrderModel.prototype.kOrderID = function () {
    return 'o_id:';
};

 // Возвращает имя ключа для znubmer:
OrderModel.prototype.kZNubmer = function () {
    return 'znubmer:';
};

 // Возвращает имя ключа для status:
OrderModel.prototype.kStatus = function () {
    return 'status:';
};

 // Возвращает имя ключа для suborder:prod_id:<prod_id>:main:
OrderModel.prototype.pProdIDMain = function (prod_id) {
    return 'suborder:prod_id:'+prod_id+':main:';
};

 // Возвращает имя ключа для prod_sid:
OrderModel.prototype.kProdSID = function () {
    return 'prod_sid:';
};

 // Возвращает имя ключа для subo_id:
OrderModel.prototype.kSubOID = function () {
    return 'subo_id:';
};

 // Возвращает имя ключа для addname:
OrderModel.prototype.kAddName = function () {
    return 'addname:';
};

 // Возвращает имя ключа для price:
OrderModel.prototype.kPrice = function () {
    return 'price:';
};

 // Возвращает имя ключа для number:
OrderModel.prototype.kNumber = function () {
    return 'number:';
};

 // Возвращает имя ключа для graft:
OrderModel.prototype.kGraft = function () {
    return 'graft:';
};

 // Возвращает имя ключа для datacreate:
OrderModel.prototype.kDataCreate = function () {
    return 'datacreate:';
};

 
 // проверка наличия модели
function isCreateTrue (modelName, callback){
	var isCreate = false;
	if(modelName === 'Order') isCreate = this.isCreateOrder;
	if(modelName === 'SubOrder') isCreate = this.isCreateSubOrder;
	if(modelName === 'SubOrderProd') isCreate = this.isCreateSubOrderProd;
	if (isCreate) {
			callback(null, 'Модель существует!');
	} else {
			callback('Модель должна быть создана перед сохранением!');
		}
}

// инкремент 
function lastID(modelName, callback) {
	var LastID = false;
	if(modelName === 'Order') LastID = this.pLastOrderID();
	if(modelName === 'SubOrder') LastID = this.pLastSubOrderID();
	if(modelName === 'SubOrderProd') LastID = this.pLastProdID();
	this.client.incr(LastID, function(err, result) {
	if (err) {
				callback ('Ошибка инкремента!');
		} else {
				callback(null, result);
			};
	});
};
 
// Функция фабрика для order:<o_id>:main:
OrderModel.prototype.createOrder = function (data) {
	if(data.c_id && data.name && data.date){
		var model = new OrderModel(this.client);
		model.c_id = data.c_id;
		model.name = data.name;
		model.note = data.note || '';
		model.date = data.date;
		model.dateupdate = my_sys.dateSave();
		model.isCreateOrder = true;
		this.isCreateSubOrder = false;
		this.isCreateSubOrderProd = false;
		return model;
	} else {
		return 'error createOrder';
	}
};

// Функция фабрика для suborder:<subo_id>:main
OrderModel.prototype.createSubOrder = function (data) {
	if(data.o_id && data.name && data.date ){
		var model = new OrderModel(this.client);
		model.sub_no = data.sub_no || '0';
		model.o_id = data.o_id;
		model.znubmer = data.znubmer || '';
		model.name = data.name;
		model.status = data.status || '0';
		model.note = data.note || '';
		model.date = data.date;
		model.dateupdate = my_sys.dateSave();
		model.isCreateSubOrder = true;
		this.isCreateOrder = false;
		this.isCreateSubOrderProd = false;
		return model;
	} else {
		return 'error createSubOrder';
	}
};

// Функция фабрика для suborder:prod_id:<prod_id>:main:
OrderModel.prototype.createSubOrderProd = function (data) {
	if(data.prod_sid && data.subo_id && data.price && data.number){
		var model = new OrderModel(this.client);
		model.prod_sid = data.prod_sid;
		model.subo_id = data.subo_id;
		model.addname = data.addname || '';
		model.price = data.price;
		model.number = data.number;
		model.graft = data.graft || '0';
		model.datacreate = data.datacreate ;
		model.dateupdate = my_sys.dateSave();
		model.isCreateSubOrderProd = true;
		this.isCreateOrder = false;
		this.isCreateSubOrder = false;
		return model;
	} else {
		return 'error createSubOrderProd';
	}
};

// Функция для форматированной отправки данных Order
OrderModel.prototype.exportmodelOrder = function (data, id) {
    var expmodel = new Object;
	expmodel.o_id = id;
	expmodel.c_id = data[0];
	expmodel.name = data[1];
	expmodel.note = data[2];
	expmodel.date = data[3];
	expmodel.dateupdate = data[4];
	expmodel.formatdate = my_sys.formatDate(data[3]);
    return expmodel;
};


// Функция для форматированной отправки данных SubOrder
OrderModel.prototype.exportmodelSubOrder = function (data, id) {
    var expmodel = new Object;
	expmodel.subo_id = id;
	expmodel.sub_no = data[0];
	expmodel.o_id = data[1];
	expmodel.znubmer = data[2];
	expmodel.name = data[3];
	expmodel.status = data[4];
	expmodel.note = data[5];
	expmodel.date = data[6];
	expmodel.dateupdate = data[7];
	expmodel.formatdate = my_sys.formatDate(data[6]);
    return expmodel;
};

// Функция для форматированной отправки данных exportmodelSubOrderProd
OrderModel.prototype.exportmodelSubOrderProd = function (data, id) {
    var expmodel = new Object;
	expmodel.prod_id = id;
	expmodel.prod_sid = data[0];
	expmodel.subo_id = data[1];
	expmodel.addname = data[2];
	expmodel.price = data[3];
	expmodel.number = data[4];
	expmodel.graft = data[5];
	expmodel.datacreate = data[6];
	expmodel.dateupdate = data[7];
    return expmodel;
};

//OrderModel.save();
OrderModel.prototype.save = function (modelName, callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, modelName, callback);
		},
		lastID: ['isCreateTrue', function(callback, results){
			lastID.call(thism, modelName, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveInRedis.call(thism, modelName, results.lastID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else {callback(null, results);}
    });
};

// Основная функция выполняющая сохранение
function saveInRedis(modelName, lastid, callback) {
	if(modelName === 'Order') saveOrder.call(this, lastid, callback);	
	if(modelName === 'SubOrder') saveSubOrder.call(this, lastid, callback);	
	if(modelName === 'SubOrderProd') saveSubOrderProd.call(this, lastid, callback);	
};

// Сохранение договора
function saveOrder (lastid, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pOrderMain(lastid), this.kCID(), this.c_id, this.kName(), this.name,  this.kDate(), this.date, this.kNote(), this.note, this.kDateupdate(), this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pCIDOrderID(this.c_id), lastid],
	['sadd', this.pListOrders(), lastid],
	['sadd', this.pListCID(), this.c_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, lastid);
			};
	});
};

// Сохранение приложения
function saveSubOrder (lastid, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pSubOrderMain(lastid), this.kOrderID(), this.o_id, this.kName(), this.name,  this.kDate(), this.date, this.kSubNo(), this.sub_no, 
	this.kZNubmer(), this.znubmer, this.kStatus(), this.status, this.kNote(), this.note, this.kDateupdate(), this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pOrderIDSubOID(this.o_id), lastid]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, lastid);
			};
	});
};

// Сохранение позии в приложении
function saveSubOrderProd (lastid, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pProdIDMain(lastid), this.kProdSID(), this.prod_sid, this.kSubOID(), this.subo_id,  this.kPrice(), this.price, this.kNumber(), 
	this.number, this.kAddName(), this.addname,  this.kDateupdate(), this.dateupdate];
	if(this.graft) q.push (this.kGraft(), this.graft);
	if(this.datacreate) q.push (this.kDataCreate(), this.datacreate);
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pSubOIDProd(this.subo_id), lastid]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, lastid);
			};
	});
};

// OrderModel.update
OrderModel.prototype.update = function (id, modelName, callback) {
	var thism = this;
	async.waterfall([
		function (callback){
			isCreateTrue.call(thism, modelName, callback);
		},
		function (c_id, callback){
			saveInRedis.call(thism, modelName, id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// OrderModel.findByID
OrderModel.prototype.findByID = function (id, modelName, flag, callback) {
	selectRedis.call(this, modelName, id, function(err, result) {
	if(err) callback(err);
	else if(flag === 'all') {
			if(!result.c_id) {
				if(!result.o_id)
					this.findByID (result.subo_id, 'SubOrder', 'all', function(err, res) {
						result.suborder = res;
						callback(null, result);	
					}.bind(this));
				else this.findByID (result.o_id, 'Order', 'all', function(err, res) {
						result.order = res;
						callback(null, result);	
					}.bind(this));
			}
			else findByCustomerID(result.c_id, this.client, function(res) {
					result.customer = res;
					callback(null, result);
				});
		} 
	}.bind(this));
};

function findByCustomerID (id, client, callback) {
	var сustomers = new Сustomers(client);
	сustomers.findByCustomerID (id, function(error, res) {
		callback(res);
	});
}
	
// Основная функция выполняющая сохранение
function selectRedis(modelName, id, callback) {
	var q;
	if(modelName === 'Order') q = [this.pOrderMain(id), this.kCID(), this.kName(), this.kNote(), this.kDate(), this.kDateupdate()];
	if(modelName === 'SubOrder') q = [this.pSubOrderMain(id), this.kSubNo(), this.kOrderID(), this.kZNubmer(), this.kName(), this.kStatus(), this.kNote(), this.kDate(), this.kDateupdate()];	
	if(modelName === 'SubOrderProd') q = [this.pProdIDMain(id), this.kProdSID(), this.kSubOID(), this.kAddName(), this.kPrice(), this.kNumber(), this.kGraft(), this.kDataCreate(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				if(repl[repl.length-1] === null ) callback('Нет такой записи!');
				else {
					var result;
					if(modelName === 'Order') result = this.exportmodelOrder(repl, id);
					if(modelName === 'SubOrder') result = this.exportmodelSubOrder(repl, id);
					if(modelName === 'SubOrderProd') result = this.exportmodelSubOrderProd(repl, id);
					callback(null, result);
				}
			} 
	}.bind(this));
};

// OrderModel.remove
OrderModel.prototype.remove = function (id, id2, modelName, callback) {
	var q;
	if(modelName === 'Order') q = [['del',  this.pOrderMain(id)], ['srem', this.pCIDOrderID(id2), id], ['srem', this.pListOrders(), id]];
	if(modelName === 'SubOrder') q = [['del',  this.pSubOrderMain(id)], ['srem', this.pOrderIDSubOID(id2), id]];
	if(modelName === 'SubOrderProd') q = [['del',  this.pProdIDMain(id)], ['srem', this.pSubOIDProd(id2), id]];
	this.client.multi(q).exec(function (err, repl) {
			if (err) {
					callback('Ошибка в запросе к Redis - remove');
			} else {
					callback(null, id+' - удалён из БД');
				};
		});
};

// OrderModel.findListOrdersByCID
OrderModel.prototype.findListOrdersByCID = function (c_id, callback) {
	this.client.smembers(this.pCIDOrderID(c_id), function(err, result) {
		if (err) callback('Ошибка выборки всех договоров по id заказчика');
		else callback(null, result);
	});
};

// OrderModel.findUID
OrderModel.prototype.findUID = function (id, modelName, callback) {
	var q;
	if(modelName === 'Order') q = [this.pOrderMain(id), this.kCID(), this.kName()];
	else if(modelName === 'SubOrder') q = [this.pSubOrderMain(id), this.kOrderID(), this.kName()];
	else if(modelName === 'SubOrderProd') q = [this.pProdIDMain(id), this.kSubOID()];
	else callback ('modelName не верная');
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				if(modelName === 'Order') {
					var customer = new Сustomers (this.client);
					customer.findUID(repl[0], function (err, res) {
						res.c_id = repl[0];
						res.o_name = repl[1];
						callback(null, res);
					});
				} else if(modelName === 'SubOrder'){
					this.findUID(repl[0], 'Order', function (err, res) {
						res.o_id = repl[0];
						res.subo_name = repl[1];
						callback(null, res);
					});
				} else {
					this.findUID(repl[0], 'SubOrder', function (err, res) {
						res.subo_id = repl[0];
						callback(null, res);
					});
				}
			} 
	}.bind(this));
};

// OrderModel.findListOrders
OrderModel.prototype.findListOrders = function (flag, callback) {
	var сustomers = new Сustomers(this.client);
	var args = [];
	var buff = {};
	this.client.smembers(this.pListOrders(), function(err, result) {
		if (err) callback('Ошибка выборки всех договоров');
		else {
			this.findList('Order', result, function(err, list) {
				if (err) callback(err);
				else if(flag === 'all') {
					async.forEach(list, function(id, callback){
						сustomers.findUID (id.c_id, function(err, result) {
							if (err) callback(err);
							else {
							buff = id;
							buff.customer = result;
							args.push(buff);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки всех заказов - '+err);
							else {callback(null, args);}
					});
				} else callback(null, list);
			});	
		}
	}.bind(this));
};


// OrderModel.findListCID
OrderModel.prototype.findListCID = function (callback) {
	this.client.smembers(this.pListCID(), function(err, result) {
		if (err) callback('Ошибка выборки всех клиентов с договорами');
		else callback(null, result);
	});
};

// OrderModel.findListSubOIDByOID
OrderModel.prototype.findListSubOIDByOID = function (o_id, callback) {
	var args = [];
	this.client.smembers(this.pOrderIDSubOID(o_id), function(err, result) {
		if (err) callback('Ошибка выборки списка приложений по id договору');
		else {
			this.findList('SubOrder', result, function(err, res) {
				callback(null, res);
			});
		}
	}.bind(this));
};

// OrderModel.findListProdIDBySubOID
OrderModel.prototype.findListProdIDBySubOID = function (subo_id, callback) {
	var args = [];
	this.client.smembers(this.pSubOIDProd(subo_id), function(err, result) {
		if (err) callback('Ошибка выборки списка продукции по id приложения');
		else {
			this.findList('SubOrderProd', result, function(err, res) {
				var spravprod = new SpravProdModel(this.client);
				async.forEach(res, function(id, callback){
						spravprod.findByProdSID(id.prod_sid, function(err, result2) {
							if (err) callback(err);
							else {
							var buff = id;
							buff.prodname = result2.name;
							buff.group = result2.group;
							buff.unitname = result2.unitname;
							buff.pricefl = parseFloat(id.price);
							//buff.numbefl = parseFloat(id.number);
							buff.sum = parseFloat(id.price)*parseFloat(id.number);
							buff.formatsum = my_sys.StrToFl(buff.sum, 2 ,' ');
							buff.price = my_sys.StrToFl(id.price, 2 ,' ');
							buff.number = my_sys.StrToFl(id.number, 2 ,' ');
							args.push(buff);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки из справочника продукции - '+err);
							else callback(null, args);
					});
			}.bind(this));
		}
	}.bind(this));
};

// OrderModel.findByProdID
OrderModel.prototype.findByProdID = function (prod_id, callback) {
	var args = [];
		selectRedis.call(this, 'SubOrderProd', prod_id, function(err, id) {
				var spravprod = new SpravProdModel(this.client);
				spravprod.findByProdSID(id.prod_sid, function(err, result2) {
					if (err) callback(err);
					else {
						var buff = id;
						buff.prodname = result2.name;
						buff.group = result2.group;
						buff.unitname = result2.unitname;
						buff.pricefl = parseFloat(id.price);
						//buff.numbefl = parseFloat(id.number);
						buff.sum = parseFloat(id.price)*parseFloat(id.number);
						buff.formatsum = my_sys.StrToFl(buff.sum, 2 ,' ');
						buff.price = my_sys.StrToFl(id.price, 2 ,' ');
						buff.number = my_sys.StrToFl(id.number, 2 ,' ');
						args.push(buff);
						callback(null, args);
					};
				});
		}.bind(this));

};


// OrderModel.findList
OrderModel.prototype.findList = function (modelName, arr, callback) {
	var args = [];
    async.forEach(arr, function(id, callback){
        selectRedis.call(this, modelName, id, function(err, result) {
			if (err) callback(err);
			else {
					args.push(result);
					callback();
				};
		});
    }.bind(this), function(err){
        if (err) callback('Ошибка загрузки - '+err);
		else callback(null, args);
    });
};

