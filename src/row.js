var DEFAULT_STYLE = {
  fontSize: 18,
  paddingLeft: 10,
  paddingRight: 10,
  height: 30,
  lineHeight: '30px'
};

function TextRow(text, style) {
  this._$element = $('<div></div>').css(DEFAULT_STYLE).text(text);
  if (style) {
    this._$element.css(style);
  }
  this._minWidth = this._measureWidth();
  this._$element.css({minWidth: this._minWidth});
}

TextRow.prototype.element = function() {
  return this._$element[0];
};

TextRow.prototype.minimumWidth = function() {
  return this._minWidth;
};

TextRow.prototype._measureWidth = function() {
  this._$element.css({
    display: 'inline-block',
    position: 'absolute',
    top: -10000,
    left: -10000,
    visibility: 'hidden'
  });
  $(document.body).append(this._$element);
  var result = this._$element.width();
  this._$element.detach();
  this._$element.css({
    display: 'block',
    position: '',
    top: '',
    left: '',
    visibility: 'visible'
  });
  return result;
};

function ExpandableRow(text, style) {
  TextRow.call(this, text, style);
  this._$arrow = $('<canvas></canvas>').css({
    width: ExpandableRow.ARROW_WIDTH,
    height: ExpandableRow.ARROW_HEIGHT,
    position: 'absolute',
    right: DEFAULT_STYLE.paddingRight,
    top: 'calc(50% - ' + ExpandableRow.ARROW_HEIGHT/2 + 'px)'
  });
  this._$element.css({minWidth: this.minimumWidth()});
  this._$element.append(this._$arrow);
  this._fillCanvas();
}

ExpandableRow.ARROW_WIDTH = 20;
ExpandableRow.ARROW_HEIGHT = 20;
ExpandableRow.THICKNESS = 2;

ExpandableRow.prototype = Object.create(TextRow.prototype);

ExpandableRow.prototype.minimumWidth = function() {
  return ExpandableRow.prototype.minimumWidth.call(this) + ;
};

ExpandableRow.prototype._fillCanvas = function() {
  var context = this._$arrow[0].getContext('2d');
  var ratio = Math.ceil(window.crystal.getRatio());
  var width = ratio * ExpandableRow.ARROW_WIDTH;
  var height = ratio * ExpandableRow.ARROW_HEIGHT;
  this._$arrow[0].width = width;
  this._$arrow[0].height = height;
  
  context.fillStyle = '#999999';
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
