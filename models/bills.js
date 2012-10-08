//bills.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var sprav = require('../lib/sprav');
var async = require('async');
var Orders = require('./orders');
var INBANK = require('./inbank');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * bill_id - id счета
 * subo_id - id приложения;
 * prod_id - id товара в приложения;
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastBillID: <bill_id> - счетчик id счета
 * (set) bills:bill_id: <bill_id>  - список счетов
 * (set) bills:subo_id:<subo_id>: <bill_id> - список счетов по id приложения
 * (set) bills:c_id:<c_id>: <bill_id> - список счетов по c_id
 * (set) bills:notaccept: <bill_id> - список не подписанных счетов
 * (list) bill:<bill_id>:prod_id: <prod_id>  - последовательность продукции в счете.
 * (string) bill:<bill_id>:prod_id:<prod_id>:ship_number:  - количество отгруженой продукции.
 * (list) bills:lastbills: <bill_id> - список последних 100 выставленных счетов
 * (zset) bills:zset:date:bill_id: <date> <bill_id> - упорядоченный список счетов, дата явялется оценкой.
 *
 *
 * (hashes) bill:<bill_id>:main: {
 *		subo_id: <subo_id>
 *		id_comp: <id компании от которой выставляется счет>
 *		status: <статус заявки>
 *		note: <примечание>
 *		accept: <одобрение>
 *		sum: <сумма счета>
 *		date: <дата>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * (hashes) bill:<bill_id>:prod_id:<prod_id>: {
 *		price: <цена>
 *		number: <кол-во товаров>
 *		dateupdate: <дата(время) редактирования>
 * }
 * Методы:
 * createMain(data) - содание модели счет;
 * createProd(data) - содание модели позиции;
 * savemain() - сохранение ранее созданой модели;
 * saveprod(bill_id, prod_id) - сохранение ранее созданой модели;
 * ffindListBills(subo_id) - список счетов по subo_id;
 * findByBillID(bill_id) - поиск счета по bill_id;
 * findByProd(bill_id, prod_id) - поиск товара в счете по bill_id и prod_id;
 * findListLastBills() - список всех счетов
 * findUID () - поиск u_id
 * 
 */
 

 // Модель BillModel
var BillModel = module.exports =  function (client) {
    this.client = client;
    this.isCreateMain = false;
	this.isCreateProd = false;
};

// Функция фабрика
BillModel.prototype.createMain = function (data) {
	if(data.subo_id && data.c_id){
		var model = new BillModel(this.client);
		model.subo_id = data.subo_id;
		model.status = data.status || '0';
		model.id_comp = data.id_comp || '0';
		model.note = data.note || '';
		model.accept = data.accept || '0';
		model.date = data.date || my_sys.dateSave();
		model.sum = data.sum || '0';
		model.dateupdate = my_sys.dateSave();
		model.c_id = data.c_id;
		model.isCreateMain = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция фабрика
BillModel.prototype.createProd = function (data) {
	if(data.price || data.number){
		var model = new BillModel(this.client);
		model.price = data.price;
		model.number = data.number;
		model.dateupdate = my_sys.dateSave();
		model.isCreateProd = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
BillModel.prototype.exportmodelmain = function (data, bill_id) {
    var expmodel = new Object;
	expmodel.bill_id = bill_id;
	expmodel.subo_id = data[0];
	expmodel.status = data[1];
	expmodel.note = data[2];
	expmodel.accept = data[3];
	expmodel.date = data[4];
	expmodel.formatdate = my_sys.formatDate(data[4]);
	expmodel.formatDateMonth =  my_sys.formatDateMonth(data[4]);
	expmodel.sum = data[5];
	expmodel.prop = my_sys.wDigitsInWords(data[5].substr(0,data[5].length-3));
	expmodel.formatsum = my_sys.StrToFl(data[5], 2 ,' ');
	expmodel.nds = my_sys.StrToFl((data[5]/118*18), 2 ,' ');
	expmodel.dateupdate = data[6];
	if(data[7]) expmodel.id_comp = parseInt(data[7]);
	else expmodel.id_comp = 0;
	expmodel.namecomp = sprav.myComp[expmodel.id_comp].lastname;
    return expmodel;
};

// Функция для форматированной отправки данных
BillModel.prototype.exportmodelprod = function (data, bill_id, prod_id) {
    var expmodel = new Object;
	expmodel.bill_id = bill_id;
	expmodel.prod_id = prod_id;
	expmodel.price = data[0];
	expmodel.formatprice = my_sys.StrToFl(data[0], 2 ,' ');
	expmodel.number = data[1];
	expmodel.sum = my_sys.StrToFl((data[0]*data[1]), 2 ,' ');
	expmodel.dateupdate = data[2];
    return expmodel;
};

// Возвращает имя ключа для global:lastBillID: 
BillModel.prototype.pLastID = function () {
    return 'global:lastBillID:';
};

// Возвращает имя поля для bills:bill_id:
BillModel.prototype.pListBills = function () {
    return 'bills:bill_id:';
};

// Возвращает имя поля для bills:subo_id:<subo_id>:
BillModel.prototype.pListBySubo_id = function (subo_id) {
    return 'bills:subo_id:'+subo_id+':';
};

// Возвращает имя поля для bill:<bill_id>:prod_id:
BillModel.prototype.pListProbID = function (bill_id) {
    return 'bill:'+bill_id+':prod_id:';
};

// Возвращает имя поля для bill:<bill_id>:prod_id:<prod_id>:ship_number:
BillModel.prototype.pProdShipNumber = function (bill_id, prod_id) {
    return 'bill:'+bill_id+':prod_id:'+prod_id+':ship_number:';
};

// Возвращает имя поля для bills:zset:date:bill_id:
BillModel.prototype.pListDate = function () {
    return 'bills:zset:date:bill_id:';
};

// Возвращает имя поля для bills:c_id:<c_id>:
BillModel.prototype.pListByCID = function (c_id) {
    return 'bills:c_id:'+c_id+':';
};

// Возвращает имя поля для bills:notaccept:
BillModel.prototype.pListNotAccept = function () {
    return 'bills:notaccept:';
};

// Возвращает имя поля для bills:lastbills:
BillModel.prototype.pListLastBills = function () {
    return 'bills:lastbills:';
};

// Возвращает имя поля для bill:<bill_id>:main:
BillModel.prototype.pBillMain = function (bill_id) {
    return 'bill:'+bill_id+':main:';
};

// Возвращает имя поля для bill:<bill_id>:prod_id:<prod_id>:
BillModel.prototype.pBillProd = function (bill_id, prod_id) {
    return 'bill:'+bill_id+':prod_id:'+prod_id+':';
};

  // Возвращает имя поля для number:
BillModel.prototype.kNumber = function () {
    return 'number:';
}; 

  // Возвращает имя поля для id_comp:
BillModel.prototype.kIDComp = function () {
    return 'id_comp:';
};

  // Возвращает имя поля для sum:
BillModel.prototype.kSum = function () {
    return 'sum:';
}; 
 
 // Возвращает имя поля для price:
BillModel.prototype.kPrice = function () {
    return 'price:';
}; 
 
// Возвращает имя поля для date:
BillModel.prototype.kDate = function () {
    return 'date:';
}; 
 
// Возвращает имя поля для accept:
BillModel.prototype.kAccept = function () {
    return 'accept:';
}; 
 
// Возвращает имя поля для status:
BillModel.prototype.kStatus = function () {
    return 'status:';
};

// Возвращает имя поля для subo_id:
BillModel.prototype.kSubo_id = function () {
    return 'subo_id:';
};

// Возвращает имя поля для note:
BillModel.prototype.kNote = function () {
    return 'note:';
};

// Возвращает имя поля для dateupdate:
BillModel.prototype.kDataupdate = function () {
    return 'dateupdate:';
};


// инкремент 
function lastID(callback) {
	this.client.incr(this.pLastID, function(err, result) {
	if (err) {
				callback ('Ошибка инкремента!');
		} else {
				callback(null, result);
			};
	});
};

// проверка наличия модели
function isCreateTrue (modelName, callback){
	var isCreate = false;
	if(modelName === 'main') isCreate = this.isCreateMain;
	if(modelName === 'prod') isCreate = this.isCreateProd;
	if (isCreate) {
			callback(null, 'Модель существует!');
	} else {
			callback('Модель должна быть создана перед сохранением!');
		}
}

// проверка существования счета с таким bill_id
function findSave (bill_id, callback){
	this.client.hexists(this.pBillMain(bill_id), this.kSubo_id(), function (err, result) {
			if(err || result === 0) {
					callback('Такой счет не существует - '+bill_id);
			} else {
					callback(null, result);
				}
		});
}

// Основная функция выполняющая сохранение
function saveMain(bill_id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pBillMain(bill_id), this.kIDComp(), this.id_comp, this.kSubo_id(), this.subo_id, this.kStatus(), this.status, this.kAccept(), this.accept, this.kDate(), this.date, this.kNote(), this.note, this.kSum(), this.sum, this.kDataupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['sadd', this.pListBills(), bill_id],
	['sadd', this.pListBySubo_id(this.subo_id), bill_id],
	['sadd', this.pListByCID(this.c_id), bill_id],
	['sadd', this.pListNotAccept(), bill_id], 
	['lpush', this.pListLastBills(), bill_id],
	['ltrim', this.pListLastBills(), 0, 101],
	['zadd', this.pListDate(), this.date, bill_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, bill_id);
			};
	});
};

BillModel.prototype.findListOrders = function (callback) {
	var date1 =  my_sys.dateNorm('12.11.2011');
	var date2 =  my_sys.dateNorm('01.10.2012');
	console.log(date1);
	console.log(date2);
	this.client.zrangebyscore(this.pListDate(), date1, date2, function(err, repl) {
		if(err) {console.log(err);callback(err);}
		else {
		console.log(repl);
		callback(null, repl);
		}
	});
};

// Основная функция выполняющая сохранение
function updateMain(bill_id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pBillMain(bill_id), this.kIDComp(), this.id_comp, this.kSubo_id(), this.subo_id, this.kStatus(), this.status, this.kAccept(), this.accept, this.kDate(), this.date, this.kNote(), this.note, this.kSum(), this.sum, this.kDataupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, bill_id);
			};
	});
};

// Основная функция выполняющая сохранение
function saveProd(bill_id, prod_id, callback) {
	// Формируем хеш запрос 
	var q = ['hmset', this.pBillProd(bill_id, prod_id), this.kPrice(), this.price, this.kNumber(), this.number, this.kDataupdate(),  this.dateupdate];
	// Сохраняем все в один запрос
	this.client.multi([
	q,
	['rpush', this.pListProbID(bill_id), prod_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, bill_id);
			};
	});
};

// BillModel.update
BillModel.prototype.updatemain = function (bill_id, callback) {
	var thism = this;
	async.series([
		function (callback){
			isCreateTrue.call(thism, 'main', callback);
		},
		function (callback){
			updateMain.call(thism, bill_id, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

BillModel.prototype.findUID = function(bill_id, callback) {
	this.client.hmget(this.pBillMain(bill_id), this.kSubo_id(), function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var order = new Orders(this.client);
				order.findUID(repl[0], 'SubOrder', function (err, res) {
					res.subo_id = repl[0];
					callback(null, res);
				});
			} 
	}.bind(this));
}

//BillModel.savemain();
BillModel.prototype.savemain = function (callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, 'main', callback);
		},
		lastID: ['isCreateTrue', function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback, results){
			saveMain.call(thism, results.lastID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

//BillModel.saveprod();
BillModel.prototype.saveprod = function (bill_id, prod_id, callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, 'prod', callback);
		},
		saveInRedis: ['isCreateTrue', function(callback, results){
			saveProd.call(thism, bill_id, prod_id, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

//BillModel.saveAll();
BillModel.prototype.saveAll = function (arr, callback) {
	var thism = this;
	async.auto({
        saveMain: function(callback){
			thism.savemain.call(thism, callback);
		},
		save: ['saveMain', function(callback, results){
			saveArrProd.call(thism, results.saveMain.lastID, arr, callback);
		}]
		
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// сохранение массива продукции
function saveArrProd (bill_id, arr, callback){
	var thism = this;
	async.forEach(arr, function(data, callback){
			var savemodel = thism.createProd(data);
			if(savemodel!= 'error'){
				savemodel.saveprod (bill_id, data.id, function(err, result) {
					if (err) callback(err);
					else callback();
					});
			} else callback(err);
		}, function(err){
			if (err) callback('Ошибка загрузки всех заказов - '+err);
			else callback(null, 'save_ok');
		});
}

// запрос к Redis и возврат результата в виде модели
function selectRedis (bill_id, prod_id, callback){
	var thism = this;
	if(prod_id) var q = [this.pBillProd(bill_id, prod_id), this.kPrice(), this.kNumber(), this.kDataupdate()];
	else var q = [this.pBillMain(bill_id), this.kSubo_id(), this.kStatus(), this.kNote(), this.kAccept(), this.kDate(), this.kSum(), this.kDataupdate(), this.kIDComp()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
					this.findUID (bill_id, function(error, res){
						if(error) callback(error);
						else{
							if(prod_id) var result = this.exportmodelprod(repl, bill_id, prod_id);
							else var result = this.exportmodelmain(repl, bill_id);
							result.order = res;
							callback(null, result);
						}
					}.bind(this));
			}

	}.bind(this));
}

// BillModel.findByBillID
BillModel.prototype.findByBillID = function (bill_id, callback) {
	var thism = this;
	async.series([
        function (callback){
			findSave.call(thism, bill_id, callback);
		},
		function(callback){
			selectRedis.call(thism, bill_id, null, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else {
			var inbank = new INBANK(thism.client);	
			inbank.findIbIDByBillID(bill_id, results[1], callback);
		}
    });
};

// запрос к Redis и возврат результата в виде модели
function selectSubID (bill_id, callback){
var q = [this.pBillMain(bill_id), this.kSubo_id(), this.kDate()];
	this.client.hmget(q, function(err, res) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
					res[1] = my_sys.formatDate(res[1]);
					callback(null, res);
			}

	}.bind(this));
}

// BillModel.findByBillID
BillModel.prototype.findByBillSubID= function (bill_id, callback) {
	var thism = this;
	async.series([
        function (callback){
			findSave.call(thism, bill_id, callback);
		},
		function(callback){
			selectSubID.call(thism, bill_id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else {
			callback(null, results[1])
		}
    });
};

// BillModel.closeBills
BillModel.prototype.closeBills = function (bill_id, sum, callback) {
	this.client.hmget(this.pBillMain(bill_id), this.kSum(), function(err, result) {
			sum = parseFloat(sum);
			result = parseFloat(result);
			if(sum === result) this.Status (bill_id, '1', callback);
			else this.Status (bill_id, '0', callback);
	}.bind(this));
	
};


// BillModel.Accept
BillModel.prototype.Accept = function (bill_id, accept, callback) {
	this.client.hmset(this.pBillMain(bill_id), this.kAccept(), accept, function(err, result) {
		if (err) {
					callback('Ошибка сохранения подписи');
			} else {
				callback(null, 'ok');
			}
		});
};

// BillModel.Accept
BillModel.prototype.Status = function (bill_id, status, callback) {
	this.client.hmset(this.pBillMain(bill_id), this.kStatus(), status, function(err, result) {
		if (err) {
					callback('Ошибка сохранения статуса');
			} else {
					callback(null, 'ok');
			}
		});
};

// запрос к Redis и возврат результата в виде модели
function selectShipNumber (bill_id, prod_id, callback){
	this.client.get(this.pProdShipNumber(bill_id, prod_id), function(err, res) {
		if (err) {
				callback('Ошибка в запросе selectShipNumber')
		} else {
				callback(null, res);
			}

	}.bind(this));
}

// запрос к Redis и возврат результата в виде модели
function selectSpravProd (prod_id, callback){
	var order = new Orders(this.client);
		order.findByProdID(prod_id, function (err, res) {
			callback(null, res);
		});
}

// BillModel.findByProd
BillModel.prototype.findByProd = function (bill_id, prod_id, callback) {
	var thism = this;
	async.series([
        function (callback){
			findSave.call(thism, bill_id, callback);
		},
		function(callback){
			selectRedis.call(thism, bill_id, prod_id, callback);
		},
		function(callback){
			selectShipNumber.call(thism, bill_id, prod_id, callback);
		},
		function(callback){
			selectSpravProd.call(thism, prod_id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else { 
			results[3].shipnumber = results[2];
			results[3].bill = results[1];
			callback(null, results[3]);
		}
    });
};

// BillModel.findListBills
BillModel.prototype.findListBills = function (subo_id, callback) {
	var args = [];
	var thism = this;
	this.client.smembers(this.pListBySubo_id(subo_id), function(err, result) {
		if (err) {
					callback('Ошибка выборки всех счетов приложения ');
			} else {
					async.forEach(result, function(id, callback){
						thism.findByBillID (id, function(err, result) {
							if (err) callback();
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки счета - '+err);
							else callback(null, args);
					});
				};
	});
}

// BillModel.findListBillsCID
BillModel.prototype.findListBillsCID = function (c_id, callback) {
	var args = [];
	var thism = this;
	this.client.smembers(this.pListByCID(c_id), function(err, result) {
		if (err) {
					callback('Ошибка выборки всех счетов приложения ');
			} else {
					async.forEach(result, function(id, callback){
						thism.findByBillID (id, function(err, result) {
							if (err) callback();
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки счета - '+err);
							else callback(null, args);
					});
				};
	});
}

function SortProdID (bill_id, arr, callback) {
	var buff_arr = [];
	this.client.lrange(this.pListProbID(bill_id), 0, 50, function (err, res) {
			if(err) callback(err);
			else {
				if(res.length === 0) callback(null, arr);
				else {
					for(var i =0; i < res.length; i++) 
					for(var g =0; g < arr.length; g++){
						if(arr[g].prod_id === res[i]) {buff_arr.push(arr[g]); break;}
					}
					callback(null, buff_arr);
				}
			}
	});	
};

// BillModel.findListProd
BillModel.prototype.findListProd = function (bill_id, subo_id, callback) {
	var args = [];
	var thism = this;
	var orders = new Orders(this.client);
	orders.findListProdIDBySubOID(subo_id, function (err, res) {
			if(err) callback(err);
			else {
				async.forEach(res, function(id, callback){
					thism.findByProd (bill_id, id.prod_id, function(err, result) {
							if (err) callback(err);
							else {
							if(result.number != null){
								var buff = id;
								buff.bill = result;
								args.push(buff);
								}
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки счета - '+err);
							else SortProdID.call(thism, bill_id, args, callback);
					});
			}
		});
}

// BillModel.findListLastBills
BillModel.prototype.findListLastBills = function (callback) {
	var args = [];
	var thism = this;
	this.client.lrange(this.pListLastBills(), 0, 99, function(err, result) {
		if (err) {
					callback('Ошибка выборки всех счетов приложения ');
			} else {
					async.forEach(result, function(id, callback){
						thism.findByBillID (id, function(err, result) {
							if (err) callback();
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки счета - '+err);
							else callback(null, args);
					});
				};
	});
}

BillModel.prototype.findByDate = function (date1, date2, callback) {
	var thism = this;
	var args = [];
	this.client.zrangebyscore(this.pListDate(), date1, date2, function(err, repl) {
		if(err) {console.log(err);callback(err);}
		else {
			async.forEach(repl, function(id, callback){
						thism.findByBillID (id, function(err, result) {
							if (err) callback();
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки счета - '+err);
							else callback(null, args);
					});
		}
	});
};