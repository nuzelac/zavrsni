jQuery(function() {
	var $addingWhat = jQuery('#adding-what');

	var socket = io.connect('http://localhost:4000');

	var elements = [];
	jQuery('.widget-select').click(function(e) {
		e.preventDefault();
		var $el = jQuery(this);
		if($el.data('active') === '1') {
			var children = layer.getChildren();
			for(var i = 0; i < children.length; ++i) {
				// console.log(children[i]);
				children[i].setDraggable(true);
			}
			$el.data('active', '0');
			$addingWhat.html('nothing');
		} else {
			var children = layer.getChildren();
			for(var i = 0; i < children.length; ++i) {
				// console.log(children[i]);
				children[i].setDraggable(false);
			}
			jQuery('.widget-select').each(function() { jQuery(this).data('active', '0') });
			$el.data('active', '1');
			$addingWhat.html($el.data('type'));
		}
		// console.log($el.data('type'));
	});

	var stage = new Kinetic.Stage({
		container: 'container',
		width: 800,
		height: 500
	});

	var layer = new Kinetic.Layer();
	stage.add(layer);

	function addText(x, y, text, id) {
		var kineticText = new Kinetic.Text({
			x: x,
			y: y,
			text: text,
			fontSize: 30,
			fontFamily: 'Calibri',
			fill: 'green',
			draggable: false,
			id: id
		});

		kineticText.on('dragstart dragmove dragend', function(e) {
			// console.log(e);
			socket.emit('moveElement', {
				x: e.clientX,
				y: e.clientY,
				id: id
			})
		});
		
		layer.add(kineticText);
		layer.draw();
	}

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

	// dodati i za touchdown
	stage.getContainer().addEventListener('mousedown', function(e) {
		if($addingWhat.html() === 'text') {
			var text = window.prompt("Please enter text", "");
			if(text != null) {
				var id = 'text' + Math.random();

				addText(e.pageX, e.pageY, text, id);
				
				socket.emit('createElement', { 
					x: e.pageX,
					y: e.pageY,
					type: 'text',
					text: text,
					id: id
				});
			}
		} else if($addingWhat.html() === 'image') {
			$('#imageUploadModal').modal({

			});

			var timer;
			timer = setInterval(function() {
				if($('#canvasPhotoInput').val() !== '') {
					clearInterval(timer);
					$('#imageUploadForm').submit();
				}
			}, 500);

			$('#imageUploadForm').submit(function(e) {
				e.preventDefault();

				$(this).ajaxSubmit({ 
					error: function(xhr) {
						$('#canvasPhotoInput').val('');
						console.log("ERROR uploading file");
					},

					success: function(response) {
						$('#canvasPhotoInput').val('');
						if(response.error) {
							console.log("ERROR from server while uploading file");
							return;
						}

						var imageUrl = response.path;
						console.log(imageUrl);
					  // var imageObj = new Image();
					  // imageObj.onload = function() {
						 //  var image = new Kinetic.Image({
							//   x: e.pageX,
							//   y: e.pageY,
							//   image: imageObj,
							//   width: 50,
							//   height: 50,
						 //  });
						  
						 //  layer.add(image);
						 //  layer.draw();
					  // }
					  // imageObj.src = imageUrl;

					}
				});
			});

			// filepicker.pick({
			//     mimetypes: ['image/*'],
			//     container: 'window',
			//   },
			//   function(InkBlob){
			// 	  console.log(InkBlob.url);
			// 	  var imageObj = new Image();
			// 	  imageObj.onload = function() {
			// 		  var image = new Kinetic.Image({
			// 			  x: e.pageX,
			// 			  y: e.pageY,
			// 			  image: imageObj,
			// 			  width: 50,
			// 			  height: 50,
			// 		  });
					  
			// 		  layer.add(image);
			// 		  layer.draw();
			// 	  }
			// 	  imageObj.src = InkBlob.url;
			//     // console.log(JSON.stringify(InkBlob));
			//   },
			//   function(FPError){
			//     console.log(FPError.toString());
			//   }
			// );
		}

	});

});		
