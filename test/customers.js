//customers.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var userModel = require('../models/user');
var async = require('async');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * rs - расчётный счет
 * con_id - id контакта
 * bik - БИК банка заказчика
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastCusomerID: <c_id> - счетчик id заказчика
 * (set) customersActive:c_id: <id> 
 * (set) customersArchive:c_id: <id> 
 * (set) customers:c_id: <c_id>
 * (set) customers:u_id:<u_id>:c_id: <c_id>
 * (set)  customers:type:0:c_id: <c_id>  -  список id клиентов
 * (set)  customers:type:1:c_id: <c_id>  -  список id поставщиков (в случае если id есть и в списке клиентов и псотавщиков, то это контрагент)
 * (string)  customer:inn:<inn>:c_id: <c_id> 
 *
 *
 * (hashes) customer:<c_id>:main: {
 *		u_id: <u_id>
 *		forma_sob: <форма собствености>
 *		name: <название компании>
 *		inn: <ИНН>
 *		kpp: <КПП>
 *		ogrn: <ОГРН>
 *		okpo: <ОКПО>
 *		phones: <телефоны>
 *		fax: <факс>
 *		email: <e-mail>
 *		www: <e-mail>
 *		note: <примечание>
 *		dataupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * create(data) - содание модели основной;
 * save() - сохранение ранее созданой модели;
 * remove(id) - удаление заказчика по id (id);
 * findByCustomerID(id) - поиск по id (id);
 * findByCustomerINN (inn) -  поиск по ИНН (inn);
 * addArchvive(id) - добавление заказчика в архив по id;
 * addActive(id) - добавление заказчика в архив по id;
 * findByUserID (id) - поиск по id;
 * findCustomersArchive - поиск id всех архивных заказчиков;
 * findCustomersActive - поиск id всех активных заказчиков;
 * 
 */
 

 // Модель CustomerMainModel
var CustomerModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
CustomerModel.prototype.create = function (data) {
	if(data.u_id && data.inn && data.name && data.type){
		var model = new CustomerModel(this.client);
		model.u_id = data.u_id;
		model.forma_sob = data.forma_sob || '';
		model.type = data.type;
		model.name = data.name;
		model.inn = data.inn;
		model.kpp = data.kpp || '';
		model.ogrn = data.ogrn || '';
		model.okpo = data.okpo || '';
		model.phones = data.phones || '';
		model.fax = data.fax || '';
		model.email = data.email || '';
		model.www = data.www || '';
		model.note = data.note || '';
		model.dataupdate = my_sys.dateSave();
		model.isCreate = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
CustomerModel.prototype.exportmodel = function (data, c_id) {
    var expmodel = new Object;
	expmodel.c_id = c_id;
	expmodel.u_id = data[0];
	expmodel.forma_sob = data[1];
	expmodel.type = data[2];
	expmodel.name = data[3];
	expmodel.inn = data[4];
	expmodel.kpp = data[5];
	expmodel.ogrn = data[6];
	expmodel.okpo = data[7];
	expmodel.phones = data[8];
	expmodel.fax = data[9];
	expmodel.email = data[10];
	expmodel.www = data[11];
	expmodel.note = data[12];
	expmodel.fio = 'null';
	expmodel.dataupdate = data[13];
    return expmodel;
};

// Возвращает имя ключа для customer:<c_id>:main:
CustomerModel.prototype.pCMain = function (c_id) {
    return 'customer:'+c_id+':main:';
};

// Возвращает имя поля для u_id:
CustomerModel.prototype.kUID = function () {
    return 'u_id:';
};

// Возвращает имя поля для forma_sob:
CustomerModel.prototype.kFormaSob = function () {
    return 'forma_sob:';
};

// Возвращает имя поля для name:
CustomerModel.prototype.kName = function () {
    return 'name:';
};

// Возвращает имя поля для type:
CustomerModel.prototype.kType = function () {
    return 'type:';
};

// Возвращает имя поля для inn:
CustomerModel.prototype.kINN = function () {
    return 'inn:';
};

// Возвращает имя поля для kpp:
CustomerModel.prototype.kKPP = function () {
    return 'kpp:';
};

// Возвращает имя поля для ogrn:
CustomerModel.prototype.kOGRN = function () {
    return 'ogrn:';
};

// Возвращает имя поля для okpo:
CustomerModel.prototype.kOKPO = function () {
    return 'okpo:';
};

// Возвращает имя поля для phones:
CustomerModel.prototype.kPhones = function () {
    return 'phones:';
};

// Возвращает имя поля для fax:
CustomerModel.prototype.kFax = function () {
    return 'fax:';
};

// Возвращает имя поля для email:
CustomerModel.prototype.kEmail = function () {
    return 'email:';
};

// Возвращает имя поля для www:
CustomerModel.prototype.kWWW = function () {
    return 'www:';
};

// Возвращает имя поля для note:
CustomerModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dataupdate:
CustomerModel.prototype.kDataupdate = function () {
    return 'dataupdate:';
};

// Возвращает имя поля для global:lastCusomerID:
CustomerModel.prototype.pLastCID = function () {
    return 'global:lastCusomerID:';
};

// Возвращает имя поля для customers:c_id:
CustomerModel.prototype.pListCID = function () {
    return 'customers:c_id:';
};

// Возвращает имя поля для customers:u_id:<u_id>:c_id:
CustomerModel.prototype.pListCID_UID = function (u_id) {
    return 'customers:u_id:'+u_id+':c_id:';
};

// Возвращает имя поля для customers:type:0:c_id:
CustomerModel.prototype.pType0 = function () {
    return 'customers:type:0:c_id:';
};

// Возвращает имя поля для customers:type:1:c_id:
CustomerModel.prototype.pType1 = function () {
    return 'customers:type:1:c_id:';
};

// Возвращает имя поля для customer:inn:<inn>:c_id:
CustomerModel.prototype.pINN = function (inn) {
    return 'customer:inn:'+inn+':c_id:';
};

// Возвращает имя поля для customersActive:c_id:
CustomerModel.prototype.pListActive= function () {
    return 'customersActive:c_id:';
};

// Возвращает имя поля для customersArchive:c_id:
CustomerModel.prototype.pListArchive= function () {
    return 'customersArchive:c_id:';
};

// проверка сущестования компании перед сохранением на уникальный ИНН
function findINN(callback) {
	this.client.exists(this.pINN(this.inn), function(err, result) {
   	if (err || result === 1) {
			if(err) callback('Ошибка в findINN ');
			else callback('Компания с таким ИНН уже существует');
		} else {	
				callback(null, result);
			};
	});
};

// инкремент c_id
function lastCusomerID(callback) {
	this.client.incr(this.pLastCID, function(err, result) {
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

// проверка существования компании с таким c_id
function findSave (c_id, callback){
	this.client.hexists(this.pCMain(c_id), this.kName(), function (err, result) {
			if(err || result === 0) {
					callback('Такая компания не существует.');
			} else {
					callback(null, result);
				}
		});
}

// Основная функция выполняющая сохранение
function saveCustomer(c_id, callback) {
	var qType = this.pType1();
	if(this.type === '0') qType = this.pType0();
	// Формируем хеш запрос 
	var q = ['hmset', this.pCMain(c_id), this.kUID(), this.u_id, this.kType(), this.type, this.kName(), this.name,  this.kINN(), this.inn, this.kFormaSob(), 
	this.forma_sob, this.kKPP(), this.kpp, this.kOGRN(), this.ogrn, this.kOKPO(), this.okpo, this.kPhones(), this.phones, this.kFax(), 
	this.fax, this.kEmail(), this.email, this.kWWW(), this.www, this.kNote(), this.note, this.kDataupdate(),  this.dataupdate];
	// Сохраняем все в один запрос
	console.log('Сохранение - '+c_id);
	this.client.multi([
	q,
	['sadd', qType, c_id],
	['sadd', this.pListCID(), c_id],
	['sadd', this.pListCID_UID(this.u_id), c_id],
	['set', this.pINN(this.inn), c_id],
	['sadd', this.pListActive(), c_id],
	['srem', this.pListArchive(), c_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, c_id);
			};
	});
};

//CustomerModel.save();
CustomerModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        findINNfalse: function (callback){
			findINN.call(thism, callback);
		},
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		lastID: ['findINNfalse', 'isCreateTrue', function(callback, results){
			lastCusomerID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveCustomer.call(thism, results.lastID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// запрос к Redis и возврат результата в виде модели
function selectRedis (c_id, callback){
	var thism = this;
	var q = [this.pCMain(c_id), this.kUID(), this.kFormaSob(), this.kType(), this.kName(), this.kINN(), this.kKPP(), this.kOGRN(), this.kOKPO(), 
	this.kPhones(), this.kFax(), this.kEmail(), this.kWWW(), this.kNote(), this.kDataupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var user = new userModel(thism.client);
				user.findByUserID(repl[0],function (err, res) {
					var result = thism.exportmodel(repl, c_id);
					result.fio = res.name+' '+res.lastname;
					callback(null, result);
				});
			} 
	});
}

// CustomerModel.findByCustomerС_ID
CustomerModel.prototype.findByCustomerID = function (c_id, callback) {
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

// CustomerModel.findByCustomerINN
CustomerModel.prototype.findByCustomerINN = function (inn, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getCID.call(thism, inn, callback);
		},
		function (c_id, callback){
			console.log(c_id);
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

// CustomerModel.remove
CustomerModel.prototype.remove = function (c_id, callback) {
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

// CustomerModel.update
CustomerModel.prototype.update = function (c_id, callback) {
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

// CustomerModel.addActive
CustomerModel.prototype.addActive = function (c_id, callback) {
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

// CustomerModel.addArchvive
CustomerModel.prototype.addArchvive = function (c_id, callback) {
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

// CustomerModel.findCustomersActiv
CustomerModel.prototype.findCustomersActive = function (callback) {
	this.client.smembers(this.pListActive(), function(err, result) {
		if (err) {
					callback('Ошибка выборки активных компаний');
			} else {
					callback(null, result);
				};
	});
};

// CustomerModel.findListActive
CustomerModel.prototype.findListActive = function (callback) {
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

// CustomerModel.findCustomersArchive
CustomerModel.prototype.findCustomersArchive = function (callback) {
	this.client.smembers(this.pListArchive(), function(err, result) {
		if (err) {
					callback('Ошибка выборки архивных компаний');
			} else {
					callback(null, result);
				};
	});
};