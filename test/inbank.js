//bills.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var Customers = require('./customers');
var Customerbank = require('./customerbank');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * ib_id - id платежного поручения (п/п)
 * bill_id - id счета
 * rs - расчётный счет
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastIBID: <ib_id> - счетчик id п/п
 * (string) in_bank:lastDate: <date> - дата последней 
 * (string) in_bank:no:<no>:date:<date>:sum:<sum>:  - строка для проверки уникальности п/п
 * (set) in_bank:<ib_id>:bill_id: <bill_id>  - список счетов связанных с этим п/п
 * (set) rs:<rs>:ib_id: <ib_id>  - список п/п переведённых с данного р/с
 * (set) c_id:<c_id>:ib_id: <ib_id>  - список п/п данного заказчика
 * (string) in_bank:<ib_id>:bill_id:<bill_id>:sum: <sum> - сумма по п/п по данному счету.
 * (zset) in_bank:zset:date:ib_id: <date> <ib_id> - упорядоченный список п/п, дата явялется оценкой.
 *
 *
 * (hashes) in_bank:<ib_id>:main: {
 *		no: <номер п/п>
 *		c_id: <статус заявки>
 *		rs: <р/с>
 *		sum: <сумма счета>
 *		date: <дата>
 *		pop: <назначения платежа>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * create(data) - содание модели счет;
 * save() - сохранение ранее созданой модели;
 * 
 */
 

 // Модель InBankModel
var InBankModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
InBankModel.prototype.create = function (data) {
	if(data.no ||  data.rs || data.sum || data.date || data.pop || data.inn || data.bik){
		var model = new InBankModel(this.client);
		model.no = data.no;
		model.rs = data.rs;
		model.sum = data.sum;
		model.date = data.date;
		model.pop = data.pop;
		model.inn = data.inn;
		model.bik = data.bik;
		model.dateupdate = my_sys.dateSave();
		model.isCreate = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
InBankModel.prototype.exportmodel = function (data, ib_id) {
    var expmodel = new Object;
	expmodel.ib_id = ib_id;
	expmodel.no = data[0];
	expmodel.c_id = data[1];
	expmodel.rs = data[2];
	expmodel.sum = data[3];
	expmodel.date = data[4];
	expmodel.formatdate = my_sys.formatDate(data[4]);
	expmodel.pop = data[5];
	expmodel.dateupdate = data[6];
    return expmodel;
};



// Возвращает имя ключа для global:lastIBID:: 
InBankModel.prototype.pLastID = function () {
    return 'global:lastIBID:';
};

// Возвращает имя поля для in_bank:lastDate:
InBankModel.prototype.pLastDate = function () {
    return 'in_bank:lastDate:';
};

// Возвращает имя поля для in_bank:no:<no>:date:<date>:sum:<sum>:
InBankModel.prototype.pInBankNDS = function (no, date, sum) {
    return 'in_bank:no:'+no+':date:'+date+':sum:'+sum+':';
};

// Возвращает имя поля для in_bank:<ib_id>:bill_id:
InBankModel.prototype.pInBankAll = function (ib_id) {
    return 'in_bank:'+ib_id+':bill_id:';
};

// Возвращает имя поля для rs:<rs>:ib_id:
InBankModel.prototype.pRSID = function (rs) {
    return 'rs:'+rs+':ib_id:';
};

// Возвращает имя поля для c_id:<c_id>:ib_id:
InBankModel.prototype.pCID = function (c_id) {
    return 'c_id:'+c_id+':ib_id:';
};

// Возвращает имя поля для in_bank:<ib_id>:bill_id:<bill_id>:sum:
InBankModel.prototype.pBillSum = function (ib_id, bill_id) {
    return 'in_bank:'+ib_id+':bill_id:'+bill_id+':sum:';
};

// Возвращает имя поля для in_bank:zset:date:ib_id:
InBankModel.prototype.pListDate= function () {
    return 'in_bank:zset:date:ib_id:';
};

// Возвращает имя поля для in_bank:<ib_id>:main:
InBankModel.prototype.pMain= function (ib_id) {
    return 'in_bank:'+ib_id+':main:';
};

  // Возвращает имя поля для no:
InBankModel.prototype.kNo = function () {
    return 'no:';
}; 

  // Возвращает имя поля для sum:
InBankModel.prototype.kSum = function () {
    return 'sum:';
}; 

  // Возвращает имя поля для c_id:
InBankModel.prototype.kCID = function () {
    return 'c_id:';
}; 
 
 // Возвращает имя поля для rs:
InBankModel.prototype.kRS = function () {
    return 'rs:';
}; 
 
// Возвращает имя поля для date:
InBankModel.prototype.kDate = function () {
    return 'date:';
}; 
 
// Возвращает имя поля для accept:
InBankModel.prototype.kAccept = function () {
    return 'accept:';
}; 

// Возвращает имя поля для pop:
InBankModel.prototype.kPop = function () {
    return 'pop:';
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

// проверка сущестования п/п под таким номером, датой и суммой
function findPP(callback) {
	this.client.exists(this.pInBankNDS(this.no, this.date, this.sum), function(err, result) {
   	if (err || result === 1) {
			if(err) callback('Ошибка в findPP ');
			else callback('П/п с таким номером/датой/суммой');
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

// проверка соответсвия rs bik и inn
function findCID (callback){
	var сustomers = new Сustomers(this.client);
	var сustomerbank = new Customerbank (this.client);
	var c_id1;
	var c_id2;
	var thism = this;
	async.parallel([
		function(callback){
			сustomerbank.findCustomer(thism.rs, function (err, res) {
				if(err) {c_id1 = 0; callback();}
				else {c_id1 = res; callback();}
			});	
		},
		function(callback){
			сustomers.findByCustomerINN(thism.inn, function (err, res) {
				if(err) {c_id2 = 0; callback();}
				else {c_id2 = res; callback();}
			})	
		}
		],
		function(err, results){
			if(err) callback('Ошибка findRS - '+err);
			else {
				if(c_id2 === 0){
					callback('Компании с таким ИНН не существует в БД');
				} else if (c_id1 ===0){
					customerbank.add(c_id2, thism.bik, thism.rs, function (err, res) {
						if(err) callback(err);
						else {
							callback(null, c_id2);
							}
						});
				}
			}
		});
}


//CustomerModel.save();
InBankModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		findPPfalse: function (callback){
			findfindPP.call(thism, callback);
		},
		findCID: ['findPPfalse', 'isCreateTrue', function(callback, results){
			findCID.call(thism, callback);
		}],
		lastID: ['findCID', function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveModel.call(thism, results.lastID, results.findCID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// Основная функция выполняющая сохранение
function saveModel(ib_id, c_id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pMain(ib_id), this.kNo(), this.no, this.kCID(), c_id, this.kRS(), this.rs, this.kSum(), this.sum, this.kDate(), this.date, this.kPop(), this.pop, this.kDateupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['set', this.pInBankNDS(this.no, this.date, this.sum), '1'],
	['sadd', this.pCID(c_id), ib_id],
	['sadd', this.pRSID(this.rs), ib_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, ib_id);
			};
	});
};

