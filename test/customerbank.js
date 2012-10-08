//customerbank.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var async = require('async');
var bankBik = require('./bankbik');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * rs - расчётный счет
 * bik - БИК банка заказчика
 * 
 * Структура представлена в бд в виде:
 *
 * (set) customers:bank:bik: <bik>
 * (set) customers:bank:rs: <rs>
 * (set) customer:<c_id>:bank:bik: <bik>
 * (set) customer:<c_id>:bank:rs: <rs>
 * (set) customer:bik:<bik>:c_id: <c_id>
 * (string) customer:rs:<rs>:c_id: <c_id>
 * (set) customer:bik:<bik>:rs: <rs>
 * (string) customer:rs:<rs>:bik: <bik>
 *
 * Методы:
 * add(c_id, bik, rs) - добавление rs компании;
 * remove(rs) - удаление rs;
 * findCustomer(rs) - поиск заказчика по rs;
 * findByRS(c_id) - поиск массива [bik, rs] заказчика по c_id;
 * findByBik(bik) - поиск массива [c_id, rs] заказчика по bik;
 * ? - listBik() - список всех bik;
 * ? - listRS() - список всех rs;
 * 
 */
 
 
  // Модель  CustomerBankModel
var CustomerBankModel = module.exports =  function (client) {
    this.client = client;
};

 // Возвращает имя ключа для customers:bank:bik:
CustomerBankModel.prototype.pBankBik = function () {
    return 'customers:bank:bik:';
};

 // Возвращает имя ключа для customers:bank:rs:
CustomerBankModel.prototype.pBankRS = function () {
    return 'customers:bank:rs:';
};

 // Возвращает имя ключа для customer:<c_id>:bank:bik:
CustomerBankModel.prototype.pCBankBik = function (c_id) {
    return 'customer:'+c_id+':bank:bik:';
};

 // Возвращает имя ключа для customer:<c_id>:bank:rs:
CustomerBankModel.prototype.pCBankRS = function (c_id) {
    return 'customer:'+c_id+':bank:rs:';
};

 // Возвращает имя ключа дляcustomer:bik:<bik>:c_id:
CustomerBankModel.prototype.pBikСID = function (bik) {
    return 'customer:bik:'+bik+':c_id:';
};

 // Возвращает имя ключа для customer:bik:<bik>:rs:
CustomerBankModel.prototype.pBikRS = function (bik) {
    return 'customer:bik:'+bik+':rs:';
};

 // Возвращает имя ключа для customer:rs:<rs>:c_id:
CustomerBankModel.prototype.pRSCID = function (rs) {
    return 'customer:rs:'+rs+':c_id:';
};

 // Возвращает имя ключа для customer:rs:<rs>:bik:
CustomerBankModel.prototype.pRSBik = function (rs) {
    return 'customer:rs:'+rs+':bik:';
};

// проверка сущестования такого расчетный счет
function findRS(rs, callback) {
	this.client.exists(this.pRSCID(rs), function(err, result) {
   	if (err || result === 1) {
			if(err) callback('Ошибка в findRS');
			else callback('Такой расчетный счет уже существует');
		} else {	
				callback(null, result);
			};
	});
};

//CustomerBankModel.add(c_id, bik, rs);
CustomerBankModel.prototype.add = function (c_id, bik, rs, callback) {
	var thism = this;
	if(arguments.length === 4){
		async.auto({
			findRSfalse: function (callback){
				findRS.call(thism, rs, callback);
			},
			saveInRedis: ['findRSfalse', function(callback, results){
				saveCustomerBank.call(thism, c_id, bik, rs, callback);
			}]
		},
		function(err, results){
			if(err) callback(err);
			else callback(null, 'Bik add - OK!');
		});
	} 
	else callback('Неверное количество аргументов');
};

// Основная функция выполняющая сохранение
function saveCustomerBank(c_id, bik, rs, callback) {
	// Сохраняем все в один запрос
	this.client.multi([
	['sadd', this.pBankBik(), bik],
	['sadd', this.pBankRS(), rs],
	['sadd', this.pCBankBik(c_id), bik],
	['sadd', this.pCBankRS(c_id), rs],
	['sadd', this.pBikСID(bik), c_id],
	['sadd', this.pBikRS(bik), rs],
	['set', this.pRSCID(rs), c_id],
	['set', this.pRSBik(rs), bik]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, rs);
			};
	});
};

// Функция возврата bik по rs
function getBik(rs, callback) {
	this.client.get(this.pRSBik(rs), function(err, repl) {
   	if (err || repl === null) {
				callback('Такого расчетного счета не существует.');
		} else {	
				callback(null, repl);
			};
	});
};

// Функция возврата c_id по rs
function getCID(rs, bik, callback) {
	this.client.get(this.pRSCID(rs), function(err, repl) {
   	if (err || repl === null) {
				callback('Такого расчетного счета не существует.');
		} else {	
				callback(null, repl, bik);
			};
	});
};

// CustomerBankModel.remove
CustomerBankModel.prototype.remove = function (rs, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getBik.call(thism, rs, callback);
		},
		function (bik, callback){
			getCID.call(thism, rs, bik, callback);
		},
		function (c_id, bik, callback){
			thism.client.multi([
			['del',  thism.pRSBik(rs), thism.pRSCID(rs)],
			['srem', thism.pBankBik(), bik],
			['srem', thism.pBankRS(), rs],
			['srem', thism.pCBankBik(c_id), bik],
			['srem', thism.pCBankRS(c_id), rs],
			['srem', thism.pBikСID(bik), c_id],
			['srem', thism.pBikRS(bik), rs]
			]).exec(function (err, repl) {
				if (err) {
					callback('Ошибка в запросе к Redis - remove');
				} else {
					callback(null, rs+' - удалён из БД');
					};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
}; 

// CustomerBankModel.findCustomer
CustomerBankModel.prototype.findCustomer = function (rs, callback) {
	getCID.call(this, rs, 0, function(err, result) {
	if (err || result === null) {
				callback('Такого расчетного счета не существует.');
		} else {	
				callback(null, result[0]);
			};	
	});
};

// Функция возврата списка bik по c_id
function getBikCID(c_id, callback) {
	this.client.smembers(this.pCBankBik(c_id), function(err, repl) {
   	if (err || repl === null) {
				callback('Отсутствует список BIK у такого заказчика');
		} else {	
				callback(null, repl);
			};
	});
};

// Функция возврата списка rs по c_id
function getRSCID(c_id, callback) {
	this.client.smembers(this.pCBankRS(c_id), function(err, repl) {
   	if (err || repl === null) {
				callback('Отсутствует список RS у такого заказчика');
		} else {	
				callback(null, repl);
			};
	});
};

// Функция возврата массива bik по rs
function getArrBikRS(arr, callback) {
	var args = [];
	var thism = this;
	var bankbik = new bankBik(thism.client);
    async.forEach(arr, function(rs, callback){
        getBik.call(thism, rs, function(err, result) {
			if (err) callback(err);
			else {
					bankbik.findByBankBik(result, function(error, res){
						var buff = {};
						buff['rs'] = rs;
						buff['bik'] = result;
						if(error) {buff['name'] = 'Нет в БД!'; buff['ks'] = 'Нет в БД!'; args .push(buff); callback();}
						else {buff['name'] = res.name; buff['ks'] = res.ks; args.push(buff); callback();}
					});
				};
		});
    }, function(err){
        if (err) callback('Ошибка загрузки массива rs - '+err);
		else callback(null, args);
    });
};

// CustomerBankModel.findByRS
CustomerBankModel.prototype.findByRS = function (c_id, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getRSCID.call(thism, c_id, callback);
		},
		function (arr, callback){
			getArrBikRS.call(thism, arr, callback);
		}
	],
    function(err, list){
        if(err) callback(err);
		else callback(null, list);
    });
};

// Функция возврата списка rs по bik
function getRSBik(bik, callback) {
	this.client.smembers(this.pBikRS(bik), function(err, repl) {
   	if (err || repl === null) {
				callback('Отсутствует список RS по такому BIK');
		} else {	
				callback(null, repl);
			};
	});
};

// Функция возврата массива bik по rs
function getArrCIDRS(arr, callback) {
	var args = [];
	var args2 = [];
	var thism = this;
    async.forEach(arr, function(rs, callback){
        getCID.call(thism, rs, 0, function(err, result) {
			if (err) callback(err);
			else {
					args.push(result);
					args2.push(rs);
					callback();
				};
		});
    }, function(err){
        if (err) callback('Ошибка загрузки массива rs - '+err);
		else callback(null, args, args2);
    });
};

// CustomerBankModel.findByBik
CustomerBankModel.prototype.findByBik = function (bik, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getRSBik.call(thism, bik, callback);
		},
		function (arr, callback){
			getArrCIDRS.call(thism, arr, callback);
		}
	],
    function(err, c_id, rs){
        if(err) callback(err);
		else callback(null, c_id, rs);
    });
};