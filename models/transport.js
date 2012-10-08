//inbank.js

var valid = require('../lib/valid');
var my_sys = require('../lib/my_sys');
var sprav = require('../lib/sprav');
var async = require('async');
var Customers = require('./customers');
var Customerbank = require('./customerbank');

/**
 * 
 * Обозночение сокращений:
 * c_id - id заказчика
 * u_id - id пользователя
 * ib_id - id платежного поручения (п/п)
 * bill_id - id счета
 * rs - расчётный счет клиента
 * in_rs - расчётный счет куда пришли деньги
 * 
 * Структура представлена в бд в виде:
 *
 * (string) global:lastIBID: <ib_id> - счетчик id п/п
 * (string) in_bank:lastDate: <date> - дата последней 
 * (string) in_bank:no:<no>:date:<date>:sum:<sum>:  - строка для проверки уникальности п/п
 * (set) in_bank:<ib_id>:bill_id: <bill_id>  - список счетов связанных с этим п/п
 * (set) bills:<bill_id>:ib_id: <ib_id>  - список п/п привязанных к счету
 * (set) rs:<rs>:ib_id: <ib_id>  - список п/п переведённых с данного р/с
 * (set) in_rs:<in_rs>:ib_id: <ib_id>  - список п/п переведённых на данный р/с
 * (set) c_id:<c_id>:ib_id: <ib_id>  - список п/п данного заказчика
 * (set) ib_id:new: <ib_id>  - список п/п не привязанных к счету
 * (string) in_bank:<ib_id>:bill_id:<bill_id>:sum: <sum> - сумма по п/п по данному счету.
 * (zset) in_bank:zset:date:ib_id: <date> <ib_id> - упорядоченный список п/п, дата явялется оценкой.
 *
 *
 * (hashes) in_bank:<ib_id>:main: {
 *		no: <номер п/п>
 *		c_id: <статус заявки>
 *		rs: <р/с>
 *		in_rs: <р/с куда пришли деньги>
 *		sum: <сумма счета>
 *		date: <дата>
 *		pop: <назначения платежа>
 *		dateupdate: <дата(время) редактирования>
 * }
 *
 * Методы:
 * create(data) - содание модели счет;
 * save() - сохранение ранее созданой модели;
 * addBill(ib_id, bill_id, sum) - функция добавления счета
 */
 

 // Модель InBankModel
var InBankModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
InBankModel.prototype.create = function (data) {
	if(data.no ||  data.rs || data.sum || data.date || data.pop || data.inn || data.bik || data.in_rs){
		var model = new InBankModel(this.client);
		model.no = data.no;
		model.rs = data.rs;
		model.in_rs = data.in_rs;
		model.sum = data.sum;
		model.date = data.date;
		model.pop = data.pop;
		model.inn = data.inn;
		model.bik = data.bik;
		model.dateupdate = my_sys.dateSave();
		model.isCreate = true;
		return model;
	} else {
		return 'error';
	}
};

// Функция для форматированной отправки данных
InBankModel.prototype.exportmodel = function (data, ib_id) {
    var expmodel = new Object;
	expmodel.ib_id = ib_id;
	expmodel.no = data[0];
	expmodel.c_id = data[1];
	expmodel.rs = data[2];
	expmodel.sum = data[3];
	expmodel.formatsum = my_sys.StrToFl(data[3], 2 ,' ');
	expmodel.date = data[4];
	expmodel.formatdate = my_sys.formatDate(data[4]);
	expmodel.pop = data[5];
	expmodel.in_rs = data[6];
	expmodel.id_comp = 0;
	for(var i =0;i<sprav.myRS.length;i++)
	if(expmodel.in_rs === sprav.myRS[i].rs) {
		expmodel.id_comp = sprav.myRS[i].c_id;
		expmodel.namecomp = sprav.myComp[sprav.myRS[i].c_id].lastname;
	}
	expmodel.dateupdate = data[7];
    return expmodel;
};



// Возвращает имя ключа для global:lastIBID:
InBankModel.prototype.pLastID = function () {
    return 'global:lastIBID:';
};

// Возвращает имя ключа для ib_id:new: 
InBankModel.prototype.pListNew = function () {
    return 'ib_id:new:';
};

// Возвращает имя поля для in_bank:lastDate:
InBankModel.prototype.pLastDate = function () {
    return 'in_bank:lastDate:';
};

// Возвращает имя поля для in_bank:no:<no>:date:<date>:sum:<sum>:
InBankModel.prototype.pInBankNDS = function (no, date, sum) {
    return 'in_bank:no:'+no+':date:'+date+':sum:'+sum+':';
};

// Возвращает имя поля для in_bank:<ib_id>:bill_id:
InBankModel.prototype.pInBankAll = function (ib_id) {
    return 'in_bank:'+ib_id+':bill_id:';
};

// Возвращает имя поля для rs:<rs>:ib_id:
InBankModel.prototype.pRSID = function (rs) {
    return 'rs:'+rs+':ib_id:';
};

// Возвращает имя поля для in_rs:<in_rs>:ib_id:
InBankModel.prototype.pInRS= function (in_rs) {
    return 'in_rs:'+in_rs+':ib_id:';
};
// Возвращает имя поля для  bills:<bill_id>:ib_id:
InBankModel.prototype.pBillIbID = function (bill_id) {
    return ' bills:'+bill_id+':ib_id:';
}; 
 
// Возвращает имя поля для c_id:<c_id>:ib_id:
InBankModel.prototype.pCID = function (c_id) {
    return 'c_id:'+c_id+':ib_id:';
};

// Возвращает имя поля для in_bank:<ib_id>:bill_id:<bill_id>:sum:
InBankModel.prototype.pBillSum = function (ib_id, bill_id) {
    return 'in_bank:'+ib_id+':bill_id:'+bill_id+':sum:';
};

// Возвращает имя поля для in_bank:zset:date:ib_id:
InBankModel.prototype.pListDate = function () {
    return 'in_bank:zset:date:ib_id:';
};

// Возвращает имя поля для in_bank:<ib_id>:main:
InBankModel.prototype.pMain = function (ib_id) {
    return 'in_bank:'+ib_id+':main:';
};

  // Возвращает имя поля для no:
InBankModel.prototype.kNo = function () {
    return 'no:';
}; 

  // Возвращает имя поля для sum:
InBankModel.prototype.kSum = function () {
    return 'sum:';
}; 

  // Возвращает имя поля для c_id:
InBankModel.prototype.kCID = function () {
    return 'c_id:';
}; 
 
 // Возвращает имя поля для rs:
InBankModel.prototype.kRS = function () {
    return 'rs:';
}; 

 // Возвращает имя поля для in_rs:
InBankModel.prototype.kInRS = function () {
    return 'in_rs';
}; 
 
// Возвращает имя поля для date:
InBankModel.prototype.kDate = function () {
    return 'date:';
}; 
 
// Возвращает имя поля для accept:
InBankModel.prototype.kAccept = function () {
    return 'accept:';
}; 

// Возвращает имя поля для pop:
InBankModel.prototype.kPop = function () {
    return 'pop:';
};

// Возвращает имя поля для dateupdate:
InBankModel.prototype.kDataupdate = function () {
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

// проверка сущестования п/п под таким номером, датой и суммой
function findPP(callback) {
	this.client.exists(this.pInBankNDS(this.no, this.date, this.sum), function(err, result) {
   	if (err || result === 1) {
			if(err) callback('Ошибка в findPP ');
			else callback('error1');
		} else {	
				callback(null, result);
			};
	});
};

// проверка наличия модели
function isCreateTrue (callback){
	if (this.isCreate) {
			callback(null, 'Модель существует!');
	} else {
			callback('Модель должна быть создана перед сохранением!');
		}
}

// проверка соответсвия rs bik и inn
function findCID (callback){
	var сustomers = new Customers(this.client);
	var customerbank = new Customerbank (this.client);
	var c_id1;
	var c_id2;
	var c_name;
	var u_id;
	var thism = this;
	async.parallel([
		function(callback){
			customerbank.findCustomer(thism.rs, function (err, res) {
				if(err) {c_id1 = 0; callback();}
				else {c_id1 = res; callback();}
			});	
		},
		function(callback){
			сustomers.findByCustomerINN(thism.inn, function (err, res) {
				if(err) {c_id2 = 0; callback();}
				else {
					c_id2 = res.c_id; 
					c_name = res.name; 
					u_id = res.u_id; 
					callback();
				}
			})	
		}
		],
		function(err, results){
			if(err) callback('Ошибка findRS - '+err);
			else {
				if(c_id2 === 0){
					callback('Компании с таким ИНН не существует в БД');
				} else if (c_id1 === 0){
					customerbank.add(c_id2, thism.bik, thism.rs, function (err, res) {
						if(err) callback(err);
						else {
							callback(null, c_id2, c_name, u_id);
							}
						});
				} else callback(null, c_id2, c_name, u_id);
			}
		});
}


//InBankModel.save();
InBankModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		findPPfalse: function (callback){
			findPP.call(thism, callback);
		},
		findCID: ['findPPfalse', 'isCreateTrue', function(callback, results){
			findCID.call(thism, callback);
		}],
		lastID: ['findCID', function(callback, results){
			lastID.call(thism, callback);
		}],
		saveInRedis: ['lastID', function(callback,  results){
			saveModel.call(thism, results.lastID, results.findCID, 'new',callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else {callback(null, results);}
    });
};

// Основная функция выполняющая сохранение
function saveModel(ib_id, c_id, flag, callback) {
	var q = [
	['hmset', this.pMain(ib_id), this.kNo(), this.no, this.kCID(), c_id[0], this.kInRS, this.in_rs, this.kRS(), this.rs, this.kSum(), this.sum, this.kDate(), this.date, this.kPop(), this.pop, this.kDataupdate(), this.dateupdate],
	['set', this.pInBankNDS(this.no, this.date, this.sum), '1'],
	['sadd', this.pCID(c_id[0]), ib_id],
	['sadd', this.pRSID(this.rs), ib_id],
	['sadd', this.pInRS(this.in_rs), ib_id],
	['zadd', this.pListDate(), this.date, ib_id]
	];
	if(flag === 'new') q.push(['sadd', this.pListNew(), ib_id]);
	this.client.multi(q).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, ib_id);
			};
	});
};


function saveAddBill(ib_id, bill_id, sum, callback) {
var q = [
	['sadd', this.pInBankAll(ib_id), bill_id],
	['set', this.pBillSum(ib_id, bill_id), sum],
	['sadd', this.pBillIbID(bill_id), ib_id]
	];
	this.client.multi(q).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null,'Ok');
			};
	});
};

function CloseBills (bill_id,  callback) {
	var Bills = require('./bills');
	var bill = new Bills(this.client);
	var buff = {};
	this.findIbIDByBillID(bill_id, buff, function(err, res){
			bill.closeBills (bill_id, res.res_sum, callback);
		});
};

function CloseInbank (ib_id, callback) {
	this.findBillsByIbID(ib_id, function(err, res, sum){
			if(err) callback(err);
			else {
				this.client.hmget(this.pMain(ib_id), this.kSum(), function(err, result) {
						sum = parseFloat(sum);
						result = parseFloat(result);
						if(sum === result) StatusInbank.call (this, ib_id, '1', callback);
						else StatusInbank.call (this, ib_id, '0', callback);
				}.bind(this));
			}
		}.bind(this));
};

function StatusInbank (ib_id, flag, callback) {
	var q;
	if(flag === '0') q = [['sadd', this.pListNew(), ib_id]];
	else q = [['srem',  this.pListNew(), ib_id]];
	this.client.multi(q).exec(function (err, result) {
		if (err) {
				callback('Ошибка изменения статуса п/п');
		} else {
				callback (null, 'ok');
			};
	});
};

InBankModel.prototype.addBill = function(ib_id, bill_id, sum, callback) {
	var thism = this;
	async.auto({
        saveBill: function(callback){
			saveAddBill.call(thism, ib_id, bill_id, sum, callback);
		},
		closeBills: ['saveBill', function(callback, results){
			CloseBills.call (thism, bill_id, callback);
		}],
		closeInbank: ['saveBill', function(callback, results){
			CloseInbank.call (thism, ib_id, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else {callback(null, results);}
    });
}

InBankModel.prototype.findSumBillIBID = function(ib_id, bill_id, callback) {
	this.client.get(this.pBillSum(ib_id, bill_id), function(err, res) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
			 callback(null, res)	
			} 
	});
}

InBankModel.prototype.findBillsByIbID = function(ib_id, callback) {
	var thism = this;
	var list = [];
	var res_sum = 0;
	this.client.smembers(this.pInBankAll(ib_id), function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				async.forEach(repl, function(bill_id, callback){
					thism.findSumBillIBID (ib_id, bill_id, function(err, result) {
							if (err) callback(err);
							else {
							res_sum = res_sum + parseFloat(result);
							list.push({bill_id: bill_id, sum: result});
							callback();
							}
						});
				}, function(err){
					if (err) callback('Ошибка загрузки п/п - '+err);
					else callback(null, list, res_sum);
				});
			} 
	}.bind(this));
}

InBankModel.prototype.findIbIDByBillID = function(bill_id, bill, callback) {
	var thism = this;
	var list = [];
	var res_sum = 0;
	this.client.smembers(this.pBillIbID(bill_id), function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				async.forEach(repl, function(ib_id, callback){
					thism.findSumBillIBID (ib_id, bill_id, function(err, result) {
							if (err) callback(err);
							else {
							res_sum = res_sum + parseFloat(result);
							list.push({ib_id: ib_id, sum: result});
							callback();
							}
						});
				}, function(err){
					if (err) callback('Ошибка загрузки п/п - '+err);
					else {
						bill.res_sum = res_sum;
						bill.inbank = list;
						callback(null, bill);
					}
				});
			} 
	}.bind(this));
}

InBankModel.prototype.removeBill = function(ib_id, bill_id, callback) {
	var thism = this;
	var q = [
	['srem', this.pInBankAll(ib_id), bill_id],
	['del', this.pBillSum(ib_id, bill_id)],
	['srem', this.pBillIbID(bill_id), ib_id]
	];
	this.client.multi(q).exec(function (err, result) {
		if (err) {
				callback('Ошибка удаления!');
		} else {
				async.auto({
					closeBills: function(callback, results){
						CloseBills.call (thism, bill_id, callback);
					},
					closeInbank: function(callback, results){
						CloseInbank.call (thism, ib_id, callback);
					}
				},
				function(err, results){
					if(err) callback(err);
					else {callback(null, results);}
				});
			};
	});
}

InBankModel.prototype.findUID = function(bill_id, callback) {
	this.client.hmget(this.pBillMain(bill_id), this.kSubo_id(), function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var order = new Orders(this.client);
				order.findUID(repl[0], 'SubOrder', function (err, res) {
					res.subo_id = repl[0]
					callback(null, res);
				});
			} 
	}.bind(this));
}

// запрос к Redis и возврат результата в виде модели
function selectRedis (ib_id, callback){
	var thism = this;
	var q = [this.pMain(ib_id), this.kNo(),  this.kCID(), this.kRS(), this.kSum(), this.kDate(), this.kPop(), this.kInRS, this.kDataupdate()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
					var сustomers = new Customers(this.client);
					сustomers.findUID (repl[1], function(error, res) {
					if(error) callback(error);
						else{
							var result = this.exportmodel(repl, ib_id);
							result.customer = res;
							callback(null, result);
						}
					}.bind(this));
			}

	}.bind(this));
};

InBankModel.prototype.findListOrders = function (callback) {
	var date1 =  my_sys.dateNorm('12.11.2010');
	var date2 =  my_sys.dateNorm('01.05.2013');
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

InBankModel.prototype.findListNewOrders = function (callback) {
	var thism = this;
	var list = [];
	this.client.smembers(this.pListNew(), function(err, repl) {
		if(err) {console.log(err);callback(err);}
		else {
			async.forEach(repl, function(id, callback){
				selectRedis.call (thism, id, function(err, result) {
						if (err) callback(err);
						else {
						list.push(result);
						callback();
						}
					});
			}, function(err){
				if (err) callback('Ошибка загрузки п/п - '+err);
				else callback(null, list);
			});
		}
	}.bind(this));
};

InBankModel.prototype.findInbank = function (id, callback) {
	selectRedis.call (this, id, function(err, result) {
				if (err) callback(err);
				else {
						callback(null, result);
					}
		});
};


// findInbank.remove
InBankModel.prototype.removeOne = function (ib_id, callback) {
		this.client.multi([
				['srem', this.pListNew(), ib_id],
				]).exec(function (err, repl) {
					if (err) callback('Ошибка в запросе к Redis - remove');
					else callback(null, ib_id+' - удалён из БД');
				});
};

// findInbank.remove
InBankModel.prototype.remove = function (ib_id, callback) {
	var thism = this;
	async.waterfall([
		function (callback){
			thism.findInbank(ib_id, callback);
		},
		function (res, callback){
			thism.client.multi([
				['del',  thism.pMain(ib_id)],
				['del',  thism.pInBankNDS(res.no, res.date, res.sum)],
				['srem', thism.pListNew(), ib_id],
				['srem', thism.pCID(res.c_id), ib_id],
				['srem', thism.pRSID(res.rs), ib_id],
				['srem', thism.pInRS(res.in_rs), ib_id],
				['zrem', thism.pListDate(), ib_id]
				]).exec(function (err, repl) {
					if (err) callback('Ошибка в запросе к Redis - remove');
					else callback(null, ib_id+' - удалён из БД');
				});
		}
	],
	function(err, result){
		if(err) callback(err);
		else callback(null, result);
	});
};