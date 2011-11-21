//user.js

var crypto = require('crypto');
var process = require('events');
var sys = require('util');
var my_sys = require('../lib/my_sys');
var universal_sql = require('../models/universal_sql');
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
 * addArchvive(id) - добавление пользователя в архив по id;
 * findByUserID (id) - поиск по id;
 * findUsersActive - поиск id всех активных пользователй;
 * 
 */
 
 // Модель UserModel
var  UserModel = module.exports =  function (client) {
    this.client = client;
    this.isCreate = false;
	
	process.EventEmitter.call(this);
};

sys.inherits(UserModel, process.EventEmitter);

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
	user.time = time || my_sys.DateSave();
	if(password === null) user.pass = '';
	else user.pass = my_sys.getHash(password, salt);
	user.isCreate = true;
    return user;
};

// Функция для форматированной отправки данных
UserModel.prototype.exportmodel = function (username, name, lastname, salt, password, role, position, company, time, id) {
    var expmodel = new Object;
	expmodel.id = id;
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

// Сохранение имя пользователя и ID в MySQL
UserModel.prototype.insertMySQL = function (id, name) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	uSQL.SQL("INSERT INTO users (ID, NAME) VALUES (\'"+id+"\', \'"+name+"\')", 'insertMySQL');
    uSQL.on('result_sql', function(){
		self.emit('save_ok');
	});	
	
	uSQL.on('error', function(error){
		self.emit('error', error);
	});	
};

UserModel.prototype.updateMySQL = function (id, name) {
	var uSQL = new universal_sql (my_sys.client_mysql());
	var self = this;
	uSQL.SQL("UPDATE users SET NAME = \'"+name+"\' WHERE ID = "+id, 'updateMySQL');
    uSQL.on('result_sql', function(){
		self.emit('save_ok');
	});	
	
	uSQL.on('error', function(error){
		self.emit('error', error);
	});
    
};

// Возвращает имя поля для username
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

UserModel.prototype.lastUserID = function (callback) {
	var dublethis = this;
	this.client.incr('global:lastUserID:', function(err, repl) {
	if (err) {
				if (callback) dublethis._save.call(dublethis, err, callback);
		} else {
				if (callback) dublethis._save.call(dublethis, repl, callback);
			};
		
	});
};

UserModel.prototype.findUserID = function (username, callback) {
	var dublethis = this;
	this.client.exists('username:'+username+':uid:', function(err, repl) {
   	 if (repl === 0) {
				 if (callback) callback.call(dublethis, null, 0, dublethis);
		} else {	
				 if (callback) callback.call(dublethis , null , dublethis.pUserName(repl), dublethis);
			};
	});
};

UserModel.prototype.getUserID = function (username, callback) {
	var dublethis = this;
	this.client.get('username:'+username+':uid:', function(err, repl) {
   	 if (repl === null) {
				 if (callback) callback.call(dublethis, null, 0, dublethis);
		} else {	
				 if (callback) callback.call(dublethis , null , repl, dublethis);
			};
	});
};

 // Основная функция выполняющая сохранение
UserModel.prototype._save = function (user_id , callback) {
	// Сохраняем все в один запрос
	this.client.multi([
	['hmset', this.pUserName(user_id), this.kUsername(), this.username, this.kName(), this.name, this.kLastName(), this.lastname, this.kSalt(), this.salt, this.kPass(), 
	this.pass, this.kRole(), this.role, this.kPosition(), this.position, this.kCompany(), this.company, this.kTime(), this.time],
	['sadd', this.pUsersActive(), user_id],
	['set', this.kUserName(this.username), user_id]
	]).exec(function (err, repl) {
		if (err) {
				 if (callback) callback.call(this, err, null, this);
		} else {
				 if (callback) callback.call(this, null, repl, this);
			};
	}.bind(this));
};

//UserModel.save();
UserModel.prototype.save = function (callback) {
	var dublethis = this;
	// проверяем сущестование такого пользователя
	this.findUserID(this.username, function(err, result) {
		if(result === 0){
			// проверяем была ли создана модель через .create()
			if (dublethis.isCreate) {
				dublethis.lastUserID.call(dublethis, callback);
			} else {
			 if (callback) callback.call(dublethis, 'Модель должна быть создана перед сохранением', null, dublethis);
			};
		}
		else if (callback) callback.call(dublethis, 'Пользователь с таким логином уже существует.', null, dublethis);
	});
};

// UserModel.findByUserID
UserModel.prototype.findByUserID = function (id, callback) {
	var dublethis = this;
	this.client.hexists(this.pUserName(id), this.kName(), function (err, res) {
		if(err || res === 0) {
				if(callback)callback.call(dublethis, 'Такой пользователь не существует.', null, dublethis);
				else dublethis.emit('error', 'Такой пользователь не существует.');
			}
		else{
			// Конструрируем запрос
				var q = [dublethis.pUserName(id), dublethis.kName(), dublethis.kLastName(), dublethis.kSalt(), dublethis.kPass(), dublethis.kRole(), dublethis.kPosition(), dublethis.kCompany(), dublethis.kTime(), dublethis.kUsername()];
				dublethis.client.hmget(q, function(err, repl) {
				 if (err) {
					 if (callback) callback.call(dublethis, err, null, dublethis);
					 else dublethis.emit('error', err);
				 } else if (repl) {
					 var res = dublethis.exportmodel(repl[8], repl[0], repl[1], repl[2], repl[3], repl[4], repl[5], repl[6], repl[7], id);
					 if (callback) callback.call(dublethis, null, res, dublethis);
					 else dublethis.emit('result_findByUserID', res);
				 } else {
					 if (callback) callback.call(dublethis, null, null, dublethis);
				 };
				}.bind(dublethis));
			}
	});

};

// UserModel.addArchvive
UserModel.prototype.addArchvive = function (id, callback) {
		this.findByUserID(id, function(err, result) { 
		if(err || result === 0){
			if (callback) callback.call(this, 'Такой пользователь не существует.', null, this);
			else this.emit('error', 'Такой пользователь не существует.');
		}
		else{
			  this.client.multi([
			  ['sadd', this.pUsersArchive(), id],
			  ['srem', this.pUsersActive(), id],
			  ]).exec(function (err, repl) {
			  if (err) {
				  if (callback) callback.call(this, err, null, this);
				} else {
					 if (callback) callback.call(this, null, repl, this);
					};
				}.bind(this));
			}
		});
};

// UserModel.remove
UserModel.prototype.remove = function (username, callback) {

		this.getUserID(username, function(err, result) { 
		if(result === 0){
			if (callback) callback.call(this, 'Такой пользователь не существует', null, this);
		}
		else{
			  this.client.multi([
			  ['del', this.pUserName(result), this.kUserName(username)],
			  ]).exec(function (err, repl) {
			  if (err) {
				 if (callback) callback.call(this, err, null, this);
				} else {
					 if (callback) callback.call(this, null, repl, this);
					};
				}.bind(this));
			}
		});
};

// UserModel.findByUserName
UserModel.prototype.findByUserName = function (username, callback) {
	this.getUserID(username, function(err, result) { 
		if(result === 0){
			if (callback) callback.call(this, 'Такой пользователь не существует.', null, this);
			else this.emit('error', 'Такой пользователь не существует.');
		}
		else{
			// Конструрируем запрос
			var q = [this.pUserName(result), this.kName(), this.kLastName(), this.kSalt(), this.kPass(),this.kRole(),this.kPosition(),this.kCompany(),this.kTime()];
			this.client.multi([
			  ['hmget', q],
			  ['get', this.kUserName(username)],
			  ]).exec(function(err, repl) {
			 if (err) {
				 if (callback) callback.call(this, err, null, this);
				 else this.emit('error', err);
			 } else if (repl) {
				 var res1 = repl[0];
				 var res = this.exportmodel(username, res1[0], res1[1], res1[2], res1[3], res1[4], res1[5], res1[6], res1[7], repl[1]);
				 if (callback) callback.call(this, null, res, this);
				 else this.emit('result_findByUserName', res);
			 } else {
				 if (callback) callback.call(this, null, null, this);
			 };
			}.bind(this));
		}
	});
};

// UserModel.update
UserModel.prototype.update = function (username, callback) {
	this.getUserID(username, function(err, result) { 
		if(result === 0){
			if (callback) callback.call(this, 'Такой пользователь не существует.', null, this);
		}
		else{
			this._save.call(this, result, callback);
		}
	});
};

// UserModel.findUsersActive
UserModel.prototype.findUsersActive = function () {
	var self = this;
	this.client.smembers('usersActive:uid:', function(err, repl) {
		if (err) self.emit('error', err);
		else  self.emit('result_findUsersActive', repl);
	});
};
