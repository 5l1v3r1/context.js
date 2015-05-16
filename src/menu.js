var ARROW_SIZE = 6;
var ARROW_OVER_CONTENT = 4;
var CANVAS_INSET = 5;
var SHADOW_BLUR = 5;
var SHADOW_COLOR = 'rgba(0, 0, 0, 0.8)';

function Menu(items, $bounds, $pointTo) {
  this._$bounds = $bounds;
  this._$pointTo = $pointTo;
  this._$shielding = $('<div></div>').css({
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: 'transparent'
  }).click(this.hide.bind(this));
  this._$element = $('<div></div>').css({position: 'fixed'});
  this._$canvas = $('<canvas></canvas>').css({
    position: 'absolute',
    width: '100%',
    height: '100%'
  });
  this._$contents = $('<div></div>').css({
    position: 'absolute',
    left: ARROW_SIZE + CANVAS_INSET,
    top: CANVAS_INSET,
    height: 'calc(100% - ' + CANVAS_INSET*2 + 'px)',
    overflowY: 'hidden',
    overflowX: 'hidden'
  });
  this._$element.append(this._$canvas).append(this._$contents);
  this._screens = [items];
  this._addItemsFromScreen(items);
  this._showing = false;
}

Menu.prototype.hide = function() {
  if (!this._showing) {
    return;
  }
  this._$shielding.detach();
  this._$element.detach();
  this._showing = false;
};

Menu.prototype.show = function() {
  var metrics = this._computeMetrics();
  this._updateDOMWithMetrics(metrics);
  this._drawWithMetrics(metrics);

  var body = $(document.body);
  body.append(this._$shielding);
  body.append(this._$element);

  this._showing = true;
};

Menu.prototype._addItemsFromScreen = function(items) {
  for (var i = 0, len = items.length; i < len; ++i) {
    console.log('yo, ', i, items[i].element());
    this._$contents.append(items[i].element());
  }
};

Menu.prototype._computeMetrics = function() {
  var boundsPosition = this._$bounds.offset();
  var boundsWidth = this._$bounds.width();
  var boundsHeight = this._$bounds.height();
  var pointToPosition = this._$pointTo.offset();
  var pointToWidth = this._$pointTo.width();
  var pointToHeight = this._$pointTo.height();

  var result = new Metrics();

  var requestedHeight = this._contentHeight() + CANVAS_INSET*2;
  result.width = this._contentWidth() + CANVAS_INSET*2 + ARROW_SIZE;
  result.height = Math.min(requestedHeight, boundsHeight);
  if (boundsHeight < requestedHeight) {
    result.scrolls = true;
    result.scrollbarWidth = scrollbarWidth();
  }

  result.x = pointToPosition.left + pointToWidth - ARROW_OVER_CONTENT -
    CANVAS_INSET - ARROW_SIZE;

  result.y = pointToPosition.top - result.height/2 + pointToHeight/2;
  if (result.y < boundsPosition.top) {
    result.y = boundsPosition.top;
  } else if (result.y + result.height > boundsPosition.top + boundsHeight) {
    result.y = boundsPosition.top + boundsHeight - result.height;
  }

  result.arrowY = Math.floor(pointToPosition.top + pointToHeight/2 - result.y);
  if (result.arrowY < CANVAS_INSET + ARROW_SIZE) {
    result.arrowY = CANVAS_INSET + ARROW_SIZE;
  } else if (result.arrowY > result.height - CANVAS_INSET - ARROW_SIZE) {
    result.arrowY = result.height - CANVAS_INSET - ARROW_SIZE;
  }

  return result;
};

Menu.prototype._contentHeight = function() {
  var height = 0;
  var screen = this._screens[this._screens.length - 1];
  for (var i = 0, len = screen.length; i < len; ++i) {
    height += screen[i].height();
  }
  return height;
};

Menu.prototype._contentWidth = function() {
  var width = 0;
  var screen = this._screens[this._screens.length - 1];
  for (var i = 0, len = screen.length; i < len; ++i) {
    width = Math.max(screen[i].minimumWidth(), width);
  }
  return width;
};

Menu.prototype._drawWithMetrics = function(metrics) {
  var canvas = this._$canvas[0];
  var scale = Math.ceil(window.crystal.getRatio());
  var width = (metrics.width + metrics.scrollbarWidth) * scale;
  var height = metrics.height * scale;
  canvas.width = width;
  canvas.height = height;

  var inset = CANVAS_INSET * scale;
  var arrowSize = ARROW_SIZE * scale;
  var arrowY = metrics.arrowY * scale;

  var context = canvas.getContext('2d');

  context.shadowBlur = SHADOW_BLUR;
  context.shadowColor = SHADOW_COLOR;
  context.fillStyle = 'white';

  context.beginPath();
  context.moveTo(inset + arrowSize, inset);
  context.lineTo(inset + arrowSize, arrowY-arrowSize);
  context.lineTo(inset, arrowY);
  context.lineTo(inset + arrowSize, arrowY+arrowSize);
  context.lineTo(inset + arrowSize, height - inset);
  context.lineTo(width - inset, height - inset);
  context.lineTo(width - inset, inset);
  context.closePath();
  context.fill();
};

Menu.prototype._updateDOMWithMetrics = function(metrics) {
  this._$element.css({
    top: metrics.y,
    left: metrics.x,
    width: metrics.width + metrics.scrollbarWidth,
    height: metrics.height
  });
  this._$contents.css({width: metrics.width - ARROW_SIZE - CANVAS_INSET*2});
};

function Metrics() {
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;
  this.arrowY = 0;
  this.scrolls = false;
  this.scrollbarWidth = 0;
}

Metrics.prototype.copy = function() {
  var res = new Metrics();
  res.x = this.x;
  res.y = this.y;
  res.width = this.width;
  res.height = this.height;
  res.arrowY = this.arrowY;
  res.scrolls = this.scrolls;
  res.scrollbarWidth = this.scrollbarWidth;
  return res;
};

function intermediateMetrics(m1, m2) {
  // TODO: average the two Metrics.
}

function scrollbarWidth() {
  // Generate a small scrolling element.
  var element = $('<div></div>').css({
    width: 200,
    height: 100,
    overflowY: 'scroll',
    position: 'fixed',
    visibility: 'hidden'
  });

  // Generate a tall element to put inside the small one.
  var content = $('<div></div>').css({height: 300, width: '100%'});
  element.append(content);

  // Append the small element to the body and measure stuff.
  $(document.body).append(element);
  var result = element.width() - content.width();
  element.remove();

  return result;
}

exports.Menu = Menu;
