var sys = require('util');
var mb = 1024*1024;
var events = require('events');
var redis = require('redis');
var client = redis.createClient();
var RData = require('../models/rdata');
var sessionsave = require('../lib/sessionsave');
var erraccess = 'error/err-access.html';
var os = require('os');

exports.controllerRouting = function controllerRouting (action, req, res, role, main_menu){
switch(action){
	case 'main': {
				
				var user = req.session.user;
				user.lastaccess = req.session.lastAccess;
				var newsocketio = new sessionsave();
				
				newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
				res.render(req.params.menu, {
						locals: {
								user: user, 
								main_menu: main_menu,
								action: req.params.menu,
								edit: 'нет',
								rss: (process.memoryUsage().rss/mb).toFixed(2),
								heapTotal: (process.memoryUsage().heapTotal/mb).toFixed(2),
								heapUsed: (process.memoryUsage().heapUsed/mb).toFixed(2),
								RedisMemory: (client.server_info.used_memory/mb).toFixed(2),
								totalmem: (os.totalmem()/mb).toFixed(2),
								freemem: (os.freemem()/mb).toFixed(2)
							}
				});
				
			}
		break;
		
	
	case 'edit': {
			var DateArray = new RData();
			DateArray.SelectProd(req.params.id);
					
			DateArray.on('finished', function(result){
				var user = req.session.user;
				user.lastaccess = req.session.lastAccess;
				var newsocketio = new sessionsave();
				newsocketio.SocketnameSave(req.params.menu+'-socket.js', user.lastaccess);
				res.render(req.params.menu+'/edit', {
					locals: {
							user: user, 
							main_menu: main_menu,
							action: 'нет',
							edit: 'нет',
							editform: req.params.form,
							dataedit: result[0]
					}
				});
			});
		}
		break;	
	}
};