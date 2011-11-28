//my_sys.js
var mysql = require('mysql');
var crypto = require('crypto');
var client = mysql.createClient({
  user: 'semen',
  password: '768185',
});


exports.DateSave = function  () {
	var date_update = new Date();
	var mes = date_update.getMonth()+1;
	var format_date = date_update.getFullYear()+'-'+mes+'-'+date_update.getDate()+' '+date_update.getHours()+':'+date_update.getMinutes()+':'+date_update.getSeconds();
	return(format_date);
}

exports.DateNorm = function  () {
	var date_update = new Date();
	var mes = date_update.getMonth()+1;
	var format_date = date_update.getDate()+'.'+mes+'.'+date_update.getFullYear();
	return(format_date);
}

exports.addslashes = function (str) {
			return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
		}

exports.getHash = function (msg, key) {
	return crypto.createHmac('sha256', key).update(msg).digest('hex');
};

exports.client_mysql = function () {
	client.query('USE lzbi'); 
	return(client);
};