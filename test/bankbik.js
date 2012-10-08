//BankBik.js

var crypto = require('crypto');

/**
 * Структура представлена в бд в виде:
 *
 * (string) bank:bik:update:date: <id>
 *
 * (hashes) bank:bik {
 *  name:<bik>: <название банка>
 * 	ks:<bik>: <корсчет>
 * }
 *
 * Методы:
 * creat(bik, name, ks) - содание модели;
 * save() - сохранение ранее созданой модели;
 * remove() - удаление всего списка;
 * findByBankBik(bik) - поиск по БИКу.
 * 
 */
 
 // Модель BankBik
var  BankBikModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
BankBikModel.prototype.create = function (bik, name, ks) {
    var bankbik = {};
    bankbik.bik = bik;
	bankbik.name = name;
    bankbik.ks = ks;
	bankbik.isCreate = true;
    return bankbik;
};


// Возвращает имя поля для name:<bik>:
BankBikModel.prototype.kName = function (bik) {
    return 'name:'+bik+':';
};

// Возвращает имя поля для ks:<bik>:
BankBikModel.prototype.kKs = function (bik) {
    return 'ks:'+bik+':';
};

// Возвращает имя поля для bank:bik:update:date:
BankBikModel.prototype.kUpdate = function () {
    return 'bank:bik:update:date:';
};


//BankBikModel.save();
BankBikModel.prototype.save = function (callback) {
	// проверяем была ли создана модель через .create()
	if (this.isCreate) {
			this._save.call(this, callback);
	} else {
			if (callback) callback.call(this, new Error('Модель должна быть создана перед сохранением'), null, this);
		 };
};

 // Основная функция выполняющая сохранение
BankBikModel.prototype._save = function (callback) {
	// Сохраняем все в один запрос
	this.client.multi([
	['hmset', 'bank:bik', this.kName(this.bik), this.name, this.kKs(this.bik), this.ks]
	]).exec(function (err, repl) {
		if (err) {
				 if (callback) callback.call(this, err, null, this);
		} else {
				 if (callback) callback.call(this, null, repl, this);
			};
	}.bind(this));
};

// BankBikModel.findByBankBikl
BankBikModel.prototype.findByBankBik = function (bik, callback) {
	var thism = this;
	this.client.hexists('bank:bik', this.kName(bik), function (err, res) {
		if(err || res === 0) callback(new Error('Такого банка не существует'), null);
		else{
			// Конструрируем запрос
				var q = ['bank:bik', thism.kName(bik), thism.kKs(bik)];
				thism.client.hmget(q, function(err, repl) {
				if (err) {
					if (callback) callback(err, null);
				} else {
					var res = thism.create(bik, repl[0], repl[1]);
					callback(null, res);
				} 
			});
		}
	});

};

// BankBikModel.remove
BankBikModel.prototype.remove = function (callback) {
	this.client.multi([
	['del', 'bank:bik']
	]).exec(function (err, repl) {
	if (err) {
			if (callback) callback.call(this, err, null, this);
	} else {
			if (callback) callback.call(this, null, repl, this);
		};
	}.bind(this));
};
