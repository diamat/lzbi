//contact.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var Сustomers = require('./customers');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * con_id - id контакта
 *
 * (set)  customers:contact:con_id: <con_id>
 * (set)  customer:<c_id>:contacts: <con_id>
 * (string) global:lastContactID: <con_id> - счетчик id контакта
 *
 * (hashes) contact:<con_id>: {
 *		c_id: <c_id>
 *		fio: <ФИО>
 *		position: <должность>
 *		phones: <телефоны>
 *		email: <e-mail>
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
 
 // Модель ContactModel
var ContactModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
ContactModel.prototype.create = function (data) {
	if(data.c_id && data.fio){
	var model = new ContactModel(this.client);
	model.c_id = data.c_id;
	model.fio = data.fio;
	model.position = data.position || '';
	model.phones = data.phones || '';
	model.email = data.email || '';
	model.note = data.note || '';
	model.dateupdate = my_sys.dateSave();
	model.isCreate = true;
    return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
ContactModel.prototype.exportmodel = function (data, con_id) {
    var model = new Object;
	model.con_id = con_id;
	model.c_id = data[0];
	model.fio = data[1];
	model.position = data[2];
	model.phones = data[3];
	model.email = data[4];
	model.note = data[5];
	model.dateupdate = data[6];
    return model;
};

// Возвращает имя ключа для contact:<con_id>:
ContactModel.prototype.pContact = function (con_id) {
    return 'contact:'+con_id+':';
};

// Возвращает имя поля для c_id:
ContactModel.prototype.kCustomer_id = function () {
    return 'c_id:';
};

// Возвращает имя поля для fio:
ContactModel.prototype.kFIO = function () {
    return 'fio:';
};

// Возвращает имя поля для position:
ContactModel.prototype.kPosition = function () {
    return 'position:';
};

// Возвращает имя поля для phones:
ContactModel.prototype.kPhones = function () {
    return 'phones:';
};

// Возвращает имя поля для email:
ContactModel.prototype.kEmail = function () {
    return 'email:';
};

// Возвращает имя поля для note:
ContactModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dateupdate:
ContactModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
};

// Возвращает имя ключа для customers:contact:con_id:
ContactModel.prototype.pListContacts = function () {
    return 'customers:contact:con_id:';
};

// Возвращает имя ключа для customer:<c_id>:contact:
ContactModel.prototype.pListCusomerContacts = function (c_id) {
    return 'customer:'+c_id+':contacts:';
};

// Возвращает имя поля для global:lastContactID:
ContactModel.prototype.pLastID = function () {
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

// проверка существования контакта с таким con_id
function findSave (con_id, callback){
	this.client.hexists(this.pContact(con_id), this.kCustomer_id(), function (err, result) {
		if(err || result === 0) callback('Такой контакт не существует.');
		else callback(null, result);
	});
}

// Основная функция выполняющая сохранение
function saveRedis(con_id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pContact(con_id), this.kCustomer_id(), this.c_id, this.kFIO(), this.fio, this.kPosition(), this.position, this.kPhones(), this.phones, this.kEmail(), this.email, this.kNote(), this.note, this.kDateupdate(), this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pListContacts(), con_id],
	['sadd', this.pListCusomerContacts(this.c_id), con_id]
	]).exec(function (err, result) {
		if (err) callback('Ошибка сохранения: '+err);
		else callback(null, con_id);
	});
};

//ContactModel.save();
ContactModel.prototype.save = function (callback) {
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
function selectRedis (con_id, callback){
	var thism = this;
	var q = [this.pContact(con_id), this.kCustomer_id(), this.kFIO(), this.kPosition(), this.kPhones(), this.kEmail(), this.kNote(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) callback('Ошибка в запросе к Redis')
		else {
				var result = thism.exportmodel(repl, con_id);
				callback(null, result);
			} 
	});
}

// ContactModel.findByContactID
ContactModel.prototype.findByContactID = function (id, callback) {
	var thism = this;
	var res;
	сustomers = new Сustomers(this.client);
	async.waterfall([
        function (callback){
			findSave.call(thism, id, callback);
		},
		function(arg, callback){
			selectRedis.call(thism, id, callback);
		},
		function(contact, callback){
			res = contact;
			сustomers.findByCustomerID(contact.c_id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else {
			res.u_id = result.u_id;
			callback(null, res);
		}
    });
};

// Функция возврата c_id по con_id
function getCID(con_id, callback) {
	this.client.hmget(this.pContact(con_id), this.kCustomer_id(), function(err, repl) {
   	 if (err || repl === null) callback('Такого контакта не существует.');
		else callback(null, repl[0]);
	});
};

// ContactModel.remove
ContactModel.prototype.remove = function (con_id, callback) {
	var thism = this;
	async.waterfall([
		function (callback){
			getCID.call(thism, con_id, callback);
		},
		function (c_id, callback){
			thism.client.multi([
			['del',  thism.pContact(con_id)],
			['srem', thism.pListContacts(), con_id],
			['srem', thism.pListCusomerContacts(c_id), con_id]
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

// ContactModel.update
ContactModel.prototype.update = function (con_id, callback) {
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

// ContactModel.findCustomerContacts
ContactModel.prototype.findCustomerContacts = function (c_id, callback) {
	thism = this;
	this.client.smembers(this.pListCusomerContacts(c_id), function(err, result) {
		if (err) callback('Ошибка выборки контактов заказчкиа');
		else {
			thism.findContactsList(result, function (error, res) {
				if(error) callback(null, 'Не найден спсиок');
				else {callback(null, res);}
			});	
		}
	});
};

// ContactModel.findListContacts
ContactModel.prototype.findListContacts = function (callback) {
	this.client.smembers(this.pListContacts(), function(err, result) {
		if (err) callback('Ошибка выборки всех контактов');
		else callback(null, result);
	});
};

// ContactModel.findCustomerContacts
ContactModel.prototype.findContactsList = function (arr, callback) {
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