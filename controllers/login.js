var redis = require('redis');
var client = redis.createClient();
var UserModel = require('../models/user');
var my_sys = require('../lib/my_sys');
var sanitize = require('validator').sanitize;
var CustomerSQL = require('../models/customers_main');

var users = new UserModel(client);

module.exports = {
  
    index: function(req, res){
      if (req.session.user) {
		 req.session.success = 'Пользователь ' + req.session.user.name
         + ' авторизован. <a href="/login/logout">logout</a>. ';
        }
		res.render('login');
    },
	
	login: function(req, res){
	  var san_user = sanitize(req.body.username).entityEncode();
	  var san_pass = sanitize(req.body.password).entityEncode();
	  authenticate(san_user, san_pass, req.body.checksession, function(err, check, user){
            if (user) {
				 req.session.regenerate(function(){
				 req.session.user = user;
				 if(check == '1') req.session.cookie.expires = false;
                 res.redirect('/');
				});
			} else {
			     req.session.error = 'Ошибка авторизации, неверный логин или пароль.';
			     res.redirect('login');
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
			 console.log('' + err);
			 callback.call(this, null, null, null);
		 } else if (res) {
			 var user = new Object;
			 var time = new Date();
			 var customersql = new CustomerSQL();
			 customersql.SelectCustomerMin(res.company);
			 
			 customersql.on('finished', function(namecompany){
				user.username = res.username;
				user.name = res.name;
				user.lastname = res.lastname;
				user.role = res.role;
				user.id = res.id;
				user.position = res.position;
				user.company = res.company;
				if(namecompany)
				user.companyname = namecompany.NAME_SOB+' &laquo;'+namecompany.NAME+'&raquo;';
				else user.companyname = 'не указан';
				user.hash = my_sys.getHash(res.pass, time.toString()).substring(0,19);
				var check = '0';
				if (check_par) check='1';
				if (res.pass == my_sys.getHash(pass, res.salt)) callback.call(this, null, check, user);
				else callback.call(this, null, null, null);
			 });
			 
			 customersql.on('error', function(namecompany){
				callback.call(this, null, null, null);
			 });
		 } else {
			 callback.call(this, null, null, null);
		 }
		});
	}
	else {callback.call(this, null, null, null);}
}