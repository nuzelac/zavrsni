function update(group, activeHandle) {
  var topLeft = group.get(".topLeft")[0],
      topRight = group.get(".topRight")[0],
      bottomRight = group.get(".bottomRight")[0],
      bottomLeft = group.get(".bottomLeft")[0],
      image = group.get(".image")[0],
      activeHandleName = activeHandle.getName(),
      newWidth,
      newHeight,
      imageX,
      imageY;

  // Update the positions of handles during drag.
  // This needs to happen so the dimension calculation can use the
  // handle positions to determine the new width/height.
  switch (activeHandleName) {
      case "topLeft":
          topRight.setY(activeHandle.getY());
          bottomLeft.setX(activeHandle.getX());
          break;
      case "topRight":
          topLeft.setY(activeHandle.getY());
          bottomRight.setX(activeHandle.getX());
          break;
      case "bottomRight":
          bottomLeft.setY(activeHandle.getY());
          topRight.setX(activeHandle.getX());
          break;
      case "bottomLeft":
          bottomRight.setY(activeHandle.getY());
          topLeft.setX(activeHandle.getX());
          break;
  }

  // Calculate new dimensions. Height is simply the dy of the handles.
  // Width is increased/decreased by a factor of how much the height changed.
  newHeight = bottomLeft.getY() - topLeft.getY();
  newWidth = image.getWidth() * newHeight / image.getHeight();

  // Move the image to adjust for the new dimensions.
  // The position calculation changes depending on where it is anchored.
  // ie. When dragging on the right, it is anchored to the top left,
  //     when dragging on the left, it is anchored to the top right.
  if(activeHandleName === "topRight" || activeHandleName === "bottomRight") {
      image.setPosition({ x: topLeft.getX(), y: topLeft.getY() });
  } else if(activeHandleName === "topLeft" || activeHandleName === "bottomLeft") {
      image.setPosition({ x: topRight.getX() - newWidth, y: topRight.getY() });
  }

  imageX = image.getX();
  imageY = image.getY();

  // Update handle positions to reflect new image dimensions
  topLeft.setPosition({ x: imageX, y: imageY});
  topRight.setPosition({ x: imageX + newWidth, y: imageY });
  bottomRight.setPosition({ x: imageX + newWidth, y: imageY + newHeight});
  bottomLeft.setPosition({ x: imageX, y: imageY + newHeight});

  // Set the image's size to the newly calculated dimensions
  if(newWidth && newHeight) {
      image.setSize({
        width: newWidth, 
        height: newHeight
      });

      var e = {
        target: group,
        x: imageX,
        y: imageY,
        width: newWidth,
        height: newHeight,
      }
      resizeElementEvent(e);
  }
}
function addAnchor(group, x, y, name) {
  var stage = group.getStage();
  var layer = group.getLayer();
  var image = group.get(".image")[0];

  var anchor = new Kinetic.Circle({
    x: x,
    y: y,
    stroke: "#666",
    fill: "#ddd",
    strokeWidth: 2,
    radius: 15,
    name: name,
    draggable: true
  });

  anchor.on("dragmove", function(e) {
    update(group, this);
    layer.draw();
  });
  anchor.on("mousedown touchstart", function(e) {
    group.setDraggable(false);
    this.moveToTop();
  });
  anchor.on("dragend", function(e) {
    group.setDraggable(true);
    layer.draw();
    saveElementData(group.id(), group.getX() + image.getX(), group.getY() + image.getY(), image.width(), image.height());
  });
  // add hover styling
  anchor.on("mouseover", function(e) {
    // e.stopImmediatePropagation();
    var layer = this.getLayer();
    document.body.style.cursor = "pointer";
    this.setStrokeWidth(4);
    layer.draw();
  });
  anchor.on("mouseout", function(e) {
    // e.stopImmediatePropagation();
    var layer = this.getLayer();
    document.body.style.cursor = "default";
    this.setStrokeWidth(2);
    layer.draw();
  });

  group.add(anchor);
}