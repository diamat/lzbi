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

OrderSQL.prototype.Select = function (nametable) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT *, DATE_FORMAT("+nametable+".UPDATE_DATE,'%d.%m.%Y %T') UPDATE_DATE FROM "+nametable, nametable); 

	uSQL.on('result_sql', function(name, result){
		if(result.length != 0) self.emit('finished', result, name);
		else self.emit('noresult'); 
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

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

OrderSQL.prototype.SelectSubOrderProd = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	var i=0;
	var list_prod = [];
	var data_mysql = [];
	var data_redis = [];
	
	uSQL.SQL("SELECT suborders_prod.*, customers_u.MANAGER UID FROM  suborders_prod, orders, suborders, customers_u WHERE suborders_prod.ID = '"+id+"' AND orders.ID = suborders.ORDER_ID AND suborders_prod.SUBORDER_ID = suborders.ID AND orders.CUSTOMER_ID = customers_u.ID", 'SelectSubOrderProd');
	uSQL.SQL("SELECT * FROM  products", 'products');
	self.FindSubordersProd(id);
	
	uSQL.on('result_sql', function(name, result){
		if(result.length != 0) {
			if(name === 'SelectSubOrderProd') {i++; data_mysql = result;}
			if(name === 'products') {i++; list_prod = result;}
			if(name === 'FindSubordersProd') {i++; data_redis = result;}
			if(i == 3){
				if(data_redis[0] === null ) data_redis[0] = 0;
				if(data_redis[1] === null ) data_redis[1] = 0;
				if(data_redis[2] === null ) data_redis[2] = 0;
				data_mysql[0].PRICE = data_redis[0];
				data_mysql[0].NUMERIC = data_redis[1];
				data_mysql[0].OTKAT = data_redis[2];
				self.emit('finished', list_prod, data_mysql); 
			}
		}
		else self.emit('noresult'); 
	});
	
	self.on('ok_FindSubordersProd', function(res){	
		uSQL.emit('result_sql', 'FindSubordersProd', res);
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

OrderSQL.prototype.SelectListSubOrderProd = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	uSQL.SQL("SELECT products.NAME, products.UNIT, DATE_FORMAT(suborders_prod.UPDATE_DATE,'%d.%m.%Y %T') UDATE, suborders_prod.* FROM suborders_prod, products WHERE suborders_prod.SUBORDER_ID = '"+id+"' AND products.ID = suborders_prod.PRODUCT_ID", 'SelectListSubOrderProd');
	
	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result, 'SelectListSubOrderProd'); 
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

OrderSQL.prototype.New_SubOrderProd = function (array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT MAX(SUBNO) NO FROM suborders_prod WHERE SUBORDER_ID = '"+array_table[array_table.length-1].value+"'", 'suborders_prod');
	
	var buf;
		
	uSQL.on('result_sql', function(name, result){
		if(name === 'suborders_prod' && result[0].NO != null) {buf = {name:'SUBNO', value : result[0].NO+1 }; array_table[array_table.length] = buf; table_active[table_active.length] = 1; uSQL.SQL(InsertSQLStr('suborders_prod', array_table, table_active), 'insert_suborders_prod');}
		if(name === 'suborders_prod' && result[0].NO == null) {buf = {name:'SUBNO', value : '1'}; array_table[array_table.length] = buf; table_active[table_active.length] = 1; uSQL.SQL(InsertSQLStr('suborders_prod',array_table, table_active), 'insert_suborders_prod');}
		if(name === 'insert_suborders_prod') uSQL.SQL("SELECT products.NAME, products.UNIT, suborders_prod.ID, suborders_prod.SUBNO FROM suborders_prod, products WHERE suborders_prod.SUBNO = '"+buf.value+"' AND suborders_prod.SUBORDER_ID = '"+array_table[array_table.length-2].value+"' AND products.ID = suborders_prod.PRODUCT_ID", 'id_suborders_prod_save');
		if(name === 'id_suborders_prod_save') {
		self.emit('save_new_suborders_prod_ok', result[0]); 
		if(!array_table[4].value) array_table[4].value = 0;
		var data = {suborder_id: array_table[5].value ,price: array_table[2].value, number: array_table[3].value, otkat: array_table[4].value};
		self.AddSubordersProd (result[0].ID, data);
		}
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

/**
 * Структура представлена в бд в виде:
 *
 * (set) suborder:prod:<suborder_id> <id>
 *
 * (hashes) suborderprod:<id> {
 *  price <data.price> - цена руб.
 * 	number <data.number> - кол-во
 * 	otkat <data.otkat> - откат руб.
 * }
 *
 * Методы:
 * AddSubordersProd(id, data) - добовление data.price - цена (руб.), data.number - кол-во, data.otkat - откат (руб.);
 * 
 */

OrderSQL.prototype.AddSubordersProd = function (id, data) {
		var self = this;
		var q = ['suborderprod:'+id, 'price', data.price, 'number', data.number, 'otkat', data.otkat];
		client.multi([
			['hmset', q],
			['sadd', 'suborder:prod:'+data.suborder_id, id]
			]).exec(function(err, res) {
			if (err) {
					self.emit('err_AddSubordersProd', err);
			} else {
					self.emit('ok_Add');
			};
		});
};

OrderSQL.prototype.Buff = function (id) {
		var self = this;
		self.FindSubordersProd (1);

		self.on('error', function(err) {
			self.emit('err_buff:'+err);
		});

		self.on('ok_FindSubordersProd', function(res) {
			self.emit('ok_Buff', res);
		});
};

OrderSQL.prototype.FindSubordersProd = function (id) {
		var self = this;
		var q = ['suborderprod:'+id, 'price', 'number', 'otkat'];
		client.hmget(q, function(err, res) {
			if (err) {
					self.emit('err_FindSubordersProd', err);
			} else {
					self.emit('ok_FindSubordersProd', res, id);
			};
		});
};

OrderSQL.prototype.FindSuborders = function (id, name) {
		var self = this;
		var data_i = 0;
		var data = new Object();
		client.smembers ('suborder:prod:'+id, function(err, res) {
			if (err) {
					if(name === 'finished') self.emit('noresult');
						else elf.emit('err_FindSuborders', data);
			} else {
					if(res != 0){
						data_i = res.length;
						for(var i=0;i<res.length;i++) {
							self.FindSubordersProd(res[i]);
						}
					}
					else {
						if(name === 'finished') self.emit('finished', data, 'FindSuborders');
						else elf.emit('ok_FindSuborders', data);
					}
			};	
		});
		
		self.on('ok_FindSubordersProd', function(res, id) {
			data_i--;
			data[''+id] = res;
			console.log('Вход: '+data);
			if(data_i===0) {
				if(name === 'finished') self.emit('finished', data, 'FindSuborders');
				else elf.emit('ok_FindSuborders', data);
			}
		});
		
		self.on('err_FindSubordersProd', function(err, id) {
			data_i--;
			elf.emit('noresult', err);
		});
};
