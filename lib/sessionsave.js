var redis = require('redis');
var client = redis.createClient();
var sys = require('util');
var process = require('events');
var mysys = require('../lib/my_sys');


var SocketLib = module.exports = function () {
	
	process.EventEmitter.call(this);
};

sys.inherits(SocketLib, process.EventEmitter);

SocketLib.prototype.sessionSave = function (user) {	
	var self = this;
	client.set(user.lastaccess, user.hash, function(err) {
   	  if (err) self.emit ('error');
	  else { client.expire(user.lastaccess, 60*60*10);
		     client.set(user.hash, user.username, function(err) {
			  if (err) self.emit ('error');
		      else {
				  client.expire(user.hash, 60*60*10);
				  self.emit('SessionSave_Ok');
			  }
		  });
		}
	});
}

SocketLib.prototype.socketnameSave = function (socketname, lastaccess) {
	var self = this;	
	client.set('socketname:'+lastaccess, socketname, function(err) {
   	  if (err) self.emit('error');
	  else {
		  client.expire('socketname:'+lastaccess, 60*60*10);
		  self.emit('SocketnameSave_Ok');
		}
	});
}

SocketLib.prototype.socketEditSave = function (namedoc, nameuser, time_save) {
	var self = this;	
	client.set(namedoc, nameuser, function(err) {
   	  if (err) self.emit('error');
	  else {
		  client.expire(namedoc, 60*10);
		  client.set(namedoc+'time', time_save, function(err) {
				if (err) self.emit('error');
				else {
					client.expire(namedoc, 60*10);
					self.emit('SocketEditSave_Ok');
				}
		  });
		}
	});
}

SocketLib.prototype.socketEditFind = function (namedoc) {
	var self = this;
	client.get(namedoc, function(err, nameuser) {
   	  if (err) self.emit('error');
	  else {
			client.get(namedoc+'time', function(err, time) {
				if (err) self.emit('error');
				else {time = mysys.formatTime(time); self.emit('SocketEditFind_Ok', nameuser, time);}
		  });
		}
	});
}

SocketLib.prototype.socketEditDelete = function (namedoc) {
	var self = this;	
	client.del(namedoc, function(err) {
   	  if (err) self.emit('error');
	  else {
			self.emit('SocketEditDelete_Ok');
		}
	});
}

SocketLib.prototype.socketTimeDocSave = function (namedoc) {
	var self = this;	
	var date_save = new Date();
	date_save = date_save.getTime();
	var res = date_save.toString();
	client.set('time:'+namedoc, res, function(err) {
   	  if (err) self.emit('error');
	  else {
		  client.expire(namedoc+'time', 60*60*10);
		  self.emit('SocketTimeDocSave_Ok');
		}
	});
}

SocketLib.prototype.socketTimeDocSimile = function (namedoc) {
	var self = this;	
	client.get('time:'+namedoc, function(err, result) {
   	  if (err) self.emit('error');
	  else {
		  self.emit('SocketTimeDocSimile_Ok', result);
		}
	});
}