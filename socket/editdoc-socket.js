var mysys = require('../lib/my_sys');
var sessionsave = require('../lib/sessionsave');

exports.SocketAction = function (socket, client) {

			socket.on('go_time_edit', function (field, value) {
				var newsocketio = new sessionsave();
				newsocketio.socketEditFind (field);
				
				newsocketio.on('SocketEditFind_Ok', function(nameuser, time_save){
					if(nameuser === null || nameuser == value){
						newsocketio.socketEditSave (field, value, mysys.dateSave());
						newsocketio.on('SocketEditSave_Ok', function(){
							socket.emit('go_time_edit_Ok');
						});
					}
					else {
						socket.emit('error_go_time_edit', nameuser+' (документ открыт для редактирования - '+time_save+')');
					}
				});
				
			});
			
			socket.on('simile_save', function (namedoc, time) {
				var newsocketio = new sessionsave();
				newsocketio.socketTimeDocSimile(namedoc);
				
				newsocketio.on('error', function(){
					console.log('error_simile_save');
				});
				
				newsocketio.on('SocketTimeDocSimile_Ok', function(result){
					if(result){
					console.log(result+' >'+time)
					if(result>time) socket.emit('TimeDocSimile', 'not');
					else socket.emit('TimeDocSimile', 'ok');
					}
					else socket.emit('TimeDocSimile', 'ok');
				});
			});
			
			socket.on('simile_save2', function (namedoc, time) {	
				var newsocketio = new sessionsave();
				newsocketio.socketTimeDocSimile(namedoc);
				
				newsocketio.on('error', function(){
					console.log('error_simile_save2');
				});
				
				newsocketio.on('SocketTimeDocSimile_Ok', function(result){
					if(result){
					if(result>time) socket.emit('error_go_time_edit2');
					else socket.emit('go_time_edit_Ok2');
					}
					else socket.emit('go_time_edit_Ok2');
				});
			});

}