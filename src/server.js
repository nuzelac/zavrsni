(function() {
	var io = require('socket.io').listen(4000);
	io.sockets.on('connection', function(socket) {
		socket.on('createElement', function(data) {
			console.log('createElement');
			console.log(data);
			socket.broadcast.emit('createElement', {
				x: data.x,
				y: data.y,
				type: data.type,
				info: data.info
			})
		});
	});
}).call(this);