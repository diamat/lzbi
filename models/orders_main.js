//orders-main.js

var my_sys = require('../lib/my_sys');
var process = require('events');
var sys = require('util');
var universal_sql = require('../models/universal_sql');
var	redis = require('redis');
var client = redis.createClient();
var bank = require('./bankbik');


/**
 * общая таблица - с запросами к таблицам orders;
 *
 */
 

var OrderSQL = module.exports =  function () {	
	process.EventEmitter.call(this);
};

sys.inherits(OrderSQL, process.EventEmitter);

OrderSQL.prototype.SelectMain = function (id, access, edit_id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var list_customers = [];
	var list_orders = [];
	var countSQL = 0;
	var self = this;
	
	if(access === 0) uSQL.SQL("SELECT customers_u.ID, customers_u.INN, customers_u.NAME, forma_sob.NAME NAME_SOB FROM customers_u, forma_sob WHERE customers_u.FORMA_SOB !=0 AND customers_u.FORMA_SOB = forma_sob.ID AND customers_u.TYPE != 1", 'list_customers'); 
	else uSQL.SQL("SELECT customers_u.ID, customers_u.INN, customers_u.NAME, forma_sob.NAME NAME_SOB FROM customers_u, forma_sob WHERE customers_u.MANAGER = "+id+" AND customers_u.FORMA_SOB !=0 AND customers_u.FORMA_SOB = forma_sob.ID AND customers_u.TYPE != 1", 'list_customers');
	
	if(edit_id) uSQL.SQL("SELECT orders.*, customers_u.ID C_ID, customers_u.INN, customers_u.MANAGER UID, customers_u.NAME, forma_sob.NAME NAME_SOB, DATE_FORMAT(orders.DATE,'%d.%m.%Y') DATE FROM orders, customers_u, forma_sob WHERE orders.ID = "+edit_id+" AND orders.CUSTOMER_ID = customers_u.ID AND customers_u.FORMA_SOB = forma_sob.ID", 'list_orders');
	else if(access === 0) uSQL.SQL("SELECT orders.*, customers_u.ID C_ID, customers_u.INN, customers_u.NAME, forma_sob.NAME NAME_SOB, DATE_FORMAT(orders.DATE,'%d.%m.%Y') DATE FROM orders, customers_u, forma_sob WHERE orders.CUSTOMER_ID = customers_u.ID AND customers_u.FORMA_SOB = forma_sob.ID", 'list_orders');
	else uSQL.SQL("SELECT orders.*, customers_u.ID C_ID, customers_u.INN, customers_u.NAME, forma_sob.NAME NAME_SOB, DATE_FORMAT(orders.DATE,'%d.%m.%Y') DATE FROM orders, customers_u, forma_sob WHERE customers_u.MANAGER = "+id+" AND orders.CUSTOMER_ID = customers_u.ID AND customers_u.FORMA_SOB = forma_sob.ID", 'list_orders');
	
	uSQL.on('result_sql', function(name, result){
		if(name === 'list_customers') {list_customers = result; countSQL++;}
		if(name === 'list_orders') {list_orders = result; countSQL++;}
		if(countSQL === 2) { 
			if(edit_id) {
				if(list_orders.length != 0) self.emit('finished', list_customers, list_orders, 'SelectMain');
				else self.emit('noresult'); 
			} else self.emit('finished', list_customers, list_orders, 'SelectMain');
		}
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

OrderSQL.prototype.SelectOrder = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT orders.*,  DATE_FORMAT(orders.DATE,'%d.%m.%Y') DATE, customers_u.NAME CNAME, forma_sob.NAME NAME_SOB, customers_u.FORMA_SOB, customers_u.MANAGER UID FROM orders, customers_u, forma_sob WHERE orders.ID = '"+id+"' AND orders.CUSTOMER_ID = customers_u.ID AND customers_u.FORMA_SOB = forma_sob.ID", 'SelectOrder');
	
	uSQL.on('result_sql', function(name, result){
		if(result.length != 0) self.emit('finished', result[0], 'SelectOrder'); 
		else self.emit('noresult'); 
	});
	
	uSQL.on('error', function(error){
		console.log(error.message);
		self.emit('error', error.message);
	});
	
};

OrderSQL.prototype.SelectSubOrder = function (id, nameselect) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT suborders.*, customers_u.ID CUSTOMER_ID, customers_u.NAME CNAME, forma_sob.NAME NAME_SOB, DATE_FORMAT(suborders.DATE,'%d.%m.%Y') SODATE, customers_u.MANAGER UID FROM orders, customers_u, suborders, forma_sob WHERE suborders.ID = '"+id+"' AND orders.ID = suborders.ORDER_ID AND orders.CUSTOMER_ID = customers_u.ID AND customers_u.FORMA_SOB = forma_sob.ID", 'SelectSubOrder');
	
	uSQL.on('result_sql', function(name, result){
		if(result.length != 0) {
			if(nameselect === 'edit') self.emit('finished', 0, result, 'SelectSubOrder'); 
			else self.emit('finished', result[0], 'SelectSubOrder'); 
		}
		else self.emit('noresult'); 
	});
	
	uSQL.on('error', function(error){
		console.log(error.message);
		self.emit('error', error.message);
	});
	
};

OrderSQL.prototype.SelectListSubOrder = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT DATE_FORMAT(suborders.DATE,'%d.%m.%Y') SDATE, suborders.* FROM suborders WHERE ORDER_ID = '"+id+"'", 'SelectListSubOrder');
	
	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result, 'SelectListSubOrder'); 
	});
	
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
	
};

OrderSQL.prototype.New_Order = function (array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT ID FROM orders WHERE NAMEORDERS = '"+array_table[1].value+"' AND CUSTOMER_ID = '"+array_table[0].value+"'", 'select_order');
		
		
	uSQL.on('result_sql', function(name, result){
		if(name === 'select_order' && result!="") self.emit('error', 'Договор с таким "названием" у данного заказчика уже существует - '+result[0].NAME);
		if(name === 'select_order' && result == "") uSQL.SQL(InsertSQLStr('orders',array_table, table_active), 'insert_order');
		if(name === 'insert_order') uSQL.SQL("SELECT ID FROM orders WHERE NAMEORDERS = '"+array_table[1].value+"' AND CUSTOMER_ID = '"+array_table[0].value+"'", 'id_order_save');
		if(name === 'id_order_save') self.emit('save_new_order_ok', result[0]); 
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

OrderSQL.prototype.New_SubOrder = function (array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT MAX(SUBNO) NO FROM suborders WHERE ORDER_ID = '"+array_table[array_table.length-1].value+"'", 'select_suborder');
	
	var buf;
		
	uSQL.on('result_sql', function(name, result){
		if(name === 'select_suborder' && result[0].NO != null) {buf = {name:'SUBNO', value : result[0].NO+1 }; array_table[array_table.length] = buf; table_active[table_active.length] = 1; uSQL.SQL(InsertSQLStr('suborders', array_table, table_active), 'insert_suborder');}
		if(name === 'select_suborder' && result[0].NO == null) {buf = {name:'SUBNO', value : '1'}; array_table[array_table.length] = buf; table_active[table_active.length] = 1; uSQL.SQL(InsertSQLStr('suborders',array_table, table_active), 'insert_suborder');}
		if(name === 'insert_suborder') uSQL.SQL("SELECT ID, SUBNO FROM suborders WHERE SUBNO = '"+buf.value+"' AND ORDER_ID = '"+array_table[array_table.length-2].value+"'", 'id_suborder_save');
		if(name === 'id_suborder_save') self.emit('save_new_suborder_ok', result[0]); 
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

function InsertSQLStr (nametable, array_table, table_active) {
	var field = '('+array_table[0].name;
	var value = '(\''+array_table[0].value;
	var i_date = 0;
	for (var i=1; i<table_active.length;i++)
		if(table_active[i]===1){
			field = field+', '+array_table[i].name;
			if(array_table[i].name === 'DATE') {value = value+"\', STR_TO_DATE(\'"+array_table[i].value+"\', \'%d.%m.%Y\')"; i_date = 1;}
			else { 
			if(i_date == 1) {value = value+', \''+array_table[i].value; i_date = 0;}
			else value = value+'\', \''+array_table[i].value;
			}
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
			if(array_table[i].name === 'DATE') {str = str +", "+array_table[i].name+" = STR_TO_DATE(\'"+array_table[i].value+"\', \'%d.%m.%Y\')";}
			else { 
			str = str +', '+array_table[i].name+' = \''+array_table[i].value+'\'';
			}
		}
	var date_update = my_sys.DateSave();
	str = str +', UPDATE_DATE = \''+date_update+'\'';
	var result = 'UPDATE '+nametable+' SET '+str+' WHERE ID = \''+id+'\';';
	return result;
}

OrderSQL.prototype.UpdateMainOrder = function (nametable, id, array_table) {
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

OrderSQL.prototype.findbankbik = function (bik, no) {
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
