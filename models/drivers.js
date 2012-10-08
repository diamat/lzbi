//drivers.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var Сustomers = require('./customers');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * driver_id - id водителя
 *
 * (set)  customers:driver:driver_id: <driver_id>
 * (set)  customer:<c_id>:driver: <driver_id>
 * (string) global:lastDriverID: <driver_id> - счетчик id водителя
 *
 * (hashes) driver:<driver_id>: {
 *		c_id: <c_id>
 *		fio: <ФИО>
 *		series: <серия паспорта>
 *		number: <номер паспорта>
 *		distribut: <выдан паспорт>
 *		datedistribut: <дата выдачи паспорта>
 *		phones: <телефоны>
 *		note: <примечание>
 *		dateupdate: <дата(время) редактирования>
 * }
 * 
 * create(data) - содание модели основной;
 * save() - сохранение ранее созданой модели;
 * remove(con_id) - удаление контакта по con_id;
 * findByContactID (con_id) - поиск контакта по con_id;
 * findCustomerContacts (c_id) - список con_id контактов по клиенту;
 * findContactsList (arr) - массив контактов по массиву con_id;
 */
 
 // Модель DriverModel
var DriverModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
DriverModel.prototype.create = function (data) {
	if(data.fio && data.series && data.number && data.distribut && data.datedistribut){
	var model = new DriverModel(this.client);
	model.c_id = data.c_id || '0';
	model.fio = data.fio;
	model.series = data.series;
	model.number = data.number;
	model.distribut = data.distribut;
	model.datedistribut = data.datedistribut;
	model.phones = data.phones || '';
	model.note = data.note || '';
	model.dateupdate = my_sys.dateSave();
	model.isCreate = true;
    return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
DriverModel.prototype.exportmodel = function (data, driver_id) {
    var model = new Object;
	model.driver_id = driver_id;
	model.c_id = data[0];
	model.fio = data[1];
	model.series = data[2];
 	model.number = data[3];
	model.distribut = data[4];
	model.datedistribut = data[5];
	model.phones = data[6];
	model.note = data[7];
	model.dateupdate = data[8];
    return model;
};

// Возвращает имя ключа для driver:<driver_id>:
DriverModel.prototype.pDriver = function (driver_id) {
    return 'driver:'+driver_id+':';
};

// Возвращает имя поля для c_id:
DriverModel.prototype.kCustomer_id = function () {
    return 'c_id:';
};

// Возвращает имя поля для fio:
DriverModel.prototype.kFIO = function () {
    return 'fio:';
};

// Возвращает имя поля для series:
DriverModel.prototype.kSeries = function () {
    return 'series:';
};

// Возвращает имя поля для distribut:
DriverModel.prototype.kDistribut = function () {
    return 'distribut:';
};

// Возвращает имя поля для datedistribut:
DriverModel.prototype.kDateDistribut = function () {
    return 'datedistribut:';
};

// Возвращает имя поля для phones:
DriverModel.prototype.kPhones = function () {
    return 'phones:';
};

// Возвращает имя поля для number:
DriverModel.prototype.kNumber = function () {
    return 'number:';
};

// Возвращает имя поля для note:
DriverModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dateupdate:
DriverModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
};

// Возвращает имя ключа для customers:driver:driver_id:
DriverModel.prototype.pListDrivers = function () {
    return 'customers:driver:driver_id:';
};

// Возвращает имя ключа для customer:<c_id>:driver:
DriverModel.prototype.pListCusomerDrivers = function (c_id) {
    return 'customer:'+c_id+':driver:';
};

// Возвращает имя поля для global:lastContactID:
DriverModel.prototype.pLastID = function () {
    return 'global:lastContactID::';
};

// инкремент c_id
function lastID(callback) {
	this.client.incr(this.pLastID, function(err, result) {
	if (err) callback ('Ошибка инкремента!');
	else callback(null, result);
	});
};

// проверка наличия модели
function isCreateTrue (callback){
	if (this.isCreate) callback(null, 'Модель существует!');
	else callback('Модель должна быть создана перед сохранением!');
}

// проверка существования водителя с таким id
function findSave (id, callback){
	this.client.hexists(this.pDriver(id), this.kCustomer_id(), function (err, result) {
		if(err || result === 0) callback('Такой контакт не существует.');
		else callback(null, result);
	});
}

// Основная функция выполняющая сохранение
function saveRedis(id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pDriver(id), this.kCustomer_id(), this.c_id, this.kFIO(), this.fio, this.kSeries(), this.series, this.kPhones(), this.phones, this.kDistribut(), this.distribut, 
	this.kDateDistribut(), this.datedistribut, this.kNumber(), this.number, this.kNote(), this.note, this.kDateupdate(), this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pListDrivers(), id],
	['sadd', this.pListCusomerDrivers(this.c_id),id]
	]).exec(function (err, result) {
		if (err) callback('Ошибка сохранения: '+err);
		else callback(null, id);
	});
};

//DriverModel.save();
DriverModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		lastID: ['isCreateTrue', function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveRedis.call(thism, results.lastID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// запрос к Redis и возврат результата в виде модели
function selectRedis (id, callback){
	var thism = this;
	var q = [this.pDriver(id), this.kCustomer_id(), this.kFIO(), this.kSeries(), this.kNumber(), this.kDistribut(), this.kDateDistribut(),this.kPhones(), this.kNote(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) callback('Ошибка в запросе к Redis');
		else {
				var result = thism.exportmodel(repl, id);
				if(repl[0] === '0') callback(null, result);
				else {	
					сustomers = new Сustomers(thism.client);
					сustomers.findByCustomerID(repl[0], function(err, res) {
						result.customer = res;
						callback(null, result);
					});
				}
			} 
	});
}

// DriverModel.findByContactID
DriverModel.prototype.findByDriverID = function (id, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			findSave.call(thism, id, callback);
		},
		function(arg, callback){
			selectRedis.call(thism, id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// Функция возврата c_id по driver_id
function getCID(id, callback) {
	this.client.hmget(this.pDriver(id), this.kCustomer_id(), function(err, repl) {
   	 if (err || repl === null) callback('Такого водителя не существует.');
		else callback(null, repl[0]);
	});
};

// DriverModel.remove
DriverModel.prototype.remove = function (id, callback) {
	var thism = this;
	async.waterfall([
		function (callback){
			getCID.call(thism, id, callback);
		},
		function (c_id, callback){
			thism.client.multi([
			['del',  thism.pDriver(id)],
			['srem', thism.pListDrivers(), id],
			['srem', thism.pListCusomerDrivers(c_id), id]
			]).exec(function (err, repl) {
				if (err) callback('Ошибка в запросе к Redis - remove');
				else callback(null, c_id+' - удалён из БД');
			});
		}
	],
	function(err, result){
		if(err) callback(err);
		else callback(null, result);
	});
};

// DriverModel.update
DriverModel.prototype.update = function (con_id, callback) {
	var thism = this;
	async.series([
		function (callback){
			isCreateTrue.call(thism, callback);
		},
		function (callback){
			saveRedis.call(thism, con_id, callback);
		}
	],
	function(err, result){
		if(err) callback(err);
		else callback(null, result);
	});
};

// DriverModel.findCustomerDriver
DriverModel.prototype.findCustomerDriver = function (c_id, callback) {
	this.client.smembers(this.pListCusomerDrivers(c_id), function(err, result) {
		if (err) callback('Ошибка выборки водителей по заказчику');
		else {
			this.findDriversList(result, function (error, res) {
				if(error) callback(null, 'Не найден спиcок');
				else {callback(null, res);}
			});	
		}
	}.bind(this));
};

// DriverModel.findListDriver 
DriverModel.prototype.findListDriver = function (callback) {
	this.client.smembers(this.pListDrivers(), function(err, result) {
		if (err) callback('Ошибка выборки всех водителей');
		else {
			this.findDriversList(result, function (error, res) {
				if(error) callback(null, 'Не найден спиcок');
				else {callback(null, res);}
			});	
		}
	}.bind(this));
};

// DriverModel.findDriverList
DriverModel.prototype.findDriversList = function (arr, callback) {
	var args = [];
	var thism = this;
    async.forEach(arr, function(id, callback){
        selectRedis.call(thism, id, function(err, result) {
			if (err) callback(err);
			else {
					args.push(result);
					callback();
				};
		});
    }, function(err){
        if (err) callback('Ошибка загрузки всех контактов - '+err);
		else callback(null, args);
    });
};