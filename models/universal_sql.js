//univeral_sql.js

var my_sys = require('../lib/my_sys');
var process = require('events');
var sys = require('util');

/**
 * nametable - название таблицы;
 * obj[i].field - название поля;
 * obj[i].value - значение поля;
 * i - количество полей;
 *
 * Методы:
 * insert(namedb, obj) - первичное сохранение;
 * update(id, namedb, obj) -  обновление;
 * SQL(sql) - выполнения SQL-запроса.
 */
 
  // Модель CustomerContact
var UniversalSQL = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
	
	process.EventEmitter.call(this);
};

sys.inherits(UniversalSQL, process.EventEmitter);

function InsertSQLStr (nametable, obj) {
	var field = '('+obj[0].field;
	var value = '('+obj[0].value;
	for (var i=1; i<obj.length;i++){
		field = field+', '+obj[i].field;
		value = value+', '+obj[i].value;
	}
	var date_update = my_sys.DateSave();
	field = field+', UPDATE_DATE)';
	value = value+', \''+date_update+'\');';
	var result = 'INSERT INTO '+nametable+' '+field+' VALUES '+value;
	return result;
}

function SelectSQLStr (nametable, obj) {
	var str = obj[0].field+' = \''+obj[0].value+'\'';
	for (var i=1; i<obj.length;i++){
		str = str +' AND '+obj[i].field+' = '+obj[i].value;
	}
	var result = 'SELECT * FROM '+nametable+' WHERE '+str+';';
	console.log(result);
	return result;
}

function UpdateSQLStr (id, nametable, obj) {
	var str = obj[0].field+' = \''+obj[0].value+'\'';
	for (var i=1; i<obj.length;i++){
		str = str +', '+obj[i].field+' = '+obj[i].value;
	}
	var result = 'UPDATE '+nametable+' SET '+str+' WHERE ID = \''+id+'\';';
	console.log(result);
	return result;
}

// функция insert
UniversalSQL.prototype.insert = function (nametable, obj, callback) {
	if (arguments.length == 3){
		this.check(nametable, obj, function(err, res){
			 if(res<1){
				this.client.query(InsertSQLStr(nametable, obj), function(error, result){
					// Если возникла ошибка выбрасываем исключение
					if (error)callback.call(this, new Error('Ошибка сохранения: '+error), null, this);
					else callback.call(this, null, result, this);
				});
			}
			else callback.call(this, new Error('Такая запись уже есть. Повторное сохранение невозможно. '), null, this);
		});
	}
	else {
		throw new Error ('Функция UniversalSQL.insert должна содержать 3 аргумента, а содержит '+arguments.length+'.');
	}
}

//проверка совпадения строк
UniversalSQL.prototype.check = function (nametable, obj, callback) {
	this.client.query(SelectSQLStr(nametable, obj), function(error, result){
			// Если возникла ошибка выбрасываем исключение
			if (error){
				if (callback) callback.call(this, new Error('Ошибка проверки совпадения записей: '+error), null, this);
			}
			else {
			 if (callback) callback.call(this, null, result.length, this);
			 }
		}.bind(this));
}

// функция update
UniversalSQL.prototype.update = function (id, nametable, obj, callback) {
	if (arguments.length == 4){
		var date_update = my_sys.DateSave();
		this.client.query(UpdateSQLStr (id, nametable, obj), function(error, result){
			// Если возникла ошибка выбрасываем исключение
			if (error){
				callback.call(this, new Error('Ошибка сохранения: '+error), null, this);
			}
			else callback.call(this, null, result, this);
		});
	}
	else {
		throw new Error ('Функция UniversalSQL.update должна содержать 4 аргумента, а содержит '+arguments.length+'.');
	}
}

UniversalSQL.prototype.SQL = function (sql, name, callback) {
		var self = this;
		this.client.query(sql, function(error, result){
			if (error){
				if (callback) callback.call(this, new Error('Ошибка запроса: '+error), null, this);
				else self.emit('error', error);
			}
			else {
			 if (callback) callback.call(this, null, result, this);
			 else  self.emit('result_sql', name, result);
			 }
		});
}

