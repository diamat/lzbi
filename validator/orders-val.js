//customers-val.js

var process = require('events');
var check = require('validator').check;
var sys = require('util');


/**
 * скрипты валидации таблиц customers
 *
*/

var OrdersVal = module.exports = function () {
	
	process.EventEmitter.call(this);
};

sys.inherits(OrdersVal, process.EventEmitter);

OrdersVal.prototype.Orders = function (array_val, table_active) {
	var self = this;
	try {
		if(table_active[2] === 1) check(array_val[2].value, 'Поле "Тип договора" не соответсвует типу').len(1,1).isNumeric(); 
		if(table_active[4] === 1) check(array_val[4].value, 'Поле "Статус договора" не соответсвует типу').len(1,1).isNumeric(); 
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};

OrdersVal.prototype.SubOrdersProd = function (array_val, table_active) {
	var self = this;
	try {
		if(table_active[0] === 1) check(array_val[0].value, 'Поле "Продукция/услуги" не соответсвует типу').isFloat(); 
		if(table_active[2] === 1) check(array_val[2].value, 'Поле "Цена" не соответсвует типу').isFloat(); 
		if(table_active[3] === 1) check(array_val[3].value, 'Поле "Кол-во" не соответсвует типу').isFloat(); 
		if(table_active[4] === 1) check(array_val[4].value, 'Поле "Откат" не соответсвует типу').isFloat(); 
		setTimeout(function() {
			self.emit('valid_OK');
		}, 10);
	} catch (e) {
		setTimeout(function() {
			self.emit('valid_error',e.message);
		}, 10);
	}
};

OrdersVal.prototype.empty = function () {
	var self = this;
	setTimeout(function() {
		self.emit('valid_OK');
	}, 10);
};