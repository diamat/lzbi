//spravprod.js

var my_sys = require('../lib/my_sys');
var sprav = require('../lib/sprav');
var async = require('async');

/**
 * 
 * Обозночение сокращений:
 * prod_sid - id из справочника продуктов;
 *
 * (string) global:sprav:prod: <prod_sid> - счетчик prod_sid;
 * (set)  sprav:prod: <prod_sid>
 * (set)  sprav:prod:<group>: <prod_sid>
 * (string)  sprav:prod:<prod_sid>:c_id:<c_id>:number: - количество единиц на пооддоне
 *
 * (hashes) prod:<prod_sid>: {
 *		name: <название продукта>
 * 		unit: <еденицы измерения>
 * 		group: <группа продукции>
 *		dateupdate: <дата(время) редактирования>
 * }
 * 
 * save(name) - сохранение продукции;
 * remove(prod_sid) - удаление продукта по prod_sid;
 * findList () - список справочной продукции;
 * saveNumber(c_id, prod_sid, number) - сохранения количества продукции на поддоне данного поставщика;
 * findNumber(c_id, prod_sid) - определения кол-ва на поддоне;
 */
 
 // Модель ContactModel
var SpravProdModel = module.exports =  function (client) {
    this.client = client;
};

// Возвращает имя ключа для sprav:prod: <prod_sid>
SpravProdModel.prototype.pLastID = function () {
    return 'global:sprav:prod:';
};

// Возвращает имя ключа для sprav:prod:<group>: <prod_sid>
SpravProdModel.prototype.pGroupList = function (group) {
    return ' sprav:prod:'+group+':';
};

// Возвращает имя ключа для sprav:prod:<prod_sid>:c_id:<c_id>:number:
SpravProdModel.prototype.pNumberPID = function (prod_sid, c_id) {
    return 'sprav:prod:'+prod_sid+':c_id:'+c_id+':number:';
};

// Возвращает имя ключа для sprav:prod: <prod_sid>
SpravProdModel.prototype.pListProd = function () {
    return 'sprav:prod:';
};

// Возвращает имя поля для prod:<prod_sid>:
SpravProdModel.prototype.pProdSID = function (prod_sid) {
    return 'prod:'+prod_sid+':';
};

 // Возвращает имя ключа для name:
SpravProdModel.prototype.kName = function () {
    return 'name:';
};

 // Возвращает имя ключа для name:
SpravProdModel.prototype.kUnit = function () {
    return 'unit:';
};

 // Возвращает имя ключа для name:
SpravProdModel.prototype.kGroup = function () {
    return 'group:';
};

 // Возвращает имя ключа для dateupdate:
SpravProdModel.prototype.kDateupdate = function () {
    return 'dateupdate:';
};

// Функция для форматированной отправки данных exportmodel
SpravProdModel.prototype.exportmodel = function (data, id) {
    var expmodel = new Object;
	expmodel.prod_sid = id;
	expmodel.name = data[0];
	expmodel.unit = data[1];
	var unitarr = sprav.spravUnit;
	for(var i=0;i<unitarr.length;i++) 
	if(unitarr[i].id === data[1]){expmodel.unitname = unitarr[i].name; break;}
	expmodel.group = data[2];
	var grouparr = sprav.spravProdGroup;
	for(var i=0;i<grouparr.length;i++) 
	if(grouparr[i].id === data[2]){expmodel.groupname = grouparr[i].name; break;}
	expmodel.dateupdate = data[3];
    return expmodel;
};

SpravProdModel.prototype.removeRS = function(arr, callback) {
	var thism = this;
	async.forEach(arr, function(i, callback){
					thism.client.hmget(thism.pProdSID(i), thism.kUnit, thism.kGroup, function(err, repl) {
							if (err) callback();
							else {
							if(repl[0]!= null){
								var unit = repl[0];
								var group = repl[1];
								console.log(thism.pProdSID(i)+' pProdSID('+i+')');
								thism.client.hmset(thism.pProdSID(i), thism.kUnit(), unit, thism.kGroup(), group, function(err, res) {
									if (err) {
												callback(null,null)
										} else {
											console.log('unit - '+unit);
											console.log('Сохранил unit- '+unit);
										}			
								});
							}
							callback();
							}
						});
				}, function(err){
					if (err) callback('Ошибка загрузки п/п - '+err);
					else callback(null, null);
				});

}

// Основная функция выполняющая сохранение
function saveRedis(prod_sid, name, unit, group, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pProdSID(prod_sid), this.kName(), name, this.kUnit(), unit,  this.kGroup(), group, this.kDateupdate(), my_sys.dateSave()];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pListProd(), prod_sid],
	['sadd', this.pGroupList(group), prod_sid]
	]).exec(function (err, result) {
		if (err) callback('Ошибка сохранения: '+err);
		else callback(null, prod_sid);
	});
};

// инкремент c_id
function lastID(callback) {
	this.client.incr(this.pLastID, function(err, result) {
	if (err) callback ('Ошибка инкремента!');
	else callback(null, result);
	});
};

// SpravProdModel.save
SpravProdModel.prototype.save = function (name, unit, group, callback) {
	var thism = this;
	async.auto({
		lastID: function(callback, results){
			lastID.call(thism, callback);
		},
		saveInRedis: ['lastID', function(callback, results){
			saveRedis.call(thism, results.lastID, name, unit, group, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// SpravProdModel.saveNumber
SpravProdModel.prototype.saveNumber = function (c_id, prod_sid, number, callback) {
	this.client.set(this.pNumberPID(prod_sid, c_id), number, function(err, result) {
		if (err) callback('Ошибка сохранения');
		else {
			callback(null, 'Данные сохранены.')
		}
	});	
};

// SpravProdModel.saveNumber
SpravProdModel.prototype.findNumber = function (c_id, prod_sid, callback) {
	this.client.get(this.pNumberPID(prod_sid, c_id), function(err, result) {
		if (err) callback('Ошибка поиска findNumber');
		else {
			callback(null, result)
		}
	});	
};

// SpravProdModel.update
SpravProdModel.prototype.update = function (prod_sid, name, unit, group, callback) {
	var thism = this;
	async.series({
		saveInRedis: function(callback, results){
			saveRedis.call(thism, prod_sid, name, unit, group, callback);
		}
	},
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// SpravProdModel.findList
SpravProdModel.prototype.findList = function (callback) {
	var args = [];
	var thism = this;
	this.client.smembers(this.pListProd(), function(err, result) {
		if (err) callback('Ошибка выборки справочной продукции');
		else {
			async.forEach(result, function(id, callback){
				selectRedis.call(thism, id, function(err, result) {
					if (err) callback(err);
					else {
							args.push(result);
							callback();
						};
				});
			}, function(err){
				if (err) callback('Ошибка загрузки всех контактов - '+err);
				else callback(null, args);
			});
		}
	}.bind(this));
};

// SpravProdModel.findByProdSID
SpravProdModel.prototype.findByProdSID = function (prod_sid, callback) {
	selectRedis.call(this, prod_sid, function(err, result) {
			if (err) callback(err);
			else {
				callback(null, result);
			};
		})
};


// запрос к Redis и возврат результата в виде модели
function selectRedis (prod_sid, callback){
	var thism = this;
	var q = [this.pProdSID(prod_sid), this.kName(), this.kUnit(), this.kGroup(), this.kDateupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) callback('Ошибка в запросе к Redis')
		else {
				var result = thism.exportmodel(repl, prod_sid);
				callback(null, result);
			} 
	});
}

// SpravProdModel.remove
SpravProdModel.prototype.remove = function (prod_sid, callback) {
	this.client.multi([
			['del',  thism.pProdSID(prod_sid)],
			['srem', thism.pListProd(), prod_sid]
			]).exec(function (err, repl) {
				if (err) callback('Ошибка в запросе к Redis - remove');
				else callback(null, prod_sid+' - удалён из БД');
			});
	
};