//customers_u.js

var my_sys = require('../lib/my_sys');

/**
 * Структура представлена в бд в виде:
 * таблица: customers
 *
 * ID
 * INN - ИНН компании (первичный ключ);
 * FORMA_SOB - ID формы собствености (связана с таблицей FORMA_SOB)
 * NAME  - имя компании;
 * KPP - КПП компании;
 * OGRN - ОГРН компании;
 * OKPO - ОКПО компании;
 * PHONES - телефон компании;
 * EMAIL - e-mail фирмы;
 * WWW - адресс сайта;
 * NOTE - примечание;
 * UPDATE_DATE - дата сохранения;
 *
 * Методы:
 * create(INN, FORMA_SOB, NAME, KPP, OGRN, OKPO, PHONE) - содание модели;
 * save() - первичное сохранение;
 * update() -  обновление;
 * findByCustomer(sql) - выполнения SQL-запроса.
 */
 
  // Модель CustomerModel
var  CustomerModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
CustomerModel.prototype.create = function (INN, FORMA_SOB, NAME, KPP, OGRN, OKPO, PHONES, FAX, EMAIL, WWW, NOTE) {
    var customer = new CustomerModel (this.client);
    customer.inn = INN;
	customer.forma_sob = FORMA_SOB;
    customer.name = NAME;
	customer.kpp = KPP;
	customer.ogrn = OGRN;
	customer.okpo = OKPO;
	customer.phones = PHONES;
	customer.fax = FAX;
	customer.email = EMAIL;
	customer.www = WWW;
	customer.note = NOTE;
	customer.isCreate = true;
    return customer;
};

CustomerModel.prototype.save = function (callback) {
	if (this.isCreate){
		var date_update = my_sys.DateSave();
		this.client.query('USE lzbi; INSERT INTO customers_u (INN, FORMA_SOB, NAME, KPP, OGRN, OKPO, PHONES, FAX, EMAIL, WWW, NOTE, UPDATE_DATE) VALUES ('+this.inn+', '+this.forma_sob+', \''+this.name+'\', '+this.kpp+' , '+this.ogrn+', '+this.okpo+', \''+this.phones+'\', \''+this.fax+'\', \''+this.email+'\', \''+this.www+'\',\''+this.note+'\', \''+date_update+'\')', function(error, result){
			// Если возникла ошибка выбрасываем исключение
			if (error){
				if (callback) callback.call(this, new Error('Ошибка сохранения: '+error), null, this);
			}
			else {
			 if (callback) callback.call(this, null, result, this);
			 }
		});
	}
	else if (callback) callback.call(this, new Error('Модель не создана'), null, this);
}

CustomerModel.prototype.update = function (callback) {
	if (this.isCreate){
		var date_update = my_sys.DateSave();
		this.client.query('USE lzbi; UPDATE customers_u SET FORMA_SOB = \''+this.forma_sob+'\', NAME = \''+this.name+'\', KPP = \''+this.kpp+'\', OGRN = \''+this.ogrn+'\', OKPO = \''+this.okpo+'\', PHONES = \''+this.phones+'\', FAX = \''+this.fax+'\', EMAIL = \''+this.email+'\', WWW = \''+this.www+'\', NOTE = \''+this.note+'\', UPDATE_DATE =\''+date_update+'\' WHERE INN = \''+this.inn+'\';', function(error, result){
			// Если возникла ошибка выбрасываем исключение
			if (error){
				if (callback) callback.call(this, new Error('Ошибка сохранения: '+error), null, this);
			}
			else {
			 if (callback) callback.call(this, null, result, this);
			 }
		});
	}
	else if (callback) callback.call(this, new Error('Модель не создана'), null, this);
}

CustomerModel.prototype.findByCustomer = function (sql, callback) {
		this.client.query(sql, function(error, result){
			if (error){
				if (callback) callback.call(this, new Error('Ошибка запроса: '+error), null, this);
			}
			else {
			 if (callback) callback.call(this, null, result, this);
			 }
		});
}

