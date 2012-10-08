//orders-val.js

var form = require('form');

/**
 * скрипты валидации таблиц orders
 *
*/
var formval = [];

//formOrder
formval[0] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isNumeric, 'C_ID заказчика не является числом')
	],
	name: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Название договора не указано'),
		form.validator(form.Validator.len, 1, 200, 'Число знаков "название договора" превышает 200 символов')
	],
	date: [
		form.validator(form.Validator.notEmpty, 'Дата закючения договора не указанна!'),
		form.validator(form.Validator.isNumeric, 'Дата закючения договора не является числом')
	]
};

//formSubOrder
formval[1] = {
	o_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'O_ID не указан'),
		form.validator(form.Validator.isNumeric, 'O_ID заказчика не является числом')
	],
	name: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Название приложения не указано'),
		form.validator(form.Validator.len, 1, 200, 'Число знаков "название приложения" превышает 200 символов')
	],
	date: [
		form.validator(form.Validator.notEmpty, 'Дата закючения приложения не указанна!'),
		form.validator(form.Validator.isNumeric, 'Дата закючения приложения не является числом')
	]
};

//formSubOrderProd
formval[2] = {
	prod_sid: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'prod_sid не указан'),
		form.validator(form.Validator.isNumeric, 'prod_sid не является числом')
	],
	subo_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'subo_id не указан'),
		form.validator(form.Validator.isNumeric, 'subo_id не является числом')
	],
	price: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Цена не указан'),
		form.validator(form.Validator.isFloat, 'Цена не является Float (разделителем является точка)')
	],
	number: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Кол-во не указан'),
		form.validator(form.Validator.isFloat, 'Кол-во не является Float (разделителем является точка)')
	]
	
};


formval[3] = {
	price: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.isFloat, 'Цена не является Float (разделителем является точка)')
	],
	number: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.isFloat, 'Кол-во не является Float (разделителем является точка)')
	]
	
};

//formBillMain
formval[4] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isNumeric, 'C_ID заказчика не является числом')
	],
	subo_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'SubO_ID не указан'),
		form.validator(form.Validator.isNumeric, 'SubO_ID заказчика не является числом')
	]
	
};


exports.validForm = function (data, id, callback) {
	var textForm = form.create(formval[id]);
	//console.log(data);
	var err = '';
	/*var buf = JSON.stringify(data);
	console.log(buf);
	buf = {'u_id':'2','inn':'135asf','forma_sob':'124'};
	console.log(buf);*/
	textForm.process(data, function(error, res) {
		if(error) {
			console.log(error);
			for (key in error) {
				err = err + ' ' + error[key]
			}
			console.log(err);
			callback (err);
		}
		else callback(null, 'Ok');
	});
}
