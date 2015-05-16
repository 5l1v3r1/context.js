var CANVAS_INSET = 3;
var ARROW_SIZE = 6;
var ARROW_OVER_CONTENT = 7;

function Menu(items, $bounds, $pointTo) {
  this._$bounds = $bounds;
  this._$pointTo = $pointTo;
  this._$element = $('<div></div>').css({position: 'absolute'});
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
  this._screens = [items];
  this._metrics = this._computeMetrics();
  this._addItemsFromScreen(items);
}

Menu.prototype._addItemsFromScreen = function(screens) {
  for (var i = 0, len = screens.length; i < len; ++i) {
    this._$contents.append(screens[i]);
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
  
  var requestedHeight = this._heightOfItems() + CANVAS_INSET*2;
  result.width = this._contentWidth() + CANVAS_INSET*2 + ARROW_SIZE;
  result.height = Math.min(requestedHeight, boundsHeight);
  if (boundsHeight < requestedHeight) {
    result.scrolls = true;
    result.scrollbarWidth = scrollbarWidth();
  }
  
  result.x = pointToPosition.left + pointToWidth - ARROW_OVER_CONTENT;
  
  result.y = pointToPosition.top + result.height/2;
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
  // TODO: draw the arrow and shadow and background.
};

Menu.prototype._updateDOMForMetrics = function(metrics) {
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