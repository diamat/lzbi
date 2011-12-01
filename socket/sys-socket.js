var mb = 1024*1024;
var os = require('os');


exports.SocketAction = function (socket, client) {

	socket.emit('sys_start');
	
	socket.on('sys_data', function () {
		var redis_memory;
		client.info(function(err, data) {
			if (err) console.log('error '+err);
			else {
				redis_memory = data.substring(data.indexOf("used_memory:")+12, data.indexOf("used_memory_human:")-1); redis_memory = parseInt(redis_memory); 
				socket.emit('sys_data_update', (process.memoryUsage().rss/mb).toFixed(2), (process.memoryUsage().heapTotal/mb).toFixed(2), (process.memoryUsage().heapUsed/mb).toFixed(2), (redis_memory/mb).toFixed(2), (os.totalmem()/mb).toFixed(2), (os.freemem()/mb).toFixed(2));
			}
		});	
	});
		
};