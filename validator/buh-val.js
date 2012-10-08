//orders-val.js

var form = require('form');

/**
 * скрипты валидации таблиц orders
 *
*/
var formval = [];

//addBuh
formval[0] = {
	ib_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'ib_id не указан'),
		form.validator(form.Validator.isNumeric, 'ib_id заказчика не является числом')
	],
	bill_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'bill_id не указан'),
		form.validator(form.Validator.isNumeric, 'bill_id заказчика не является числом')
	],
	sum: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Сумма не указан'),
		form.validator(form.Validator.isFloat, 'Сумма не является Float (разделителем является точка)')
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
