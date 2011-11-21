
exports.SocketAction = function (socket, client) {
		
		socket.emit('connect_ok');
		
		require('../socket/users-socket').SocketAction(socket, client);

};
