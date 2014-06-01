var jwtoken, socket, boardId, layer;
var maxStageWidth = 800;
var maxStageHeight = 400;
var maxPageWidth = 900;
var maxPageHeight = 500;

var moveElementEvent = function(e) {
	console.log(e);
	socket.emit('moveElement', {
		x: e.target.getX(),
		y: e.target.getY(),
		id: e.target.id(),
		room: boardId,
	})
}

function newTextWidget(widget, data) {
	data.x = widget.x;
	data.y = widget.y;
	data.id = widget._id;

	var kineticText = new Kinetic.Text(data);

	kineticText.on('dragstart dragmove dragend', moveElementEvent);
	
	layer.add(kineticText);
	layer.draw();				
}

function TextWidgetCreator(x, y) {
	var text = window.prompt("Please enter text", "");
	if(text == null) return null;

	var data = {
		text: text,
		fontSize: 30,
		fontFamily: 'Calibri',
		fill: 'green',
		draggable: true,
	};

	$.post('/api/boards/' + boardId + '/widgets', {
		type: 'Text',
		x: x,
		y: y,
		data: data,
	}).success(function(data) {
		if(data.success === true) {
			var widget = data.widget;
			var data = JSON.parse(widget.data);
			newTextWidget(data);
		} else {
			alert(data.error);
		}
	}).fail(function(data) {
		alert("Error! Please try again later");
	});
}

function TextWidgetLoader(widget, data) {
	console.log("creating text widget with data:");
	console.log(widget);
	console.log(data);
	newTextWidget(widget, data);
}

function WidgetCreator(name) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	return self[name + "WidgetCreator"].apply(this, args);
}

function WidgetLoader(name) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	return self[name + "WidgetLoader"].apply(this, args);	
}

function newImageWidget(widget, data) {
	var group = new Kinetic.Group({
		x: widget.x,
		y: widget.y,
		draggable: true,
	  id: widget._id
	});
  layer.add(group);

  var image = new Kinetic.Image({
	  x: 0,
	  y: 0,
	  image: data.imageObj,
	  width: widget.width,
	  height: widget.height,
	  name: "image",
  });

  group.add(image);
  addAnchor(group, 0, 0, "topLeft");
  addAnchor(group, widget.width, 0, "topRight");
  addAnchor(group, widget.width, widget.height, "bottomRight");
  addAnchor(group, 0, widget.height, "bottomLeft");

  group.moveToBottom();
  layer.draw();
}

function ImageWidgetCreator(x, y) {
	$('#imageUploadModal').on('hidden.bs.modal', function() {
		$('#imageUploadForm').off('submit');
	});

	$('#imageUploadModal').modal('show');

	$('#imageUploadForm').submit(function(e) {
		e.preventDefault();

		$(this).ajaxSubmit({ 
			error: function(xhr) {
				$('#canvasPhotoInput').val('');
				console.log("ERROR uploading file");
			},

			success: function(response) {
				$('#canvasPhotoInput').val('');
				$('#imageUploadModal').modal('hide');
				if(response.error) {
					alert("ERROR from server while uploading file");
					return;
				}

				var imageUrl = response.path;
				console.log(imageUrl);

			  var imageObj = new Image();
			  imageObj.onload = function() {
				  var maxdim = 100;
				  var ratio;
				  if(imageObj.width <= maxdim && imageObj.height <= maxdim) {
				  	ratio = 1;
				  } else {
				  	ratio = Math.max(imageObj.width / maxdim, imageObj.height / maxdim);
				  }
				  var width = imageObj.width / ratio;
				  var height = imageObj.height / ratio;

					var data = {
			  		src: response.path,
					}

					$.post('/api/boards/' + boardId + '/widgets', {
						type: 'Image',
						x: x,
						y: y,
						width: width,
						height: height,
						data: data
					}).success(function(data) {
						if(data.success === true) {
							var widget = data.widget;
							var data = JSON.parse(widget.data);
							delete widget.data;

							data.imageObj = imageObj;
							newImageWidget(widget, data);
						} else {
							alert(data.error);
						}
					}).fail(function(data) {
						alert("Error! Please try again later");
					});
			  }
			  imageObj.src = imageUrl;					
			}
		});
	});
}

function ImageWidgetLoader(widget, data) {
	console.log("creating image widget");
	console.log(widget);
	console.log(data);

	var imageUrl = data.src;
  var imageObj = new Image();
  imageObj.onload = function() {
		data.imageObj = imageObj;
		newImageWidget(widget, data);
  }
  imageObj.src = imageUrl;		
}


// function newLinkWidget(id, x, y, href) {
// }

// function LinkWidgetCreator(x, y) {
// 	var link = window.prompt("Please enter the link", "http://");
// 	if(link == null) return null;

// 	var id = 'link' + Math.random();

// 	var kineticText = new Kinetic.Text({
// 		x: x,
// 		y: y,
// 		text: link,
// 		fontSize: 30,
// 		fontFamily: 'Calibri',
// 		fill: 'blue',
// 		draggable: true,
// 		id: id
// 	});

// 	kineticText.on('dblclick dbltap', function(e) {
// 		var url = e.target.text();
// 		window.open(url, '_blank');
// 	});

// 	// kineticText.on('dragstart dragmove dragend', function(e) {
// 	// 	// console.log(e);
// 	// 	socket.emit('moveElement', {
// 	// 		x: e.clientX,
// 	// 		y: e.clientY,
// 	// 		id: id
// 	// 	})
// 	// });
	
// 	layer.add(kineticText);
// 	layer.draw();
		
// }
// // function VideoWidget(x, y) {
// // 	this.base = BoardWidget;
// // 	this.base(x, y);		
// // }
// // VideoWidget.prototype = new BoardWidget;


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
					$('#existing-board-list').append("<li>" + board.topic + ", user: " + board.user + ", admin: " + board.admin + " <a href='#" + board._id + "' data-board-id='" + board._id +"' class='join-board-link'>Join</a></li>");
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



	// var $addingWhat = jQuery('#adding-what');

	// jQuery('.widget-select').click(function(e) {
	// 	e.preventDefault();
	// 	var $el = jQuery(this);
	// 	if($el.data('active') === '1') {
	// 		var children = layer.getChildren();
	// 		for(var i = 0; i < children.length; ++i) {
	// 			// console.log(children[i]);
	// 			children[i].setDraggable(true);
	// 		}
	// 		$el.data('active', '0');
	// 		$addingWhat.html('nothing');
	// 	} else {
	// 		var children = layer.getChildren();
	// 		for(var i = 0; i < children.length; ++i) {
	// 			// console.log(children[i]);
	// 			children[i].setDraggable(false);
	// 		}
	// 		jQuery('.widget-select').each(function() { jQuery(this).data('active', '0') });
	// 		$el.data('active', '1');
	// 		$addingWhat.html($el.data('type'));
	// 	}
	// 	// console.log($el.data('type'));
	// });

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

	// var circles = new Kinetic.Layer();

	// var circleRed = new Kinetic.Circle({
	//     x: stage.getWidth() / 2,
	//     y: stage.getHeight() / 2,
	//     radius: 100,
	//     stroke: 'black',
	//     strokeWidth: 2,
	//     fill: 'red'
	// });

	// var circleBlue = new Kinetic.Circle({
	//     x: stage.getWidth() / 2 + 120,
	//     y: stage.getHeight() / 2 + 175,
	//     radius: 50,
	//     stroke: 'black',
	//     strokeWidth: 2,
	//     fill: 'blue'
	// });

	// var circleOrange = new Kinetic.Circle({
	//     x: stage.getWidth() / 2 - 175,
	//     y: stage.getHeight() / 2 + 100,
	//     radius: 75,
	//     stroke: 'black',
	//     strokeWidth: 2,
	//     fill: 'orange'
	// });

	// circles.add(circleRed);
	// circles.add(circleBlue);
	// circles.add(circleOrange);

	// stage.add(circles);

	// On load we set stage size based on window size
	setStageWidth();

	// On window resize we resize the stage size
	window.addEventListener('resize', setStageWidth);

	layer = new Kinetic.Layer();
	stage.add(layer);

	// addText(100, 100, "Pozdrav", "1");

	// function addText(x, y, text, id) {
	// 	var kineticText = new Kinetic.Text({
	// 		x: x,
	// 		y: y,
	// 		text: text,
	// 		fontSize: 30,
	// 		fontFamily: 'Calibri',
	// 		fill: 'green',
	// 		draggable: true,
	// 		id: id
	// 	});

	// 	kineticText.on('dragstart dragmove dragend', function(e) {
	// 		// console.log(e);
	// 		socket.emit('moveElement', {
	// 			x: e.clientX,
	// 			y: e.clientY,
	// 			id: id
	// 		})
	// 	});
		
	// 	layer.add(kineticText);
	// 	layer.draw();
	// }

	// dodati i za touchdown
	// stage.getContainer().addEventListener('mousedown', function(e) {
	// 	if($addingWhat.html() === 'text') {
	// 		var text = window.prompt("Please enter text", "");
	// 		if(text != null) {
	// 			var id = 'text' + Math.random();

	// 			addText(e.pageX, e.pageY, text, id);
				
	// 			socket.emit('createElement', { 
	// 				x: e.pageX,
	// 				y: e.pageY,
	// 				type: 'text',
	// 				text: text,
	// 				id: id
	// 			});
	// 		}
	// 	} else if($addingWhat.html() === 'image') {
	// 		$('#imageUploadModal').modal({

	// 		});

	// 		var timer;
	// 		timer = setInterval(function() {
	// 			if($('#canvasPhotoInput').val() !== '') {
	// 				clearInterval(timer);
	// 				$('#imageUploadForm').submit();
	// 			}
	// 		}, 500);

	// 		$('#imageUploadForm').submit(function(e) {
	// 			e.preventDefault();

	// 			$(this).ajaxSubmit({ 
	// 				error: function(xhr) {
	// 					$('#canvasPhotoInput').val('');
	// 					console.log("ERROR uploading file");
	// 				},

	// 				success: function(response) {
	// 					$('#canvasPhotoInput').val('');
	// 					if(response.error) {
	// 						console.log("ERROR from server while uploading file");
	// 						return;
	// 					}

	// 					var imageUrl = response.path;
	// 					console.log(imageUrl);
	// 				  // var imageObj = new Image();
	// 				  // imageObj.onload = function() {
	// 					 //  var image = new Kinetic.Image({
	// 						//   x: e.pageX,
	// 						//   y: e.pageY,
	// 						//   image: imageObj,
	// 						//   width: 50,
	// 						//   height: 50,
	// 					 //  });
						  
	// 					 //  layer.add(image);
	// 					 //  layer.draw();
	// 				  // }
	// 				  // imageObj.src = imageUrl;

	// 				}
	// 			});
	// 		});

	// 		// filepicker.pick({
	// 		//     mimetypes: ['image/*'],
	// 		//     container: 'window',
	// 		//   },
	// 		//   function(InkBlob){
	// 		// 	  console.log(InkBlob.url);
	// 		// 	  var imageObj = new Image();
	// 		// 	  imageObj.onload = function() {
	// 		// 		  var image = new Kinetic.Image({
	// 		// 			  x: e.pageX,
	// 		// 			  y: e.pageY,
	// 		// 			  image: imageObj,
	// 		// 			  width: 50,
	// 		// 			  height: 50,
	// 		// 		  });
					  
	// 		// 		  layer.add(image);
	// 		// 		  layer.draw();
	// 		// 	  }
	// 		// 	  imageObj.src = InkBlob.url;
	// 		//     // console.log(JSON.stringify(InkBlob));
	// 		//   },
	// 		//   function(FPError){
	// 		//     console.log(FPError.toString());
	// 		//   }
	// 		// );
	// 	}

	// });

});		
