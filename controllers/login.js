var redis = require('redis');
var client = redis.createClient();
var userModel = require('../models/user');
var my_sys = require('../lib/my_sys');
var sanitize = require('validator').sanitize;

var users = new userModel(client);

module.exports = {
  
    index: function(req, res){
      if (req.session.user) {
		 req.session.success = 'Пользователь ' + req.session.user.name
         + ' авторизован. <a href="/login/logout">logout</a>. ';
        }
		var message_login_param;
		var message_login;
		if (req.session.success) message_login_param = 'success';
		else message_login_param = 'error';
		var err = req.session.error;
		var msg = req.session.success;
		delete req.session.error;
		delete req.session.success;
		if (err) message_login = err;
		if (msg) message_login = msg;
		res.render('login', {
					message_login_param: message_login_param,
					message_login: message_login
					
			});
    },
	
	login: function(req, res){
	  var san_user = sanitize(req.body.username).entityEncode();
	  var san_pass = sanitize(req.body.password).entityEncode();
	  authenticate(san_user, san_pass, req.body.checksession, function(err, check, user){
            if (user) {
				 req.session.regenerate(function(){
				 req.session.user = user;
				 var hour = 36000000;
				 console.log('req.session.cookie.expires '+new Date(Date.now()));
				 console.log('req.session.cookie.expires '+new Date(Date.now() + hour));
				 req.session.cookie.expires = new Date(Date.now() + hour);
				 req.session.cookie.originalMaxAge = hour;
				 if(check == '1') req.session.cookie.expires = false;
                 res.redirect('/');
				});
			} else {
			     req.session.error = 'Ошибка авторизации, неверный логин или пароль.';
			     res.redirect('/login');
				}
		});
	},
	
	logout: function(req, res){
		req.session.destroy(function(){
		  res.redirect('/login');
		});
	}

};

function hash(msg, key) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}


function authenticate(name, pass, check_par, callback) {
	if(name&&pass) {
		users.findByUserName(name, function (err, res, fn) {
		 if (err) {
			 callback.call(this, null, null, null);
		 } else if (res) {
			 var user = new Object;
			 var time = new Date();

				var namecompany;
				user.username = res.username;
				user.name = res.name;
				user.lastname = res.lastname;
				user.role = res.role;
				user.id = res.u_id;
				user.position = res.position;
				user.company = res.company;
				if(user.company === '1') user.companyname = 'ООО &laquo;ЛЗБИ&raquo;';
				else if(user.company === '2') user.companyname = 'ООО &laquo;ВФП&raquo;';
				else user.companyname = 'не указан';
				user.hash = my_sys.getHash(res.pass, time.toString()).substring(0,19);
				var check = '0';
				if (check_par) check='1';
				if (res.pass == my_sys.getHash(pass, res.salt)) callback(null, check, user);
				else callback(null, null, null);
		 } else {
			 callback(null, null, null);
		 }
		});
	}
	else {callback(null, null, null);}
}