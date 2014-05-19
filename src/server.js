var express = require('express'),
		app = express(),
    server = require('http').createServer(app),
    cors = require('cors'),
    sio = require('socket.io').listen(server),
    multiparty = require('multiparty'),
    util = require('util'),
    mongoose = require('mongoose'),
    User = require('./user-model'),
    bodyParser = require('body-parser'),
    jwt = require('jsonwebtoken'),
    socketioJwt = require('socketio-jwt');

app.use('/media', express.static(__dirname + '/media'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

server.listen(4000);
app.use(cors());

var jwtSecret = "tajnikljuc";

mongoose.connect('mongodb://localhost/smartboard', function(err) {
  if(err) throw err;
  console.log('Successfully connected to MongoDB');
});

app.post('/api/images', function(req, res) {
  var form = new multiparty.Form();

  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));
  });

  return;	
});

app.post('/api/login', function(req, res) {
  var username = req.body.username,
      password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if(err) res.json({success: false, error: err });

    if(user !== null) {
      user.comparePassword(password, function(err, isMatch) {
        if(err) res.json({success: false, error: err });
        if(isMatch) {
          var token = jwt.sign(user, jwtSecret, { expiresInMinutes: 60*5 });

          res.json({success: true, token: token});
        } else {
          res.json({success: false, error: "Incorrect username/password" });
        }

      });
    } else {
      res.json({success: false, error: "Incorrect username/password"});
    }
  });
});

app.post('/api/register', function(req, res) {
  var username = req.body.username,
      password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if(err) res.json(err);

    if(user === null) {
      var user = new User({
        username: username,
        password: password
      });

      user.save(function(err) {
        if (err) res.json(err);

        res.json({ success: true });
      })
    } else {
      res.json({ success: false, error: "User already exists" });
    }
  });
});

sio.set('authorization', socketioJwt.authorize({
    secret: jwtSecret,
    handshake: true
  })
);

sio.sockets.on('connection', function(socket) {
  console.log(socket.handshake.decoded_token.email, 'connected');  
	
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
