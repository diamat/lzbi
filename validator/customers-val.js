//customers-val.js

var process = require('events');
var check = require('validator').check;
var sys = require('util');


/**
 * скрипты валидации таблиц customers
 *
*/

var CustomersVal = module.exports = function () {
	
	process.EventEmitter.call(this);
};

sys.inherits(CustomersVal, process.EventEmitter);

CustomersVal.prototype.CustomersU = function (array_val, table_active) {
	var self = this;
	try {
		if(table_active[1] === 1) check(array_val[1].value, 'Поле "Форма собственности" не соответсвует типу').len(1,2).isNumeric(); 
		if(table_active[2] === 1) check(array_val[2].value, 'Поле "ИНН" не соответсвует типу').len(10,10).isNumeric(); 
		if(table_active[3] === 1) check(array_val[3].value, 'Поле "TYPE" не соответсвует типу').len(1,1).isInt();
		if(table_active[4] === 1) check(array_val[4].value, 'Поле "KPP" не соответсвует типу').len(9,9).isNumeric(); 
		if(table_active[5] === 1) check(array_val[5].value, 'Поле "OGRN" не соответсвует типу').len(13,13).isNumeric();  
		if(table_active[6] === 1) check(array_val[6].value, 'Поле "OKPO" не соответсвует типу').len(8,8).isNumeric(); 
		if(table_active[7] === 1) check(array_val[7].value, 'Поле "PHONES" не соответсвует типу').regex(/(\d{3}-\d{4})/); 
		if(table_active[8] === 1) check(array_val[8].value, 'Поле "FAX" не соответсвует типу').regex(/(\d{3}-\d{4})/); 
		if(table_active[10] === 1) check(array_val[10].value, 'Поле "EMAIL" не соответсвует типу').isEmail();
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};


CustomersVal.prototype.CustomersBik = function (array_val) {
	var self = this;
	try {
		check(array_val[0].value, 'Поле "БИК" не соответсвует типу').len(9,9).isNumeric(); 
		check(array_val[1].value, 'Поле "р/с" не соответсвует типу').len(20,20).isNumeric(); 
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};

CustomersVal.prototype.CustomersUAddress = function (array_val) {
	var self = this;
	try {
		check(array_val[0].value, 'Поле "Индекс" не соответсвует типу').len(6,6).isNumeric(); 
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};

CustomersVal.prototype.idInt = function (id) {
	var self = this;
	try {
		check(id).isInt();
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};

CustomersVal.prototype.empty = function () {
	var self = this;
	setTimeout(function() {
		self.emit('valid_OK');
	}, 10);
};