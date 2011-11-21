//customers-main.js

var my_sys = require('../lib/my_sys');
var process = require('events');
var sys = require('util');
var universal_sql = require('../models/universal_sql');
var	redis = require('redis');
var client = redis.createClient();
var bank = require('./bankbik');


/**
 * общая таблица - с запросами к таблицам customers;
 *
 */
 

var CustomerSQL = module.exports =  function () {	
	process.EventEmitter.call(this);
};

sys.inherits(CustomerSQL, process.EventEmitter);

CustomerSQL.prototype.SelectMain = function () {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var forma_sob = [];
	var list_customers = [];
	var countSQL = 0;
	var self = this;
	
	uSQL.SQL("SELECT * FROM forma_sob", 'forma_sob'); 
	
	uSQL.SQL("SELECT customers_u.ID, customers_u.NAME, customers_u.INN, customers_u.PHONES, customers_u.FORMA_SOB, customers_u.FAX, customers_u.WWW, customers_u.EMAIL, users.NAME UNAME, customers_u.TYPE, forma_sob.NAME NAME_SOB, DATE_FORMAT(customers_u.UPDATE_DATE,'%d.%m.%Y %T') UPDATE_DATE FROM customers_u, forma_sob, users WHERE customers_u.FORMA_SOB = forma_sob.ID AND customers_u.MANAGER = users.ID", 'list_customers');
	
	uSQL.on('result_sql', function(name, result){
		if(name === 'forma_sob') {forma_sob = result; countSQL++;}
		if(name === 'list_customers') {list_customers = result; countSQL++;}
		if(countSQL === 2) self.emit('finished', forma_sob, list_customers); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.New_Customer = function (array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	if(array_table[1].value != 0) uSQL.SQL("SELECT NAME FROM customers_u WHERE INN = '"+array_table[2].value+"'", 'select_customers_u');
	else uSQL.SQL("SELECT NAME FROM customers_u WHERE INN = '1111111111' AND NAME = '"+array_table[0].value+"'", 'select_fcustomers_u');
		
		
	uSQL.on('result_sql', function(name, result){
		if(name === 'select_customers_u' && result!="") self.emit('error', 'Пользователь с таким ИНН уже существует - '+result[0].NAME);
		if(name === 'select_customers_u' && result == "") uSQL.SQL(InsertSQLStr('customers_u',array_table, table_active), 'insert_customer');
		if(name === 'select_fcustomers_u' && result!="") self.emit('error', 'Пользователь с таким именем уже существует - '+result[0].NAME);
		if(name === 'select_fcustomers_u' && result == "") uSQL.SQL(InsertSQLStr('customers_u',array_table, table_active), 'insert_customer');
		if(name === 'insert_customer') uSQL.SQL("SELECT customers_u.ID, DATE_FORMAT(customers_u.UPDATE_DATE,'%d.%m.%Y %T') UPDATE_DATE FROM customers_u, forma_sob WHERE customers_u.INN = '"+array_table[2].value+"' AND customers_u.NAME = '"+array_table[0].value+"'", 'id_customer_save');
		if(name === 'id_customer_save') self.emit('save_new_customer_ok', result[0]); 
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

function InsertSQLStr (nametable, array_table, table_active) {
	var field = '('+array_table[0].name;
	var value = '(\''+array_table[0].value;
	for (var i=1; i<table_active.length;i++)
		if(table_active[i]===1){
			field = field+', '+array_table[i].name;
			value = value+'\', \''+array_table[i].value;
		}
	var date_update = my_sys.DateSave();
	field = field+', UPDATE_DATE)';
	value = value+'\', \''+date_update+'\');';
	var result = 'INSERT INTO '+nametable+' '+field+' VALUES '+value;
	return result;
}

function UpdateSQLStr (id, nametable, array_table) {
	var str = array_table[0].name+' = \''+array_table[0].value+'\'';
	for (var i=1; i<array_table.length;i++){
			str = str +', '+array_table[i].name+' = \''+array_table[i].value+'\'';
		}
	var date_update = my_sys.DateSave();
	str = str +', UPDATE_DATE = \''+date_update+'\'';
	var result = 'UPDATE '+nametable+' SET '+str+' WHERE ID = \''+id+'\';';
	return result;
}


CustomerSQL.prototype.UpdateMainCustomer = function (nametable, id, array_table) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	uSQL.SQL(UpdateSQLStr(id, nametable, array_table), nametable);
		
		
	uSQL.on('result_sql', function(name, result){
		 self.emit('update_ok'); 
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};


CustomerSQL.prototype.SelectCustomer = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;

	uSQL.SQL("SELECT customers_u.*, forma_sob.NAME NAME_SOB, users.NAME UNAME, customers_u.MANAGER UID, DATE_FORMAT(customers_u.UPDATE_DATE,'%d.%m.%Y %T') UPDATE_DATE  FROM customers_u, forma_sob, users WHERE customers_u.ID = "+id+" AND customers_u.FORMA_SOB = forma_sob.ID AND customers_u.MANAGER = users.ID", 'result_customer');
	
	uSQL.on('result_sql', function(name, result){
		if(result.length != 0) self.emit('finished', result, 'SelectCustomer'); 
		else self.emit('noresult'); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.SelectCustomerMin = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	
	uSQL.SQL("SELECT customers_u.NAME NAME, forma_sob.NAME NAME_SOB FROM customers_u, forma_sob WHERE customers_u.ID = "+id+" AND customers_u.FORMA_SOB = forma_sob.ID", 'result_customer');
	
	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result[0], 'SelectCustomerMin_Ok'); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.ListCustomer = function () {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	
	uSQL.SQL("SELECT customers_u.ID ID, customers_u.NAME NAME, forma_sob.NAME NAME_SOB FROM customers_u, forma_sob WHERE customers_u.INN != '1111111111' AND customers_u.FORMA_SOB = forma_sob.ID", 'result_customer');
	
	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result, 'SelectCustomer'); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.SelectEdit = function (table_name, field, id, resnull) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	
	uSQL.SQL("SELECT "+table_name+".*, customers_u.MANAGER UID FROM customers_u ,"+table_name+" WHERE customers_u.ID = "+table_name+".CUSTOMER_ID AND "+table_name+"."+field+" = "+id, table_name);
	
	uSQL.on('result_sql', function(name, result){
		if(resnull === 1) {
			if(result.length != 0) self.emit('finished', result, table_name); 
			else self.emit('noresult'); 
		} else self.emit('finished', result, table_name);
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.SelectFormaSob = function () {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	
	uSQL.SQL("SELECT * FROM forma_sob", 'result_forma_sob');
	
	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result, 'SelectFormaSob'); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

CustomerSQL.prototype.New_Address = function (table_name, array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value, 'select_customers_address');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_customers_address' && result!="") self.emit('error', 'У данного заказчика уже есть адрес, обновите страницу!');
		if(name === 'select_customers_address' && result == "") uSQL.SQL(InsertSQLStr(table_name, array_table, table_active), 'insert_customers_address');
		if(name === 'insert_customers_address') self.emit('save_new_customers_u_address_ok');
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

CustomerSQL.prototype.New_Contact = function (table_name, array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value+" AND FIO = '"+array_table[0].value+"'", 'select_customers_contact');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_customers_contact' && result!="") self.emit('error', 'Пользователь с такой ФИО у данного заказчика существует!');
		if(name === 'select_customers_contact' && result == "") uSQL.SQL(InsertSQLStr(table_name, array_table, table_active), 'insert_customers_contact');
		if(name === 'insert_customers_contact') uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value+" AND FIO = '"+array_table[0].value+"'", 'select_contact');
		if(name === 'select_contact') self.emit('save_new_customers_contact_ok', result);
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

CustomerSQL.prototype.New_BankBik = function (table_name, array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value+" AND BIK = '"+array_table[0].value+"' AND RS = '"+array_table[1].value+"'", 'select_customers_bank');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_customers_bank' && result!="") self.emit('error', 'Пользователь с таким р/с у данного заказчика существует!');
		if(name === 'select_customers_bank' && result == "") uSQL.SQL(InsertSQLStr(table_name, array_table, table_active), 'insert_customers_bank');
		if(name === 'insert_customers_bank') uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value+" AND BIK = '"+array_table[0].value+"' AND RS = '"+array_table[1].value+"'", 'select_bank');
		if(name === 'select_bank') self.emit('save_new_customers_bank_ok', result);
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

CustomerSQL.prototype.Select_Bank = function (table_name, array_table) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT ID FROM "+table_name+" WHERE CUSTOMER_ID = "+array_table[array_table.length-1].value+" AND BIK = '"+array_table[0].value+"' AND RS = '"+array_table[1].value+"'", 'select_customers_bank');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_customers_bank' && result!="") self.emit('error', 'Пользователь с таким р/с у данного заказчика существует!');
		if(name === 'select_customers_bank' && result == "") self.emit('select_bank');
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

CustomerSQL.prototype.SelectListContact = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT * FROM customers_contact WHERE CUSTOMER_ID= "+id, 'select_list_contact');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_list_contact') self.emit('finished', result, 'SelectContact');
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

CustomerSQL.prototype.SelectListBank = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	var list_bank = [];
	var sum = 0;
	var contrsum = 0;
	
	uSQL.SQL("SELECT * FROM customers_bank WHERE CUSTOMER_ID= "+id, 'select_list_bank');

	uSQL.on('result_sql', function(name, result){
		if(name === 'select_list_bank'){ 
			sum = result.length;
			if(result.length===0) self.emit('finished', list_bank, 'SelectListBank');
			else 
			for (var i=0;i<result.length;i++){
				list_bank[i] = {id: result[i].ID, bik: result[i].BIK, rs: result[i].RS};
				self.findbankbik(result[i].BIK, i); 
			}
		}
	});
	
	self.on('findbankbik_ok', function (res, no){
		contrsum++;
		list_bank[no].bankname = res.name;
		list_bank[no].ks = res.ks;
		if(contrsum === sum) self.emit('finished', list_bank, 'SelectListBank');
	});
	
	self.on('error', function (res, no){
		contrsum++;
		list_bank[no].bankname = "нет";
		list_bank[no].ks = "нет";
		if(contrsum === sum) self.emit('finished', list_bank, 'SelectListBank');
	});
	
};

CustomerSQL.prototype.findbankbik =	function (bik, no) {
			var self = this;
			var bankbik = new bank (client);
			bankbik.findByBankBik(bik, function (err, res, callback) {
				 if (err) {
					self.emit('error', ''+err, no);
				 } else if (res) {
					self.emit('findbankbik_ok', res, no); 
				 };
			});	
};
