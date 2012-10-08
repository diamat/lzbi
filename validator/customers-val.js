//customers-val.js

var form = require('form');

/**
 * скрипты валидации таблиц customers
 *
*/
var formval = [];

//formCustomer
formval[0] = {
	u_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'ID пользователя не указан'),
		form.validator(form.Validator.isInt, 'ID пользователя не явялется целым числом')
	],
	inn: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле ИНН пустое'),
		form.validator(form.Validator.isNumeric, 'ИНН не явялется числом'),
		form.validator(form.Validator.len, 10, 12, 'Число знаков ИНН не соответствует типу (10-12)')
	],
	name: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Название компании не указано'),
		form.validator(form.Validator.len, 1, 300, 'Число знаков "название заказчика" превышает 300 символов')
	]
};

//formBank
formval[1] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isInt, 'C_ID заказчика не явялется целым числом')
	],
	bik: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле БИК пустое'),
		form.validator(form.Validator.isNumeric, 'БИК не явялется числом'),
		form.validator(form.Validator.len, 9, 9, 'Число знаков БИК не соответствует типу (9)')
	],
	rs: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Р/С не указано'),
		form.validator(form.Validator.len, 20, 20, 'Число знаков Р/С не соответствует типу (20)')
	]
};

//formContact
formval[2] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isInt, 'C_ID заказчика не явялется целым числом')
	],
	fio: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле ФИО пустое')
	]
};

//formAddress
formval[3] = {
	index: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Индекс не указан'),
		form.validator(form.Validator.isNumeric, 'Индекс не явялется числом'),
		form.validator(form.Validator.len, 6, 6, 'Число знаков Индекса не соответствует типу (6)')
	],
	city: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле "город" пустое пустое')
	],
	street: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле "улица" пустое пустое')
	]
};

//formProdNumber
formval[4] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isInt, 'C_ID заказчика не явялется целым числом')
	],
	prod_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле prod_id пустое пустое'),
		form.validator(form.Validator.isNumeric, 'C_ID заказчика не явялется числом')
	],
	number: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле "кол-во на поддоне" пустое.'),
		form.validator(form.Validator.isFloat, '"Кол-во на поддоне" не явялется float (разделитель точка)')
	]
};

//formProdNumber
formval[5] = {
	n_poddon: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Кол-во продукции на поддоне не указано'),
		form.validator(form.Validator.isNumeric, 'Кол-во продукции на поддоне не явялется числом')
	],
	number: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле "кол-во поддонов" пустое.'),
		form.validator(form.Validator.isInt, '"кол-во поддонов" не явялется целым числом')
	]
};
//formNewShipment
formval[6] = {
	c_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'C_ID не указан'),
		form.validator(form.Validator.isInt, 'C_ID заказчика не явялется целым числом')
	],
	bill_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'bill_id не указан'),
		form.validator(form.Validator.isInt, 'bill_id счета не явялется целым числом')
	],
	prod_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'prod_id не указан'),
		form.validator(form.Validator.isInt, 'prod_id не явялется целым числом')
	],
	p_id: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'p_id не указан'),
		form.validator(form.Validator.isInt, 'p_id поставщика не явялется целым числом')
	],
	number_p: [
		form.filter(form.Filter.trim),
		form.validator(form.Validator.notEmpty, 'Поле "кол-во поддонов" пустое.'),
		form.validator(form.Validator.isInt, '"кол-во поддонов" не явялется целым числом')
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
