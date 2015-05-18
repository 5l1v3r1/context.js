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

Metrics.computeBestFittingMetrics = function(context, page) {
  var arrowPosition = constrainedArrowPosition(context);
  var bounds = context.containerBounds();

  var height = page.height();
  var width = page.width();
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

Metrics.transition = function(m1, m2, fraction) {
  var attributes = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow'];
  var res = {};
  for (var i = 0, len = attributes.length; i < len; ++i) {
    var attribute = attributes[i];
    res[attribute] = m1[attribute] + (m2[attribute]-m1[attribute])*fraction;
  }
  res.scrolls = (fraction < 1 ? false : m2.scrolls);
  return new Metrics(res);
};

Metrics.prototype.equals = function(metrics) {
  var keys = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow',
    'scrolls'];
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    if (this[key] !== metrics[key]) {
      return false;
    }
  }
  return true;
};

function constrainedArrowPosition(context) {
  var arrowPosition = context.arrowPosition();
  var bounds = context.containerBounds();

  var minTop = bounds.top + Menu.ARROW_SIZE + Menu.MIN_ARROW_DISTANCE_FROM_EDGE;
  var maxTop = bounds.top + bounds.height - Menu.ARROW_SIZE -
    Menu.MIN_ARROW_DISTANCE_FROM_EDGE;

  arrowPosition.top = Math.min(Math.max(arrowPosition.top, minTop), maxTop);
  return arrowPosition;
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
