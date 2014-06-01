
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
			newTextWidget(widget, data);
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

	group.on('dragstart dragmove dragend', moveElementEvent);

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


function newLinkWidget(widget, data) {
	console.log("newLinkWidget");
	data.x = widget.x;
	data.y = widget.y;
	data.id = widget._id;

	var kineticText = new Kinetic.Text(data);
	kineticText.on('dblclick dbltap', function(e) {
		var url = e.target.text();
		window.open(url, '_blank');
	});

	kineticText.on('dragstart dragmove dragend', moveElementEvent);
	
	layer.add(kineticText);
	layer.draw();	
}

function LinkWidgetCreator(x, y) {
	var link = window.prompt("Please enter link", "http://");
	if(link == null) return null;

	var data = {
		text: link,
		fontSize: 30,
		fontFamily: 'Calibri',
		fill: 'blue',
		draggable: true,
	};

	$.post('/api/boards/' + boardId + '/widgets', {
		type: 'Link',
		x: x,
		y: y,
		data: data,
	}).success(function(data) {
		if(data.success === true) {
			// var widget = data.widget;
			// var data = JSON.parse(widget.data);
			// newLinkWidget(widget, data);
		} else {
			alert(data.error);
		}
	}).fail(function(data) {
		alert("Error! Please try again later");
	});
}

function LinkWidgetLoader(widget, data) {
	newLinkWidget(widget, data);
}
		
// }
// // function VideoWidget(x, y) {
// // 	this.base = BoardWidget;
// // 	this.base(x, y);		
// // }
// // VideoWidget.prototype = new BoardWidget;
