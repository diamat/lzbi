//customers.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var userModel = require('../models/user');
var SpravProdModel = require('../models/spravprod');
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
 * (set)  customers:type:1:c_id: <c_id>  -  список id поставщиков (в случае если id есть и в списке клиентов и поставщиков, то это контрагент)
 * (string)  customer:inn:<inn>:c_id: <c_id> 
 *
 *
 * (hashes) customer:<c_id>:main: {
 *		u_id: <u_id>
 *		name: <название компании>
 *		inn: <ИНН>
 *		kpp: <КПП>
 *	    type: <Тип контагента>
 *	    typepg: <тип поставщика исходя из справочник типов продукции>
 *		ogrn: <ОГРН>
 *		okpo: <ОКПО>
 *		phones: <телефоны>
 *		fax: <факс>
 *		email: <e-mail>
 *		www: <e-mail>
 *		note: <примечание>
 *		dateupdate: <дата(время) редактирования>
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
		model.type = data.type;
		model.typepg = data.typepg || '0';
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
		model.dateupdate = my_sys.dateSave();
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
	expmodel.type = data[1];
	expmodel.name = data[2];
	expmodel.formatname = my_sys.replaceOOO(expmodel.name);
	expmodel.inn = data[3];
	expmodel.kpp = data[4];
	expmodel.ogrn = data[5];
	expmodel.okpo = data[6];
	expmodel.phones = data[7];
	expmodel.fax = data[8];
	expmodel.email = data[9];
	expmodel.www = data[10];
	expmodel.note = data[11];
	expmodel.typepg = data[12];
	expmodel.fio = 'null';
	expmodel.dateupdate = data[13];
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

// Возвращает имя поля для typepg:
CustomerModel.prototype.kTypePG = function () {
    return 'typepg:';
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

// Возвращает имя поля для dateupdate:
CustomerModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
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
	var q = ['hmset', this.pCMain(c_id), this.kUID(), this.u_id, this.kType(), this.type, this.kTypePG(), this.typepg, this.kName(), this.name,  this.kINN(), this.inn,
	this.kKPP(), this.kpp, this.kOGRN(), this.ogrn, this.kOKPO(), this.okpo, this.kPhones(), this.phones, this.kFax(), 
	this.fax, this.kEmail(), this.email, this.kWWW(), this.www, this.kNote(), this.note, this.kDateupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
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

// Функция синхронизации названия.
CustomerModel.prototype.updatecname = function (c_id, name, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pCMain(c_id), this.kName(), name];
	// Сохраняем все в один запрос
	this.client.multi([
	q
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
	var q = [this.pCMain(c_id), this.kUID(), this.kType(), this.kName(), this.kINN(), this.kKPP(), this.kOGRN(), this.kOKPO(), 
	this.kPhones(), this.kFax(), this.kEmail(), this.kWWW(), this.kNote(), this.kTypePG(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var user = new userModel(thism.client);
				var result = thism.exportmodel(repl, c_id);
				user.findByUserID(repl[0],function (err, res) {
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

// CustomerModel.findUID
CustomerModel.prototype.findUID = function (c_id, callback) {
	this.client.hmget(this.pCMain(c_id), this.kUID(), this.kName(), this.kINN(), this.kPhones(), function(err, repl) {
		if (err || repl[repl.length-1] === null) {
				callback('Ошибка в запросе к Redis')
		} else {
				var user = new userModel(this.client);
				user.findByUserID(repl[0], function (err, res) {
					var result = {}
					result.fio = res.name+' '+res.lastname;
					result.u_id = repl[0];
					result.c_name = repl[1];
					result.inn = repl[2];
					result.phone = repl[3];
					callback(null, result);
				});
			} 
	}.bind(this));
};

// CustomerModel.findByCustomerINN
CustomerModel.prototype.findByCustomerINN = function (inn, callback) {
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

// Функция удаления заказчика из спика пользователя
function findLastUID(c_id, callback) {
	this.client.srem(this.pListCID_UID(this.u_id), c_id, function(err, repl) {
   	 if (err || repl === null) {
				callback('Ошибка удаления c_id из списка менеджера.');
		} else {	
				callback(null, 'Удаление прошло номрально.');
			};
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
			findLastUID.call(thism, c_id, callback);
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

// CustomerModel.findListCustomer 
CustomerModel.prototype.findListCustomers = function (type, callback) {
	var args = [];
	var thism = this;
	var qType = this.pType1();
	if(type === '0') qType = this.pType0();
	this.client.smembers(qType, function(err, result) {
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

// CustomerModel.findListCustomer 
CustomerModel.prototype.findListCustomersProd = function (prod_sid, callback) {
	var args = [];
	var thism = this;
	var qType = this.pType1();
	this.client.smembers(qType, function(err, result) {
		if (err) {
					callback('Ошибка выборки активных пользователей');
			} else {
					async.forEach(result, function(id, callback){
						var spravprod = new SpravProdModel(thism.client);
						spravprod.findNumber(id, prod_sid, function(err, res){
							if(err || res === null) callback();
							else {
								thism.findByCustomerID (id, function(err, result) {
									if (err) callback(err);
									else {
										result.number = res;
										args.push(result);
										callback();
									};
								});
							}
						});	
					}, function(err){
							if (err) callback('Ошибка загрузки всех активных заказчиков - '+err);
							else {console.log(args);callback(null, args);}
					});
				};
	});
};

// CustomerModel.findListByUID
CustomerModel.prototype.findListByUID = function (u_id, callback) {
	var args = [];
	var thism = this;
	this.client.smembers(this.pListCID_UID(u_id), function(err, result) {
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