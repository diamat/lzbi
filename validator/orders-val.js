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
	console.log(array_val);
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

OrdersVal.prototype.empty = function () {
	var self = this;
	setTimeout(function() {
		self.emit('valid_OK');
	}, 10);
};