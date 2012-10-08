//sprav_prod.js

var my_sys = require('../lib/my_sys');

/**
 * 
 * Обозночение сокращений:
 * prod_sid - id из справочника продуктов;
 *
 * (string) global:sprav:prod: <prod_sid> - счетчик prod_sid;
 * (set)  sprav:prod: <prod_sid>
 *
 * (hashes) prod:<prod_sid>: {
 *		name: <название продукта>
 * 		unit: <еденицы измерения>
 *		dataupdate: <дата(время) редактирования>
 * }
 * 
 * save(name) - сохранение продукции;
 * remove(prod_sid) - удаление продукта по prod_sid;
 * findList () - список справочной продукции;
 */
 
 // Модель ContactModel
var SpravProdModel = module.exports =  function (client) {
    this.client = client;
};

// Возвращает имя ключа для sprav:prod: <prod_sid>
SpravProdModel.prototype.pLastID = function () {
    return 'global:sprav:prod:';
};

// Возвращает имя ключа для sprav:prod: <prod_sid>
SpravProdModel.prototype.pListProd = function () {
    return 'sprav:prod:';
};

// Возвращает имя поля для prod:<prod_sid>:
SpravProdModel.prototype.pProdSID = function (prod_sid) {
    return 'prod:'+prod_sid;
};

 // Возвращает имя ключа для name:
SpravProdModel.prototype.kName = function () {
    return 'name:';
};

 // Возвращает имя ключа для name:
SpravProdModel.prototype.kUnit = function () {
    return 'unit:';
};

 // Возвращает имя ключа для dataupdate:
SpravProdModel.prototype.kDataupdate = function () {
    return 'dataupdate:';
};

// Основная функция выполняющая сохранение
function saveRedis(prod_sid, name, unit, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.ProdSID(prod_sid), this.kName(), name, this.kUnit, unit, this.kDataupdate(), my_sys.dateSave()];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pListProd(), prod_sid]
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
SpravProdModel.prototype.save = function (name, unit, callback) {
	var thism = this;
	async.auto({
		lastID: function(callback, results){
			lastID.call(thism, callback);
		},
		saveInRedis: ['lastID', function(callback, results){
			saveRedis.call(thism, results.lastID, name, unit, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// SpravProdModel.update
SpravProdModel.prototype.update = function (prod_sid, name, unit, callback) {
	var thism = this;
	async.series({
		saveInRedis: function(callback, results){
			saveRedis.call(thism, prod_sid, name, unit, callback);
		}
	},
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};
