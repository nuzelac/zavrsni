var jwtoken, socket, boardId, layer;
var maxStageWidth = 800;
var maxStageHeight = 400;
var maxPageWidth = 900;
var maxPageHeight = 500;

var moveElementEvent = function(e) {
	var wId = e.target.id();
	if(wId === undefined) return;
	var x = e.target.getX();
	var y = e.target.getY();

	socket.emit('moveElement', {
		x: x,
		y: y,
		id: wId,
		room: boardId,
	});

	if(e.type == "dragend") {
		saveElementData(wId, x, y)
	}
}

var resizeElementEvent = function(e) {
	console.log("Resizing element");
	console.log(e);
	var wId = e.target.id();
	var x = e.x;
	var y = e.y;
	var width = e.width;
	var height = e.height;

	socket.emit('resizeElement', {
		id: wId,
		x: x,
		y: y,
		width: width,
		height: height,
		room: boardId,
	})
}

var saveElementData = function(wid, x, y, width, height) {
	$.ajax({
		url:'/api/boards/' + boardId + '/widgets/' + wid,
		type: 'PUT',
		data: {
			x: x,
			y: y,
			width: width || null,
			height: height || null,
		}
	}).success(function(data) {
		if(data.success === true) {
		} else {
			alert(data.error);
		}
	}).fail(function(data) {
		alert("Error! Please try again later");
	});

}

jQuery(function() {
	var transitionToMainMenu = function() {
		// hide login
		$('.form-signin').hide();
		$('#mainMenu').show();
	};

	var transitionToBoard = function(data) {
		$('#mainMenu').hide();
		$('#board').show();
	}

	var loadBoards = function() {
		$.get('/api/boards')
			.success(function(data) {
				$('#existing-board-list').empty();
				data.boards.forEach(function(board) {
					var html = "<li>";
					html += board.topic + ", user: " + board.user + ", admin: " + board.admin + " ";
					if(board.user) {
				  	html += "<a href='#" + board._id + "' data-board-id='" + board._id +"' class='join-board-link'>Join</a>";
					} else if(board.requested) {
						html += "Access requested";
					} else {
						html += "<a href='#" + board._id + "' data-board-id='" + board._id +"' class='request-board-link'>Request access</a>";
					}
					html += "</li>";
					$('#existing-board-list').append(html);
				});

			})
			.fail(function(data) {
				alert("error loading boards");
			});
	}

	var loadRequests = function() {
		$.get('/api/boards/requests')
			.success(function(data) {
				$('#join-request-list').empty();
				data.requests.forEach(function(request) {
					var html = "<li>";
					html += "User <strong>" + request.user.username + "</strong> wants to join board <strong>" + request.board.topic + "</strong> "
					html += "<a href='#" + request._id + "' data-request-id='" + request._id +"' class='approve-request-link'>[OK]</a>";
					html += " / ";
					html += "<a href='#" + request._id + "' data-request-id='" + request._id +"' class='decline-request-link'>[Cancel]</a>";
					html += "</li>";
					$('#join-request-list').append(html);
				});

			})
			.fail(function(data) {
				alert("error loading boards");
			});
	}


	var loadWidget = function(widget) {
		if('type' in widget) {
			var data = JSON.parse(widget.data);
			delete(widget.data);
			WidgetLoader(widget.type, widget, data);
		}		
	}

	var loadWidgets = function(widgets) {
		widgets.forEach(function(widget) {
			loadWidget(widget);
		});
	};

	var setupSocketIO = function(jwtoken) {
		socket = io.connect('http://localhost:4000', {
			query: 'token=' + jwtoken
		});

		socket.on('newBoard', function(data) {
			loadBoards();
		})

		socket.on('updateAccess', function(data) {
			loadBoards();
			loadRequests();
		});

		socket.on('newElement', function(widget) {
			if(stage.find('#' + widget._id).length === 0) {
				console.log("loading newElement");
				loadWidget(widget);
			}
		});

		socket.on('createElement', function(data) {
			console.log(data);
			if(data.type === 'text') {
				addText(data.x, data.y, data.text, data.id);
			}
		});

		socket.on('moveElement', function(data) {
			console.log("moving " + data.id);

			var widget = layer.find('#' + data.id)[0];

			widget.setPosition({x: data.x, y: data.y});
			layer.draw();
		});

		socket.on('resizeElement', function(data) {
			console.log("resizing " + data.id);

			var newWidth = data.width;
			var newHeight = data.height;

			var group = layer.find('#' + data.id)[0];
			var image = group.get(".image")[0];
			image.setPosition({x: data.x, y: data.y});

      image.setSize({
        width: newWidth, 
        height: newHeight
      });

			var imageX = image.getX();
			var imageY = image.getY();

		  var topLeft = group.get(".topLeft")[0],
		      topRight = group.get(".topRight")[0],
		      bottomRight = group.get(".bottomRight")[0],
		      bottomLeft = group.get(".bottomLeft")[0];

		  topLeft.setPosition({ x: imageX, y: imageY});
		  topRight.setPosition({ x: imageX + newWidth, y: imageY });
		  bottomRight.setPosition({ x: imageX + newWidth, y: imageY + newHeight});
		  bottomLeft.setPosition({ x: imageX, y: imageY + newHeight});
			layer.draw();
		});		
	}

	$.ajaxSetup({
	    beforeSend: function(xhr) {
	        if (!jwtoken) return;
	        xhr.setRequestHeader('Authorization', 'Bearer ' + jwtoken);
	    }
	});

	$('#login').click(function(e) {
		e.preventDefault();

		$.post('/api/login', {
			username: $('#username').val(),
			password: $('#password').val()
		}).success(function(data) {
			if(data.success === true) {
				console.log("Logged in ...");
				console.log(data);
				// show drawing board
				jwtoken = data.token;

				setupSocketIO(jwtoken);
				transitionToMainMenu();
				loadBoards();
				loadRequests();
			} else {
				alert(data.error);
			}
		}).fail(function(data) {
			alert("Error! Please try again later");
		});
	});

	$('#new-board-submit').click(function(e) {
		e.preventDefault();

		$.post('/api/boards', {
			topic: $('#new-board-topic').val(),
			token: jwtoken,
		}).success(function(data) {
			console.log("success board creation");
			console.log(data);
		}).fail(function(data) {
			console.log("fail board creation");
			console.log(data);
		});
	});

	$(document).on('click', '.join-board-link', function(e) {
		e.preventDefault();

		var id = $(e.target).data('board-id');
		$.get('/api/boards/' + id)
				.success(function(data) {
					boardId = id;
					socket.emit("subscribe", { room: id });
					console.log(data.widgets);
					loadWidgets(data.widgets);
					transitionToBoard(data);
				})
				.fail(function(data) {
					alert("Error loading board");
				});
	});

	$(document).on('click', '.request-board-link', function(e) {
		e.preventDefault();

		var id = $(e.target).data('board-id');
		$.post('/api/boards/' + id + '/requests')
				.success(function(data) {
				})
				.fail(function(data) {
					alert("Error loading board");
				});
	});

	$(document).on('click', '.approve-request-link', function(e) {
		e.preventDefault();

		var id = $(e.target).data('request-id');
		$.post('/api/boards/requests/' + id + '/approve')
				.success(function(data) {
					loadBoards();
					loadRequests();
				})
				.fail(function(data) {
					alert("Error loading board");
				});
	});

	$(document).on('click', '.decline-request-link', function(e) {
		e.preventDefault();

		var id = $(e.target).data('request-id');
		$.post('/api/boards/requests/' + id + '/decline')
				.success(function(data) {
					loadBoards();
					loadRequests();
				})
				.fail(function(data) {
					alert("Error loading board");
				});
	});


	$('.board-tool').draggable({
		helper: 'clone',
		containment: 'container',
		// stop: function (ev, ui) {

		// }
	});

	$('#container').droppable({
		drop: function (ev, ui) {
			var x = (ui.position.left) / stage.getAttr('scaleX');
			var y = (ui.position.top+16) / stage.getAttr('scaleY');
			var widget = WidgetCreator(ui.draggable.data('tool-type'), x, y);
		}
	});

	// Check to see if window is less than desired width and calls sizing functions
	function setStageWidth() {
			// console.log("pozz");
	    if (window.innerWidth < maxPageWidth) {
	        resizeStage();
	    } else {
	        maxStageSize();
	    };
	};

	 // Sets scale and dimensions of stage in relation to window size
  function resizeStage() {
     var horizScalePercentage = window.innerWidth / maxPageWidth; 
     var vertiScalePercentage = window.innerHeight/ maxPageHeight; 
		 // var horizScalePercentage = $('#container-holder').width()  / maxPageWidth; 
     // var vertiScalePercentage = $('#container-holder').height() / maxPageHeight; 

     var scalePercentage = Math.min(horizScalePercentage, vertiScalePercentage);

     stage.setAttr('scaleX', scalePercentage );
     stage.setAttr('scaleY', scalePercentage );

     stage.setAttr('width', maxStageWidth * scalePercentage );
     stage.setAttr('height', maxStageHeight * scalePercentage );
     stage.draw();
  };

  //Sets scale and dimensions of stage to max settings
  function maxStageSize() {
      stage.setAttr('scaleX', 1);
      stage.setAttr('scaleY', 1);
      stage.setAttr('width', maxStageWidth);
      stage.setAttr('height', maxStageHeight);
      stage.draw();
  };

	var stage = new Kinetic.Stage({
	    container: 'container',
	    width: maxStageWidth,
	    height: maxStageHeight,
	    scaleX: 1,
	    scaleY: 1,
	});

	// On load we set stage size based on window size
	setStageWidth();

	// On window resize we resize the stage size
	window.addEventListener('resize', setStageWidth);

	layer = new Kinetic.Layer();
	stage.add(layer);

});		
