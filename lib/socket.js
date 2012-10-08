var io = require('socket.io');
var redis = require('redis');
var client = redis.createClient();
var sys = require('util');
var process = require('events');
var userModel = require('../models/user');

var session = new Object;

exports.bootSocket = function (app) {
	io = io.listen(app);
	
	io.sockets.on('connection', function (socket) {
	socket.on('set session hash', function (name) {
		sessionFind(name.lastaccess, name.hash, function (err, result) { 
		if(err) console.log('Error sessionFind()');
		if(result){
			if(result[0] === name.hash && result[1] === name.username) {
				socketFindUserId(name.username, function (err, id) { 	
					socket.username = name.username;
					socket.lastaccess = name.lastaccess;
					socket.socketname = name.socketname;
					socket.userid = id;
					socket.hash = name.hash;
					socket.editdoc = '0';
					socket.nameuseredit = '0';
					socket.set('session hash', name, function () {
						socketNameFind(name.lastaccess, function (err, result) { 
						  if(err) console.log('Error socketnameFind()');
						  else {
							console.log('Сообщение послал: ', socket.username, socket.lastaccess);
							socket.emit('connect_ok');
							require('../socket/'+result).SocketAction(socket, client);
							require('../socket/editdoc-socket').SocketAction(socket, client);
						  }
						});
					});
				});
			}
			else {
				  socket.emit('offline');
				  console.log('Error access!');
				}
			}
		else console.log('No find '+name.username);
		});
	
	});
	
	socket.on('editdoc', function (namedoc, nameuseredit) {
		socket.editdoc = namedoc;
		socket.nameuseredit = nameuseredit;
    });
	
	socket.on('disconnect', function () {
	if(socket.lastaccess) {
			sessionDelete(socket.lastaccess);
			socketNameDelete(socket.lastaccess);
			if(socket.editdoc!='0'){
				socketEditFind(socket.editdoc, function (err, result) { 
					if(result == socket.nameuseredit) socketEditDelete(socket.editdoc);
				});
			}
		}
    console.log('disconnect by ', socket.username, socket.lastaccess);
    });
});
}

function socketEditFind (namedoc, callback) {
	client.get(namedoc, function(err, nameuser) {
   	  if (err) callback.call(this, err, null);
	  else callback.call(this, null, nameuser);
	});
}

function socketFindUserId (username, callback) {
	var user = new userModel(client);
	user.findByUserName(username, function(err, res) {
   	  if (err) callback.call(this, err, null);
	  else callback.call(this, null, res.u_id);
	});
}

function socketEditDelete (namedoc) {	
	client.del(namedoc, function(err) {
   	  if (err) console.log(err+'');
	  else {
			console.log('socketEditDelete delete');
		}
	});
}

function sessionFind (lastaccess, hash, callback) {
	client.mget(lastaccess, hash, function(err, repl) {
   	 if (err) { callback.call(this, err, null);
		}
	  else { callback.call(this, null, repl);}
	});

}

function sessionDelete (lastaccess) {
	client.del(lastaccess, function(err, repl){
	  if(err) console.log(err+'');
	  if(repl) console.log('session delete');
	});
}


function socketNameFind (lastaccess, callback) {
	client.get('socketname:'+lastaccess, function(err, repl) {
   	 if (err) { callback.call(this, err, null);
		}
	  else { callback.call(this, null, repl);}
	});

}

function socketNameDelete (lastaccess) {
	client.del('socketname:'+lastaccess, function(err, repl){
	  if(err) console.log(err+'');
	  if(repl) console.log('socketname delete');
	});
}