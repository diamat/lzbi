//user.js

var crypto = require('crypto');
var async = require('async');
var sys = require('util');
var my_sys = require('../lib/my_sys');

/**
 * Структура представлена в бд в виде:
 *
 * (string) global:lastUserID: <id>
 *
 * (string)	username:<username>:uid: <id>
 *
 * (set) usersActive:uid: <id> 
 *
 * (set) usersArchive:uid: <id> 
 *
 * (hashes) users:<id>: {
 *  username: <username>
 * 	name: <имя>
 * 	lastname: <фамилия>
 *	salt: <случайная соль>
 *  pass: <hash(pass,salt)>
 *  role: <роль>
 *  position: <должность>
 *  company: <id компании>
 *  timereg: <время регистрации>
 * }
 *
 *
 * Методы:
 * creat(username, name, lastname, salt, password, role, position, company, time) - содание модели;
 * save() - сохранение ранее созданой модели;
 * remove(username) - удаление пользователя по логину (username);
 * findByUserName(username) - поиск по логину (username);
 * findByUserID (id) - поиск по id;
 * addArchvive(id) - добавление пользователя в архив по id;
 * addActive(id) - добавление пользователя в список активных по id;
 * findUsersActive - поиск id всех активных пользователй;
 * findUsersArchive - поиск id всех архивных пользователй;
 * findListUserByRole - список пользователей по роле.
 * 
 */
 
  // Модель UserModel
var  UserModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
};

// Функция фабрика
UserModel.prototype.create = function (username, name, lastname, salt, password, role, position, company, time) {
    var user = new UserModel(this.client);
    user.username = username;
	user.name = name;
    user.lastname = lastname;
	user.salt = salt;
	user.role = role;
	user.position = position;
	user.company = company;
	user.time = time || my_sys.dateSave();
	if(password === null) user.pass = '';
	else user.pass = my_sys.getHash(password, salt);
	user.isCreate = true;
    return user;
};

// Функция для форматированной отправки данных
UserModel.prototype.exportmodel = function (username, name, lastname, salt, password, role, position, company, time, id) {
    var expmodel = new Object;
	expmodel.u_id = id;
	expmodel.username = username;
	expmodel.name = name;
    expmodel.lastname = lastname;
	expmodel.salt = salt;
	expmodel.role = role;
	expmodel.position = position;
	expmodel.company = company;
	expmodel.time = time;
	expmodel.pass = password;
    return expmodel;
};

// Возвращает имя ключа для username
UserModel.prototype.kUserName = function (username) {
    return 'username:'+username+':uid:';
};

// Возвращает имя поля для username
UserModel.prototype.kUsername = function () {
    return 'username:';
};

// Возвращает имя поля для name
UserModel.prototype.kName = function () {
    return 'name:';
};

// Возвращает имя поля для user_name
UserModel.prototype.pUserName = function (userid) {
    return 'user_name:'+userid+':';
};

// Возвращает имя поля для lastname
UserModel.prototype.kLastName = function () {
    return 'lastname:';
};

// Возвращает имя поля для salt
UserModel.prototype.kSalt = function () {
    return 'salt:';
};

// Возвращает имя поля для pass
UserModel.prototype.kPass = function () {
    return 'pass:';
};

// Возвращает имя поля для role
UserModel.prototype.kRole = function () {
    return 'role:';
};

// Возвращает имя поля для position
UserModel.prototype.kPosition = function () {
    return 'position:';
};

// Возвращает имя поля для company
UserModel.prototype.kCompany = function () {
    return 'company:';
};

// Возвращает имя поля для time
UserModel.prototype.kTime = function () {
    return 'time:';
};

// Возвращает имя поля для usersActive:uid:
UserModel.prototype.pUsersActive = function () {
    return 'usersActive:uid:';
};

// Возвращает имя поля для usersArchive:uid:
UserModel.prototype.pUsersArchive = function () {
    return 'usersArchive:uid:';
};

// проверка сущестования пользователя
function findUserID(f, callback) {
	this.client.exists('username:'+this.username+':uid:', function(err, result) {
   	 if (result === f) {
				callback('Пользователь с таким логином уже существует');
		} else {	
				callback(null, result);
			};
	});
};

// инкремент uid
function lastUserID(callback) {
	this.client.incr('global:lastUserID:', function(err, result) {
	if (err) {
				callback ('Ошибка инкремента!');
		} else {
				callback(null, result);
			};
	});
};

// Функция возврата id по username
function getUserID(username, callback) {
	this.client.get('username:'+username+':uid:', function(err, repl) {
   	 if (repl === null) {
				callback('Такой пользователь не существует.');
		} else {	
				callback(null, repl);
			};
	});
};

// Основная функция выполняющая сохранение
function saveUser(user_id, callback) {
	// Сохраняем все в один запрос
	this.client.multi([
	['hmset', this.pUserName(user_id), this.kUsername(), this.username, this.kName(), this.name, this.kLastName(), this.lastname, this.kSalt(), this.salt, this.kPass(), 
	this.pass, this.kRole(), this.role, this.kPosition(), this.position, this.kCompany(), this.company, this.kTime(), this.time],
	['sadd', this.pUsersActive(), user_id],
	['srem', this.pUsersArchive(), user_id],
	['set', this.kUserName(this.username), user_id]
	]).exec(function (err, result) {
		if (err) {
				callback('Ошибка сохранения!');
		} else {
				callback(null, user_id);
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

// проверка существования пользователя по id
function findSave (id, callback){
	this.client.hexists(this.pUserName(id), this.kName(), function (err, result) {
				if(err || result === 0) {
						callback('Такой пользователь не существует.');
				} else {
						callback(null, result);
					}
			});
}

//UserModel.save();
UserModel.prototype.save = function (callback) {
	var thism = this;
	async.auto({
        findUserIDfalse: function (callback){
			findUserID.call(thism, 1, callback);
		},
        isCreateTrue: function(callback){
			isCreateTrue.call(thism, callback);
		},
		lastUserID: ['findUserIDfalse','isCreateTrue', function(callback, results){
			lastUserID.call(thism, callback);
		}],
		saveInRedis: ['lastUserID', function(callback, results){
			saveUser.call(thism, results.lastUserID, callback);
		}]
	},
    function(err, results){
        if(err) callback(err);
		else callback(null, results);
    });
};

// запрос к Redis и возврат результата в виде модели
function selectRedisUser (id, callback){
	var thism = this;
	var q = [this.pUserName(id), this.kName(), this.kLastName(), this.kSalt(), this.kPass(), this.kRole(), this.kPosition(), this.kCompany(), this.kTime(), this.kUsername()];
	this.client.hmget(q, function(err, repl) {
		if (err) {
				callback('Ошибка в запросе к Redis')
		} else {
				var result = thism.exportmodel(repl[8], repl[0], repl[1], repl[2], repl[3], repl[4], repl[5], repl[6], repl[7], id);
				callback(null, result);
			} 
	});
}

// UserModel.findByUserID 
UserModel.prototype.findByUserID = function (id, callback) {
	var thism = this;
	async.series([
        function (callback){
			findSave.call(thism, id, callback);
		},
		function(callback){
			selectRedisUser.call(thism, id, callback);
		}
	],
    function(err, results){
        if(err) callback(err);
		else callback(null, results[1]);
    });
};

// UserModel.findByUserName
UserModel.prototype.findByUserName = function (username, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getUserID.call(thism, username, callback);
		},
		function (uid, callback){
			selectRedisUser.call(thism, uid, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// UserModel.remove
UserModel.prototype.remove = function (username, callback) {
	var thism = this;
	async.waterfall([
        function (callback){
			getUserID.call(thism, username, callback);
		},
		function (uid, callback){
			thism.client.multi([
			['del', thism.pUserName(uid), thism.kUserName(username)],
			['srem', thism.pUsersArchive(), uid],
			['srem', thism.pUsersActive(), uid],
			]).exec(function (err, repl) {
				if (err) {
					callback('Ошибка в запросе к Redis - remove');
				} else {
					callback(null, username+' - удалён из БД');
					};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};

// UserModel.update
UserModel.prototype.update = function (username, callback) {
	var thism = this;
	async.waterfall([
		function (callback){
			isCreateTrue.call(thism, callback);
		},
        function (arg1, callback){
			getUserID.call(thism, username, callback);
		},
		function (uid, callback){
			saveUser.call(thism, uid, callback);
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};		

// UserModel.addArchvive
UserModel.prototype.addArchvive = function (id, callback) {
	var thism = this;
	async.series([
		function (callback){
			findSave.call(thism, id, callback);
		},
		function (callback){
			thism.client.multi([
			['sadd', thism.pUsersArchive(), id],
			['srem', thism.pUsersActive(), id],
			]).exec(function (err, repl) {
			if (err) {
					callback('Ошибка добавления пользователя в архив');
			} else {
					callback(null, 'Пользователь добавлен в архив');
				};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// UserModel.addActive
UserModel.prototype.addActive = function (id, callback) {
	var thism = this;
	async.series([
		function (callback){
			findSave.call(thism, id, callback);
		},
		function (callback){
			thism.client.multi([
			['sadd', thism.pUsersActive(), id],
			['srem', thism.pUsersArchive(), id],
			]).exec(function (err, repl) {
			if (err) {
					callback('Ошибка добавления пользователя в список активны');
			} else {
					callback(null, 'Пользователь добавлен в список активных');
				};
			});
		}
	],
    function(err, result){
        if(err) callback(err);
		else callback(null, result);
    });
};	

// UserModel.findUsersActive
UserModel.prototype.findUsersActive = function (callback) {
	var args = [];
	var thism = this;
	this.client.smembers('usersActive:uid:', function(err, result) {
		if (err) {
					callback('Ошибка выборки активных пользователей');
			} else {
					async.forEach(result, function(id, callback){
						thism.findByUserID (id, function(err, result) {
							if (err) callback(err);
							else {
							args.push(result);
							callback();
							};
						});
					}, function(err){
							if (err) callback('Ошибка загрузки всех пользователей - '+err);
							else callback(null, args);
					});
				};
	});
};

// UserModel.ListUserByRole
UserModel.prototype.ListUserByRole = function (role, callback) {
	var listrole = [];
	this.findUsersActive(function(err,res){
		if(err) callback(err);
		else{
			for(var i=0;i<res.length;i++){
				if(res[i].role === role){
					listrole.push(res[i]);
				}
			}
			callback(null,listrole);
		}
	});
};

// UserModel.findUsersArchive
UserModel.prototype.findUsersArchive = function (callback) {
	var thism = this;
	this.client.smembers('usersArchive:uid:', function(err, result) {
		if (err) {
					callback('Ошибка выборки архивных пользователей');
			} else {
					callback(null, result);
				};
	});
};