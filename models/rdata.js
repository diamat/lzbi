//rdata.js

var my_sys = require('../lib/my_sys');
var process = require('events');
var sys = require('util');
var universal_sql = require('../models/universal_sql');

var RDataSQL = module.exports =  function () {	
	process.EventEmitter.call(this);
};

sys.inherits(RDataSQL, process.EventEmitter);

RDataSQL.prototype.SelectMain = function (nametable) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT *, DATE_FORMAT("+nametable+".UPDATE_DATE,'%d.%m.%Y %T') UPDATE_DATE FROM "+nametable, 'list_main'); 

	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result);
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

RDataSQL.prototype.SelectProd = function (id) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	
	uSQL.SQL("SELECT * FROM products WHERE ID ="+id, 'select_id'); 

	uSQL.on('result_sql', function(name, result){
		self.emit('finished', result);
	});	
	
	uSQL.on('error', function(error){
		console.log(error.message);
	});	
};

RDataSQL.prototype.New_Prod = function (array_table, table_active) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;

	uSQL.SQL(InsertSQLStr('products',array_table, table_active), 'insert_product');
	
	uSQL.on('result_sql', function(name, result){
		if(name === 'insert_product') uSQL.SQL("SELECT ID FROM products WHERE NAME = '"+array_table[0].value+"' AND UNIT = '"+array_table[1].value+"'", 'id_prod_save');
		if(name === 'id_prod_save') self.emit('save_new_prod_ok', result[0]); 
	});
		
	uSQL.on('error', function(error){
		self.emit('error', error.message);
	});
};

RDataSQL.prototype.UpdateRData = function (nametable, id, array_table) {
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
