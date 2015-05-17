var ARROW_SIZE = 10;
var MIN_ARROW_DISTANCE_FROM_EDGE = 3;
var SHADOW_BLUR = 5;
var SHADOW_COLOR = 'rgba(144, 144, 144, 1)';
var SELECTION_COLOR = '#f0f0f0';

function Menu(context, page) {
  this._context = context;
  this._page = page;
  this._background = new MenuBackground();
  this._backstack = [];

  this._$shielding = $('<div></div>').css({
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
  }).click(this.hide.bind(this));

  this._$scrollingContent = $('<div></div>').css({
    position: 'absolute',
    left: SHADOW_BLUR + ARROW_SIZE,
    top: SHADOW_BLUR,
    width: 'calc(100% - ' + (SHADOW_BLUR*2+ARROW_SIZE) + 'px)',
    height: 'calc(100% - ' + SHADOW_BLUR*2 + 'px)',
    overflowX: 'hidden'
  }).append(this._page.element());

  this._$element = $('<div></div>').css({position: 'fixed'});
  this._$element.append(this._background.element());
  this._$element.append(this._$scrollingContent);

  this._state = Menu.STATE_INITIAL;
  this._animating = false;
  this._metrics = null;
  this._registerPageEvents();
}

Menu.STATE_INITIAL = 0;
Menu.STATE_SHOWING = 1;
Menu.STATE_HIDDEN = 2;

Menu.prototype.hide = function() {
  if (this._state === Menu.STATE_SHOWING) {
    this._$shielding.remove();
    this._$element.remove();
    this._state = Menu.STATE_HIDDEN;
  }
};

Menu.prototype.popPage = function() {
  if (this._animating) {
    return;
  } else if (this._backstack.length === 0) {
    throw new Error('nothing to go back to');
  }
  this._startAnimation(this._backstack.pop(),
    SlideAnimation.DIRECTION_FORWARDS);
};

Menu.prototype.pushPage = function(page) {
  if (this._animating) {
    return;
  }
  this._backstack.push(this._page);
  this._startAnimation(page, SlideAnimation.DIRECTION_FORWARDS);
};

Menu.prototype.show = function() {
  if (this._state === Menu.STATE_INITIAL) {
    this._metrics = this._computeMetrics();
    this._layoutWithMetrics(this._metrics);
    this._background.setMetrics(this._metrics);
    
    var $body = $(document.body);
    $body.append(this._$shielding);
    $body.append(this._$element);
    
    this._state = Menu.STATE_SHOWING;
  }
};

Menu.prototype._animationCompleted = function() {
  this._animating = false;
  this._metrics = this._computeMetrics();
  this._layoutWithMetrics(this._metrics);
  this._background.setMetrics(this._metrics);
};

Menu.prototype._animationFrame = function(metrics) {
  this._layoutWithMetrics(metrics);
  this._background.setMetrics(metrics);
};

Menu.prototype._computeMetrics = function() {
  var arrowPosition = this._context.arrowPosition();
  var bounds = this._context.containerBounds();

  // If the arrow position is too close to the top or bottom of the bounds, we
  // cannot point to it.
  if (arrowPosition.top < bounds.top+ARROW_SIZE+MIN_ARROW_DISTANCE_FROM_EDGE) {
    arrowPosition.top = bounds.top + ARROW_SIZE + MIN_ARROW_DISTANCE_FROM_EDGE;
  } else if (arrowPosition.top > bounds.top+bounds.height-ARROW_SIZE-
      MIN_ARROW_DISTANCE_FROM_EDGE) {
    arrowPosition.top = bounds.top + bounds.height - ARROW_SIZE -
      MIN_ARROW_DISTANCE_FROM_EDGE;
  }

  var height = this._page.height();
  var width = this._page.width();
  var scrolls = false;
  if (height > bounds.height) {
    scrolls = true;
    height = bounds.height;
    width += scrollbarWidth();
  }

  var pixelsAboveArrow = height / 2;

  // Make sure the menu doesn't go out of the bounds.
  if (arrowPosition.top-(height/2) < bounds.top) {
    pixelsAboveArrow = arrowPosition.top - bounds.top;
  } else if (arrowPosition.top+height/2 > bounds.top+bounds.height) {
    pixelsAboveArrow = height - (bounds.top + bounds.height -
      arrowPosition.top);
  }
  
  return new Metrics({
    width: width,
    height: height,
    pointX: arrowPosition.left,
    pointY: arrowPosition.top,
    pixelsAboveArrow: pixelsAboveArrow,
    scrolls: scrolls
  });
};

Menu.prototype._layoutWithMetrics = function(metrics) {
  this._$element.css({
    width: metrics.width + ARROW_SIZE + SHADOW_BLUR*2,
    height: metrics.height + SHADOW_BLUR*2,
    left: metrics.pointX - SHADOW_BLUR,
    top: metrics.pointY - metrics.pixelsAboveArrow - SHADOW_BLUR
  });
  this._$scrollingContent.css({
    overflowY: metrics.scroll ? 'scroll' : 'hidden'
  });
};

Menu.prototype._registerPageEvents = function() {
  this._page._onShowHover = function(top, height) {
    this._background.setHighlight(top-this._$scrollingContent.scrollTop(),
      height);
  }.bind(this);
  this._page._onHideHover = this._background.setHighlight.bind(this._background,
    0, 0);
};

Menu.prototype._startAnimation = function(page, direction) {
  var initialMetrics = this._metrics;
  this._animating = true;
  this._page.element().detach();
  this._page = page;
  new SlideAnimation(initialMetrics, this._computeMetrics(), page, direction,
    this._animationFrame.bind(this), this._animationDone.bind(this));
  this._$element.append(this._page.element());
};

// A MenuBackground draws the blurb and shadow which appears in the background
// of a menu.
function MenuBackground() {
  this._highlightTop = 0;
  this._highlightHeight = 0;
  this._metrics = null;
  this._canvas = document.createElement('canvas');
}

MenuBackground.prototype.element = function() {
  return $(this._canvas);
};

MenuBackground.prototype.setHighlight = function(top, height) {
  this._highlightTop = top;
  this._highlightHeight = height;
  this._draw();
};

MenuBackground.prototype.setMetrics = function(metrics) {
  this._metrics = metrics;
  this._draw();
};

MenuBackground.prototype._draw = function() {
  if (this._metrics === null) {
    return;
  }

  var scale = Math.ceil(window.crystal.getRatio());
  var inset = SHADOW_BLUR * scale;
  var width = (this._metrics.width+ARROW_SIZE)*scale + inset*2;
  var height = this._metrics.height*scale + inset*2;

  this._canvas.width = width;
  this._canvas.height = height;
  this._canvas.style.width = width/scale + 'px';
  this._canvas.style.height = height/scale + 'px';

  var context = this._canvas.getContext('2d');
  context.clearRect(0, 0, width, height);

  context.shadowBlur = SHADOW_BLUR * scale;
  context.shadowColor = SHADOW_COLOR;
  context.fillStyle = 'white';

  var arrowSize = ARROW_SIZE * scale;
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
  context.fillStyle = SELECTION_COLOR;
  context.fillRect(0, inset + this._highlightTop*scale, width,
    this._highlightHeight*scale);
  context.restore();
};

// A SlideAnimation facilitates the page transition for a Menu.
function SlideAnimation(startMetrics, endMetrics, newPage, direction,
    metricsCb, doneCb) {
  this._startMetrics = startMetrics;
  this._endMetrics = endMetrics;
  this._newPage = newPage;
  this._direction = direction;
  this._metricsCb = metricsCb;
  this._doneCb = doneCb;
  this._start = new Date();
  this._tick();
}

SlideAnimation.DIRECTION_FORWARDS = 0;
SlideAnimation.DIRECTION_BACK = 1;
SlideAnimation.DURATION = 0.4;

SlideAnimation.prototype._registerNextTick = function() {
  if ('function' === typeof window.requestAnimationFrame) {
    window.requestAnimationFrame(this._tick.bind(this));
  } else {
    setTimeout(this._tick.bind(this), 1000/60);
  }
};

SlideAnimation.prototype._tick = function() {
  var elapsed = Math.max(new Date().getTime()-this._start, 0);
  var percent = Math.min(elapsed/SlideAnimation.DURATION, 1);
  this._updateLeft(percent);
  this._updateMetrics(percent);
  if (percent === 1) {
    this._doneCb();
  } else {
    this._registerNextTick();
  }
};

SlideAnimation.prototype._updateLeft = function(percent) {
  var leftPercent = Math.min(percent*2, 1);
  var initialLeft = 0;
  if (this._direction === SlideAnimation.DIRECTION_FORWARDS) {
    initialLeft = this._endMetrics.width;
  } else {
    initialLeft = -this._newPage.width();
  }
  this._newPage.css({left: (1 - leftPercent) * initialLeft});
}

SlideAnimation.prototype._updateMetrics = function(percent) {
  var metricsPercent = Math.max(percent*2 - 1, 0);
  this._metricsCb(intermediateMetrics(this._startMetrics, this._endMetrics,
    metricsPercent));
};

// Metrics stores general information about where a Menu is located and how
// large it is.
function Metrics(attrs) {
  this.width = attrs.width;
  this.height = attrs.height;
  this.pointX = attrs.pointX;
  this.pointY = attrs.pointY;
  this.pixelsAboveArrow = attrs.pixelsAboveArrow;
  this.scrolls = attrs.scrolls;
}

function intermediateMetrics(m1, m2, fraction) {
  var attributes = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow'];
  var res = {};
  for (var i = 0, len = attributes.length; i < len; ++i) {
    var attribute = attributes[i];
    res[attribute] = m1[attribute] + (m2[attribute]-m1[attribute])*fraction;
  }
  res.scrolls = (fraction < 1 ? false : m2.scrolls);
  return new Metrics(res);
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
