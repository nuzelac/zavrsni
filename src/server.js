var express = require('express'),
		app = express(),
    server = require('http').createServer(app),
    cors = require('cors'),
    sio = require('socket.io').listen(server),
    multiparty = require('multiparty'),
    util = require('util'),
    mongoose = require('mongoose'),
    User = require('./user-model'),
    Board = require('./board-model')
    Widget = require('./widget-model'),
    bodyParser = require('body-parser'),
    jwt = require('jsonwebtoken'),
    socketioJwt = require('socketio-jwt'),
    expressJwt = require('express-jwt')
    path = require('path'),
    fs = require('fs');

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
  var form = new multiparty.Form({ uploadDir: __dirname + "/media/uploads"});

  form.parse(req, function(err, fields, files) {
    console.log(files);
    console.log(files.canvasPhoto);

    var file = files.canvasPhoto[0];
    var fileName = path.basename(file.path);

    res.json({ success: true, path: 'media/uploads/' + fileName});
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
          var token = jwt.sign({ _id: user._id, _username: user.username }, jwtSecret, { expiresInMinutes: 60*24 });

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

app.post('/api/boards',
  expressJwt({ secret: jwtSecret }),
  function(req, res) {
    var topic = req.body.topic;

    console.log("Authorized...");
    console.log(req.user);
    console.log("Topic: " + topic);

    User.findOne({ _id: req.user._id }, function(err, user) {
      if(err) res.json({success: false, error: err});

      var board = new Board({
        topic: topic
      });

      board.admins.push(user);
      board.users.push(user);
      board.save(function(err) {
        if (err) res.json({ success: false, error: err });

        sio.sockets.emit('newBoard');

        res.json({ success: true });        
      });
    });
  }
);

app.get('/api/boards',
  expressJwt({ secret: jwtSecret }),
  function(req, res) {
    User.findOne({ _id: req.user._id }, function(err, user) {
      if(err) res.json({success: false, error: err});

      Board.find({}, function(err, boards) {
        var userBoards = [];
        boards.forEach(function(board) {
          userBoards.push({
            _id: board._id,
            topic: board.topic,
            user: (board.users.indexOf(req.user._id) !== -1),
            admin: (board.admins.indexOf(req.user._id) !== -1),
          });
        });

        res.send({ success:true, boards: userBoards });
      });
    });
  }
);

app.get('/api/boards/:id',
  expressJwt({ secret: jwtSecret }),
  function(req, res) {
    User.findOne({ _id: req.user._id }, function(err, user) {
      if(err) res.json({success: false, error: err});

      Board.findOne({ _id: req.params.id }, function(err, board) {
        if(err) res.json({ success: false, error: err });
        if(board.users.indexOf(user._id) === -1) res.json({ success: false, error: "User not authorized to view the board" });
      
        Widget.find({
          '_id': { $in: board.widgets }
        }, function(err, widgets) {
          if(err) res.json({ success: false, error: err });

          res.send({ success:true, widgets: widgets });
        });

      });      
    });
  }
);

app.post('/api/boards/:id/widgets',
  expressJwt({ secret: jwtSecret }),
  function(req, res) {
    User.findOne({ _id: req.user._id }, function(err, user) {
      if(err) res.json({success: false, error: err});

      Board.findOne({ _id: req.params.id }, function(err, board) {
        if(err) res.json({ success: false, error: err });
        if(board.users.indexOf(user._id) === -1) res.json({ success: false, error: "User not authorized to view the board" });
      
        var widget = new Widget({ 
          type: req.body.type,
          x: req.body.x,
          y: req.body.y,
          width: req.body.width || null,
          height: req.body.height || null,
          data: JSON.stringify(req.body.data),
          board: board._id,
          user: user._id,
        });

        widget.save(function(err) {
          if(err) res.json({ success: false, error: err });

          sio.sockets.in(board._id).emit('newElement', widget);
          res.json({ success: true, widget: widget });
        });

      });      
    });
  }
);

app.post('/api/register', function(req, res) {
  var username = req.body.username,
      password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if(err) res.json({ success: false, error: err });

    if(user === null) {
      var user = new User({
        username: username,
        password: password
      });

      user.save(function(err) {
        if (err) res.json({ success: false, error: err });

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
  console.log('decoded_token');
  console.log(socket.handshake.decoded_token);
  // console.log(socket.handshake.decoded_token.email, 'connected');  
	
  socket.on('subscribe', function(data) {
    console.log("--- subscribe ---");
    console.log(socket.handshake.decoded_token);
    console.log(data.room);
    socket.join(data.room);
    console.log("--- subscribe end ---");
  });

	socket.on('moveElement', function(data) {
		console.log('moveElement');
		console.log(data);
    socket.broadcast.to(data.room).emit('moveElement', data);
		// socket.broadcast.emit('moveElement', data);
	});
});
