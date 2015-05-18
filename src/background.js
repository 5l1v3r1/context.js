// A Background draws the blurb and shadow which appears in the background of a
// menu.
function Background() {
  this._highlightTop = 0;
  this._highlightHeight = 0;
  this._metrics = null;
  this._canvas = document.createElement('canvas');
}

Background.SELECTION_COLOR = '#f0f0f0';

Background.prototype.element = function() {
  return $(this._canvas);
};

Background.prototype.setHighlight = function(top, height) {
  this._highlightTop = top;
  this._highlightHeight = height;
  this._draw();
};

Background.prototype.setMetrics = function(metrics) {
  this._metrics = metrics;
  this._draw();
};

Background.prototype._draw = function() {
  if (this._metrics === null) {
    return;
  }

  var scale = Math.ceil(window.crystal.getRatio());
  var inset = Menu.SHADOW_BLUR * scale;
  var width = (this._metrics.width+Menu.ARROW_SIZE)*scale + inset*2;
  var height = this._metrics.height*scale + inset*2;

  this._canvas.width = width;
  this._canvas.height = height;
  this._canvas.style.width = width/scale + 'px';
  this._canvas.style.height = height/scale + 'px';

  var context = this._canvas.getContext('2d');
  context.clearRect(0, 0, width, height);

  context.shadowBlur = Menu.SHADOW_BLUR * scale;
  context.shadowColor = Menu.SHADOW_COLOR;
  context.fillStyle = 'white';

  var arrowSize = Menu.ARROW_SIZE * scale;
  var arrowY = this._metrics.pixelsAboveArrow*scale + inset;

  // Draw the main blurb.
  context.beginPath();
  context.moveTo(inset+arrowSize, inset);
  context.lineTo(inset+arrowSize, arrowY-arrowSize);
  context.lineTo(inset, arrowY);
  context.lineTo(inset+arrowSize, arrowY+arrowSize);
  context.lineTo(inset+arrowSize, height-inset);
  context.lineTo(width-inset, height-inset);
  context.lineTo(width-inset, inset);
  context.closePath();
  context.fill();

  // Draw the highlight.
  context.shadowColor = 'transparent';
  context.save();
  context.clip();
  context.fillStyle = Background.SELECTION_COLOR;
  context.fillRect(0, inset + this._highlightTop*scale, width,
    this._highlightHeight*scale);
  context.restore();
};
