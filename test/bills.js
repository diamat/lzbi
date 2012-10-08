//bills.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * bill_id - id счета
 * subo_id - id приложения;
 * prod_id - id товара в приложения;
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastBillID: <bill_id> - счетчик id счета
 * (set) bills:bill_id: <bill_id>  - список счетов
 * (set) bills:subo_id:<subo_id>: <bill_id> - список счетов по id приложения
 * (set) bills:prod_id:<prod_id>: <bill_id> - список счетов в которых указан prod_id
 * (set) bills:notaccept: <bill_id> - список не подписанных счетов
 * (list) bills:lastbills: <bill_id> - список псоледних выставленных счетов
 *
 *
 * (hashes) bill:<bill_id>:main: {
 *		subo_id: <subo_id>
 *		status: <статус заявки>
 *		note: <примечание>
 *		accept: <одобрение>
 *		date: <дата>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * (hashes) bill:<bill_id>:prod_id:<prod_id>: {
 *		price: <цена>
 *		number: <кол-во товаров>
 *		dateupdate: <дата(время) редактирования>
 * }
 * Методы:
 * create(data) - содание модели основной;
 * save() - сохранение ранее созданой модели;
 * 
 */
 

 // Модель BillModel
var BillModel = module.exports =  function (client) {
    this.client = client;
    this.isCreateMain = false;
	this.isCreateprod = false;
};

// Функция фабрика
BillModel.prototype.createMain = function (data) {
	if(data.subo_id){
		var model = new BillModel(this.client);
		model.subo_id = data.subo_id;
		model.status = data.status || '0';
		model.note = data.note || '';
		model.accept = data.accept || '0';
		model.date = data.date || my_sys.dateSave();
		model.dateupdate = my_sys.dateSave();
		model.isCreateMain = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция фабрика
BillModel.prototype.createProd = function (data) {
	if(data.price || data.number){
		var model = new BillModel(this.client);
		model.price = data.price;
		data.number = data.number;
		model.dateupdate = my_sys.dateSave();
		model.isCreateprod = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
BillModel.prototype.exportmodelmain = function (data, bill_id) {
    var expmodel = new Object;
	expmodel.bill_id = bill_id;
	expmodel.subo_id = data[0];
	expmodel.status = data[1];
	expmodel.note = data[2];
	expmodel.accept = data[3];
	expmodel.date = data[4];
	expmodel.dateupdate = data[5];
    return expmodel;
};

// Функция для форматированной отправки данных
BillModel.prototype.exportmodelprod = function (data, bill_id, prod_id) {
    var expmodel = new Object;
	expmodel.bill_id = bill_id;
	expmodel.prod_id = prod_id;
	expmodel.price = data[0];
	expmodel.number = data[1];
	expmodel.dateupdate = data[2];
    return expmodel;
};

// Возвращает имя ключа для global:lastBillID: 
BillModel.prototype.pLastID = function () {
    return 'global:lastBillID:';
};

// Возвращает имя поля для bills:bill_id:
BillModel.prototype.pListBills = function () {
    return 'bills:bill_id:';
};

// Возвращает имя поля для bills:subo_id:<subo_id>:
BillModel.prototype.pListBySubo_id = function (subo_id) {
    return 'bills:subo_id:'+subo_id+':';
};

// Возвращает имя поля для bills:prod_id:<prod_id>: 
BillModel.prototype.pListByProd_id = function (prod_id) {
    return 'bills:prod_id:'+prod_id+':';
};

// Возвращает имя поля для bills:notaccept:
BillModel.prototype.pListNotAccept = function () {
    return 'bills:notaccept:';
};

// Возвращает имя поля для bills:lastbills:
BillModel.prototype.pListLastBills = function () {
    return 'bills:lastbills:';
};

// Возвращает имя поля для bill:<bill_id>:main:
BillModel.prototype.pBillMain = function (bill_id) {
    return 'bill'+bill_id+':main:';
};

// Возвращает имя поля для bill:<bill_id>:prod_id:<prod_id>:
BillModel.prototype.pBillProd = function (bill_id, prod_id) {
    return 'bill:'+bill_id+':prod_id:'+prod_id+':';
};

  // Возвращает имя поля для number:
BillModel.prototype.kNumber = function () {
    return 'number:';
}; 
 
 // Возвращает имя поля для price:
BillModel.prototype.kPrice = function () {
    return 'price:';
}; 
 
// Возвращает имя поля для date:
BillModel.prototype.kDate = function () {
    return 'date:';
}; 
 
// Возвращает имя поля для accept:
BillModel.prototype.kAccept = function () {
    return 'accept:';
}; 
 
// Возвращает имя поля для status:
BillModel.prototype.kStatus = function () {
    return 'status:';
};

// Возвращает имя поля для subo_id:
BillModel.prototype.kSudo_id = function () {
    return 'subo_id:';
};

// Возвращает имя поля для note:
BillModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dateupdate:
BillModel.prototype.kDataupdate = function () {
    return 'dateupdate:';
};


// инкремент c_id
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
function isCreateTrue (modelName, callback){
	var isCreate = false;
	if(modelName === 'main') isCreate = this.isCreateMain;
	if(modelName === 'prod') isCreate = this.isCreateProd;
	if (isCreate) {
			callback(null, 'Модель существует!');
	} else {
			callback('Модель должна быть создана перед сохранением!');
		}
}

// проверка существования счета с таким bill_id
function findSave (bill_id, callback){
	this.client.hexists(this.pBillMain(bill_id), this.kSudo_id(), function (err, result) {
			if(err || result === 0) {
					callback('Такая компания не существует.');
			} else {
					callback(null, result);
				}
		});
}

// Основная функция выполняющая сохранение
function saveMain(bill_id, flag, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pBillMain(c_id), this.kSudo_id(), this.sudo_id, this.kStatus(), this.status, this.kAccept(), this.accept, this.kDate(), this.date, this.kNote(), this.note, this.kDataupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
	var q1 = [];
	var q2 = [];
	if(flag === 'new'){
		q1 = ['sadd', this.pListNotAccept(), bill_id];
		q2 = ['rpush', this.pListLastBills(), bill_id];
	}
	this.client.multi([
	q,
	['sadd', this.pListBills(), bill_id],
	['sadd', this.pListBySubo_id(this.sudo_i), bill_id],
	q1, q2
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, bill_id);
			};
	});
};

//BillModel.save();
BillModel.prototype.save = function (modelName, callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		lastID: ['isCreateTrue', function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveMain.call(thism, results.lastID, 'new', callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// запрос к Redis и возврат результата в виде модели
function selectRedis (bill_id, callback){
	var thism = this;
	var q = [this.pBillMain(bill_id), this.kSudo_id(), this.kStatus(), this.kNote(), this.kAccept(), this.kAccept(), this.kDate(), this.kDataupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var user = new userModel(thism.client);
				user.findByUserID(repl[0],function (err, res) {
					var result = thism.exportmodelmain(repl, bill_id);
					callback(null, result);
				});
			} 
	});
}

// BillModel.findByCustomerС_ID
BillModel.prototype.findByCustomerID = function (c_id, callback) {
	var thism = this;
	async.series([
        function (callback){
			findSave.call(thism, c_id, callback);
		},
		function(callback){
			selectRedis.call(thism, c_id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else callback(null, results[1]);
    });
};

// BillModel.findByCustomerINN
BillModel.prototype.findByCustomerINN = function (inn, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getCID.call(thism, inn, callback);
		},
		function (c_id, callback){
			selectRedis.call(thism, c_id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// Функция возврата c_id по inn
function getCID(inn, callback) {
	this.client.get(this.pINN(inn), function(err, repl) {
   	 if (err || repl === null) {
				callback('Компании с таким ИНН не существует.');
		} else {	
				callback(null, repl);
			};
	});
};

// Функция возврата inn и u_id по c_id
function getINN(c_id, callback) {
	this.client.hmget(this.pCMain(c_id), this.kINN(), this.kUID(),function(err, repl) {
   	 if (err || repl === null) {
				callback('Такой компании не существует.');
		} else {	
				callback(null, repl[0], repl[1]);
			};
	});
};

// BillModel.remove
BillModel.prototype.remove = function (c_id, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getINN.call(thism, c_id, callback);
		},
		function (inn, u_id, callback){
			thism.client.multi([
			['del',  thism.pCMain(c_id), thism.pINN(inn)],
			['srem', thism.qType0, c_id],
			['srem', thism.qType1, c_id],
			['srem', thism.pListCID(), c_id],
			['srem', thism.pListCID_UID(u_id), c_id],
			['srem', thism.pListActive(), c_id],
			['srem', thism.pListArchive(), c_id]
			]).exec(function (err, repl) {
				if (err) {
					callback('Ошибка в запросе к Redis - remove');
				} else {
					callback(null, c_id+' - удалён из БД');
					};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// BillModel.update
BillModel.prototype.update = function (c_id, callback) {
	var thism = this;
	async.series([
		function (callback){
			isCreateTrue.call(thism, callback);
		},
		function (callback){
			saveCustomer.call(thism, c_id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// BillModel.addActive
BillModel.prototype.addActive = function (c_id, callback) {
	var thism = this;
	async.series([
		function (callback){
			findSave.call(thism, c_id, callback);
		},
		function (callback){
			thism.client.multi([
			['sadd', thism.pListActive(), c_id],
			['srem', thism.pListArchive(), c_id],
			]).exec(function (err, repl) {
			if (err) {
					callback('Ошибка добавления компании в список активных');
			} else {
					callback(null, 'Компания добавлена в список активных');
				};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// BillModel.addArchvive
BillModel.prototype.addArchvive = function (c_id, callback) {
	var thism = this;
	async.series([
		function (callback){
			findSave.call(thism, c_id, callback);
		},
		function (callback){
			thism.client.multi([
			['sadd', thism.pListArchive(), c_id],
			['srem', thism.pListActive(), c_id],
			]).exec(function (err, repl) {
			if (err) {
					callback('Ошибка добавления компании в архив');
			} else {
					callback(null, 'Компания добавлена в архив');
				};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// BillModel.findCustomersActiv
BillModel.prototype.findCustomersActive = function (callback) {
	this.client.smembers(this.pListActive(), function(err, result) {
		if (err) {
					callback('Ошибка выборки активных компаний');
			} else {
					callback(null, result);
				};
	});
};

// BillModel.findListActive
BillModel.prototype.findListActive = function (callback) {
	var args = [];
	var thism = this;
	this.client.smembers(this.pListActive(), function(err, result) {
		if (err) {
					callback('Ошибка выборки активных пользователей');
			} else {
					async.forEach(result, function(id, callback){
						thism.findByCustomerID (id, function(err, result) {
							if (err) callback(err);
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки всех активных заказчиков - '+err);
							else callback(null, args);
					});
				};
	});
};

// BillModel.findCustomersArchive
BillModel.prototype.findCustomersArchive = function (callback) {
	this.client.smembers(this.pListArchive(), function(err, result) {
		if (err) {
					callback('Ошибка выборки архивных компаний');
			} else {
					callback(null, result);
				};
	});
};