var ARROW_SIZE = 10;
var SHADOW_BLUR = 5;
var SHADOW_COLOR = 'rgba(144, 144, 144, 1)';
var SELECTION_COLOR = '#f0f0f0';

function Menu(context, page) {
  this._context = context;
  this._page = page;

  this._$shielding = $('<div></div>').css({
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: 'transparent'
  }).click(this.hide.bind(this));
  
  this._background = new MenuBackground();
  
  // TODO: implement the rest of this method.
}

Menu.prototype.hide = function() {
  // TODO: this.
};

Menu.prototype.show = function() {
  // TODO: this.
};

// A MenuBackground draws the blurb and shadow which appears in the background
// of a menu.
function MenuBackground() {
  this._highlightTop = 0;
  this._highlightHeight = 0;
  this._metrics = null;
  this._canvas = document.createElement('canvas');
}

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

  context.shadowBlur = SHADOW_BLUR;
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
  context.save();
  context.clip();
  context.fillStyle = SELECTION_COLOR;
  context.fillRect(0, this._highlightTop*scale, width,
    (this._highlightTop+this._highlightHeight)*scale);
  context.restore();
};

// Metrics stores general information about where a Menu is located and how
// large it is.
function Metrics(attrs) {
  this.width = attrs.width;
  this.height = attrs.height;
  this.pointX = attrs.pointX;
  this.pointY = attrs.pointY;
  this.pixelsAboveArrow = attrs.pixelsAboveArrow;
}

function intermediateMetrics(m1, m2, fraction) {
  var attributes = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow'];
  var res = {};
  for (var i = 0, len = attributes.length; i < len; ++i) {
    var attribute = attributes[i];
    res[attribute] = m1[attribute] + (m2[attribute]-m1[attribute])*fraction;
  }
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
