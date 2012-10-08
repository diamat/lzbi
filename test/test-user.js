var   	redis = require('redis');
var     client = redis.createClient();
var     UserModel = require('./models/user');
var async = require('async');
 
var user = new UserModel(client);

var semen = user.create('diamat','Семён','Разыграев','ыфдефва','768185', 'admin', 'Администратор корпоративной сети', '1');

//var semen2 = user.create('diamat7','Юлия','Диок','ыфдефва','768185', 'admin', 'PR', '1');


var id = 40;
var role = 'manager'
async.series([
	function (callback){
		semen.save(function (err, res) {
		if(err) callback(err);
		else {
			console.log(res.saveInRedis);
			id=res.saveInRedis;
			callback(null, 'Сохранили!');
			}
		});
	}/*,
	function (callback){
			user.ListUserByRole(role, function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список role!');
		 }
		});
	},
	function (callback){
			user.findByUserID('dv', function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 console.log('User: '+res.username+' id: ' + res.id + '; name: ' + res.name+'; lastname: '+ res.lastname +'; pass: '+res.pass+' salt: '+res.salt+' Role: '+res.role);
			 console.log('Должность:' + res.position + ' Комп: ' + res.company + ' Время рег.:' + res.time);
			 callback(null, 'нашёл по id!');
		 }
		});
	},
	function (callback){
		semen2.update('diamat7', function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 callback(null, 'update!');
		 }
		});
	},
	function (callback){
			user.findUsersArchive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список архивных пользователей!');
		 }
		});
	},
	function (callback){
		semen2.addArchvive(id, function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 callback(null, 'addArchive!');
		 }
		});
	},
	function (callback){
			user.findUsersActive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список активных пользователей!');
		 }
		});
	},
	function (callback){
			user.findUsersArchive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список архивных пользователей!');
		 }
		});
	},
	function (callback){
		semen2.addActive(id, function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 callback(null, 'addActive!');
		 }
		});
	},
	function (callback){
		semen2.addActive(id, function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 callback(null, 'addActive!');
		 }
		});
	},
	function (callback){
			user.findUsersActive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список активных пользователей!');
		 }
		});
	}/*,
	function (callback){
			user.findUsersArchive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список архивных пользователей!');
		 }
		});
	},
	function (callback){
			user.findByUserName('diamat7', function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			 console.log('User: '+res.username+' id: ' + res.id + '; name: ' + res.name+'; lastname: '+ res.lastname +'; pass: '+res.pass+' salt: '+res.salt+' Role: '+res.role);
			 console.log('Должность:' + res.position + ' Комп: ' + res.company + ' Время рег.:' + res.time);
			 callback(null, 'нашёл по username!');
		 }
		});
	},
	function (callback){
		user.remove('diamat7',function (err, res) {
		if(err) callback(err);
		else callback(null, 'удалил!');
		});	
	},
	function (callback){
			user.findUsersArchive(function (err, res) {
		 if (err) {
			 callback(err);
		 } else {
			console.log(res);
			callback(null, 'список архивных пользователей!');
		 }
		});
	}*/
	],
    function(err, results){
        if(err) console.log(err);
		else console.log(results);
    });
/*
semen.save(function (err, res) {
	if(err) console.log(err);
    else console.log(res.saveInRedis);
	});

	
user.findByUserName('diamatchik', function (err, res) {
   	 if (err) {
   		 console.log('' + err);
   		 user.client.quit();
   	 } else {
   		 console.log('User: '+res.username+' id: ' + res.id + '; name: ' + res.name+'; lastname: '+ res.lastname +'; pass: '+res.pass+' salt: '+res.salt+' Role: '+res.role);
		 console.log('Должность:' + res.position + ' Комп: ' + res.company + ' Время рег.:' + res.time);
   	 }
    });
	

user.remove('diamatchik',function (err, res) {
	if(err) console.log(''+err);
    else console.log(res);
	});	*/