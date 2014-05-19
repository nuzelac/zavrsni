var express = require('express'),
		app = express(),
    server = require('http').createServer(app),
    cors = require('cors'),
    io = require('socket.io').listen(server),
    multiparty = require('multiparty'),
    util = require('util');

app.use('/media', express.static(__dirname + '/media'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use(express.static(__dirname + '/public'));

server.listen(4000);
app.use(cors());

app.post('/api/images', function(req, res) {
  var form = new multiparty.Form();

  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));
  });

  return;	
});

io.sockets.on('connection', function(socket) {
	socket.on('createElement', function(data) {
		console.log('createElement');
		console.log(data);
		socket.broadcast.emit('createElement', data);
	});

	socket.on('moveElement', function(data) {
		console.log('moveElement');
		console.log(data);
		socket.broadcast.emit('moveElement', data);
	});
});
