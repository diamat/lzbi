//address.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var Сustomers = require('./customers');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * type - тип 
 * 
 * Структура представлена в бд в виде:
 *
 * (hashes) customer:<c_id>:u_address: {
 *		index: <индекс>
 *		city: <название компании>
 *		street: <КПП>
 *		house: <ОГРН>
 *		office: <ОКПО>
 *		note: <примечание>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * (hashes) customer:<c_id>:f_address: {
 *		index: <индекс>
 *		city: <название компании>
 *		street: <КПП>
 *		house: <ОГРН>
 *		office: <ОКПО>
 *		note: <примечание>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * create(data) - содание модели основной;
 * update (c_id, type) - обновление адреса;
 * save() - сохранение ранее созданой модели;
 * remove(c_id, type) - удаление адреса;
 * findFAddress - поиск фактического адресса по c_id;
 * findUAddress - поиск юридического адресса по c_id;
 * 
 */
 
 // Модель AddressModel
var AddressModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
AddressModel.prototype.create = function (data) {
	if(data.city && data.street){
	var model = new AddressModel(this.client);
	model.index = data.index || '';
	model.city = data.city;
	model.street = data.street;
	model.house = data.house || '';
	model.office = data.office || '';
	model.note = data.note || '';
	model.dateupdate = my_sys.dateSave();
	model.isCreate = true;
    return model;
	} else {
		return 'Не все параметры заданы для создания модели';
	}
};

// Функция для форматированной отправки данных
AddressModel.prototype.exportmodel = function (data) {
    var model = new Object;
	model.index = data[0];
	model.city = data[1];
	model.street = data[2];
	model.house = data[3];
	model.office = data[4];
	model.note = data[5];
	model.dateupdate = data[6];
    return model;
};

// Возвращает имя ключа для customer:<c_id>:u_address:
AddressModel.prototype.pUAddress = function (c_id) {
    return 'customer:'+c_id+':u_address:';
};
// Возвращает имя ключа для customer:<c_id>:f_address:
AddressModel.prototype.pFAddress = function (c_id) {
    return 'customer:'+c_id+':f_address:';
};

// Возвращает имя поля для index:
AddressModel.prototype.kIndex = function () {
    return 'index:';
};

// Возвращает имя поля для city:
AddressModel.prototype.kCity = function () {
    return 'city:';
};

// Возвращает имя поля для street:
AddressModel.prototype.kStreet = function () {
    return 'street:';
};

// Возвращает имя поля для house:
AddressModel.prototype.kHouse = function () {
    return 'house:';
};

// Возвращает имя поля для office:
AddressModel.prototype.kOffice = function () {
    return 'office:';
};

// Возвращает имя поля для note:
AddressModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dateupdate:
AddressModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
};

// проверка наличия модели
function isCreateTrue (callback){
	if (this.isCreate) callback(null, 'Модель существует!');
	else callback('Модель должна быть создана перед сохранением!');
}

// проверка существования адреса по c_id
function findSave (c_id, type, callback){
	var q = this.pUAddress(c_id);
	if(type === 'f') q = this.pFAddress(c_id);
	this.client.hexists(q, this.kCity(), function (err, result) {
		if(err || result === 0) callback('Такой адрес не существует.');
		else callback(null, result);
	});
}

// Основная функция выполняющая сохранение
function saveRedis(c_id, type, callback) {
	var qp = this.pUAddress(c_id);
	if(type === 'f') qp = this.pFAddress(c_id);
	// Формируем хеш запрос 
	var q = ['hmset', qp, this.kCity(), this.city, this.kStreet(), this.street, this.kIndex(), this.index, this.kHouse(), 
	this.house, this.kOffice(), this.office, this.kNote(), this.note, this.kDateupdate(), this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([q
	]).exec(function (err, result) {
		if (err) callback('Ошибка сохранения: '+err);
		else callback(null, 'Сохранил');
	});
};

//AddressModel.save();
AddressModel.prototype.save = function (c_id, type, callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		saveInRedis: ['isCreateTrue', function(callback, results){
			saveRedis.call(thism, c_id, type, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};
	
// запрос к Redis и возврат результата в виде модели
function selectRedis (c_id, type, callback){
	var thism = this;
	var qp = this.pUAddress(c_id);
	if(type === 'f') qp = this.pFAddress(c_id);
	var q = [qp, this.kIndex(), this.kCity(), this.kStreet(), this.kHouse(), this.kOffice(), this.kNote(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) callback('Ошибка в запросе к Redis')
		else {
				var result = thism.exportmodel(repl, c_id);
				callback(null, result);
			} 
	});
}

// AddressModel.findUAddress
AddressModel.prototype.findUAddress = function (id, callback) {
	var thism = this;
	сustomers = new Сustomers(this.client);
	async.series([
        function (callback){
			findSave.call(thism, id, 'u', callback);
		},
		function(callback){
			selectRedis.call(thism, id, 'u', callback);
		},
		function(callback){
			сustomers.findByCustomerID(id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else {
			results[1].u_id = results[2].u_id;
			callback(null, results[1]);
		}
    });
};

// AddressModel.findFAddress
AddressModel.prototype.findFAddress = function (id, callback) {
	var thism = this;
	сustomers = new Сustomers(this.client);
	async.series([
        function (callback){
			findSave.call(thism, id, 'f', callback);
		},
		function(callback){
			selectRedis.call(thism, id, 'f', callback);
		},
		function(callback){
			сustomers.findByCustomerID(id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else {
			results[1].u_id = results[2].u_id;
			callback(null, results[1]);
		}
    });
};

// AddressModel.update
AddressModel.prototype.update = function (c_id, type, callback) {
	var thism = this;
	async.series([
		function (callback){
				isCreateTrue.call(thism, callback);
		},
		function (callback){
				saveRedis.call(thism, c_id, type, callback);
		}
	],
	function(err, result){
		if(err) callback(err);
		else callback(null, result);
	});
};

// AddressModel.remove
AddressModel.prototype.remove = function (c_id, type, callback) {
	var q;
	if(type === 'u') q = ['del',  this.pUAddress(c_id), this.pUAddress(c_id)];
	else q = ['del',  this.pFAddress(c_id), this.pFAddress(c_id)];
	this.client.multi([
		q]
		).exec(function (err, repl) {
		if (err) callback('Ошибка в запросе к Redis - remove');
		else callback(null, 'Адреса заказчика '+c_id+' - удалены из БД');
		});
};