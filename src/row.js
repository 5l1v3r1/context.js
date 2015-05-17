var DEFAULT_COLOR = '#999999';

var DEFAULT_STYLE = {
  fontSize: 18,
  height: 30,
  lineHeight: '30px',
  position: 'relative',
  color: DEFAULT_COLOR,
  paddingLeft: 10,
  paddingRight: 10
};

var ARROW_PADDING_RIGHT = 10;
var ARROW_PADDING_LEFT = 20;

function TextRow(text, style) {
  this._$element = $('<div><label></label></div>').css({
    position: 'relative'
  });
  var $label = this._$element.find('label');
  $label.text(text).css(DEFAULT_STYLE);
  if (style) {
    $label.css(style);
  }
  this._measure();
  this._$element.css({minWidth: this._minWidth});
}

TextRow.prototype.element = function() {
  return this._$element;
};

TextRow.prototype.height = function() {
  return this._height;
};

TextRow.prototype.minimumWidth = function() {
  return this._minWidth;
};

TextRow.prototype._measure = function() {
  this._$element.css({
    display: 'inline-block',
    position: 'absolute',
    top: -10000,
    left: -10000,
    visibility: 'hidden'
  });
  $(document.body).append(this._$element);
  
  this._minWidth = this._$element.width();
  this._height = this._$element.height();
  
  this._$element.detach();
  this._$element.css({
    display: 'block',
    position: 'relative',
    top: '',
    left: '',
    visibility: 'visible'
  });
};

function ExpandableRow(text, style) {
  TextRow.call(this, text, style);
  this._$arrow = $('<canvas></canvas>').css({
    width: ExpandableRow.ARROW_WIDTH,
    height: ExpandableRow.ARROW_HEIGHT,
    position: 'absolute',
    right: ExpandableRow.ARROW_PADDING_RIGHT,
    top: 'calc(50% - ' + ExpandableRow.ARROW_HEIGHT/2 + 'px)'
  });
  this.element().css({minWidth: this.minimumWidth(), paddingRight: 0});
  this.element().append(this._$arrow);
  this._fillCanvas();
}

ExpandableRow.ARROW_PADDING_RIGHT = 10;
ExpandableRow.ARROW_PADDING_LEFT = 0;
ExpandableRow.ARROW_WIDTH = 10;
ExpandableRow.ARROW_HEIGHT = 15;
ExpandableRow.THICKNESS = 2;

ExpandableRow.prototype = Object.create(TextRow.prototype);

ExpandableRow.prototype.minimumWidth = function() {
  return TextRow.prototype.minimumWidth.call(this) +
    ExpandableRow.ARROW_WIDTH + ExpandableRow.ARROW_PADDING_LEFT +
    ExpandableRow.ARROW_PADDING_RIGHT;
};

ExpandableRow.prototype._fillCanvas = function() {
  var context = this._$arrow[0].getContext('2d');
  var ratio = Math.ceil(window.crystal.getRatio());
  var width = ratio * ExpandableRow.ARROW_WIDTH;
  var height = ratio * ExpandableRow.ARROW_HEIGHT;
  this._$arrow[0].width = width;
  this._$arrow[0].height = height;
  
  context.strokeStyle = DEFAULT_COLOR;
  context.lineWidth = ratio*ExpandableRow.THICKNESS;
  context.beginPath();
  context.moveTo(ratio*ExpandableRow.THICKNESS, ratio*ExpandableRow.THICKNESS);
  context.lineTo(width-ratio*ExpandableRow.THICKNESS, height/2);
  context.lineTo(ratio*ExpandableRow.THICKNESS,
    height-ratio*ExpandableRow.THICKNESS);
  context.stroke();
  context.closePath();
};

exports.TextRow = TextRow;
exports.ExpandableRow = ExpandableRow;
