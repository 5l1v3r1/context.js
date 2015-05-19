function TextRow(text, style) {
  this._$element = $('<div><label></label></div>').css({
    position: 'relative',
    cursor: 'pointer'
  });
  this._$label = this._$element.find('label');
  this._$label.text(text).css(TextRow.DEFAULT_STYLE);
  if (style) {
    this._$label.css(style);
  }
  this._measure();
}

TextRow.DEFAULT_STYLE = {
  fontSize: 18,
  height: 30,
  lineHeight: '30px',
  position: 'relative',
  color: '#999999',
  paddingLeft: 10,
  paddingRight: 10,
  pointerEvents: 'none',
  whiteSpace: 'nowrap'
};

TextRow.prototype.element = function() {
  return this._$element;
};

TextRow.prototype.enabled = function() {
  return true;
};

TextRow.prototype.height = function() {
  return this._height;
};

TextRow.prototype.minimumWidth = function() {
  return this._minWidth;
};

TextRow.prototype.textColor = function() {
  return this._$label.css('color');
};

TextRow.prototype._measure = function() {
  var styleBackup = this._$label.css(['display', 'position', 'top', 'left',
    'visibility']);
  this._$label.css({
    display: 'inline-block',
    position: 'absolute',
    top: -10000,
    left: -10000,
    visibility: 'hidden'
  });
  
  this._$label.detach();
  $(document.body).append(this._$label);
  
  this._minWidth = this._$label.outerWidth();
  this._height = this._$label.outerHeight();

  this._$label.detach().css(styleBackup);
  this._$element.append(this._$label);
};

function ExpandableRow(text, style) {
  TextRow.call(this, text, style);
  this._$arrow = $('<canvas></canvas>').css({
    width: ExpandableRow.ARROW_WIDTH,
    height: ExpandableRow.ARROW_HEIGHT,
    position: 'absolute',
    right: ExpandableRow.ARROW_PADDING_RIGHT,
    top: 'calc(50% - ' + ExpandableRow.ARROW_HEIGHT/2 + 'px)',
    pointerEvents: 'none'
  });
  this.element().append(this._$arrow);
  this._fillCanvas();
}

ExpandableRow.ARROW_PADDING_RIGHT = 10;
ExpandableRow.ARROW_WIDTH = 10;
ExpandableRow.ARROW_HEIGHT = 15;
ExpandableRow.ARROW_THICKNESS = 2;

ExpandableRow.prototype = Object.create(TextRow.prototype);

ExpandableRow.prototype.minimumWidth = function() {
  return ExpandableRow.ARROW_WIDTH + ExpandableRow.ARROW_PADDING_RIGHT +
    TextRow.prototype.minimumWidth.call(this);
};

ExpandableRow.prototype._fillCanvas = function() {
  var context = this._$arrow[0].getContext('2d');
  var ratio = Math.ceil(window.crystal.getRatio());
  var width = ratio * ExpandableRow.ARROW_WIDTH;
  var height = ratio * ExpandableRow.ARROW_HEIGHT;
  this._$arrow[0].width = width;
  this._$arrow[0].height = height;

  context.strokeStyle = this.textColor();
  context.lineWidth = ratio * ExpandableRow.ARROW_THICKNESS;
  context.beginPath();
  context.moveTo(ratio*ExpandableRow.ARROW_THICKNESS,
    ratio*ExpandableRow.ARROW_THICKNESS);
  context.lineTo(width-ratio*ExpandableRow.ARROW_THICKNESS, height/2);
  context.lineTo(ratio*ExpandableRow.ARROW_THICKNESS,
    height-ratio*ExpandableRow.ARROW_THICKNESS);
  context.stroke();
  context.closePath();
};

function BackRow(text, style) {
  if (!style) {
    style = {};
  }
  style.paddingLeft = BackRow.ARROW_WIDTH + BackRow.ARROW_PADDING_LEFT +
    BackRow.ARROW_PADDING_RIGHT;
  TextRow.call(this, text, style);

  this._$arrow = $('<canvas></canvas>').css({
    width: BackRow.ARROW_WIDTH,
    height: BackRow.ARROW_HEIGHT,
    position: 'absolute',
    left: BackRow.ARROW_PADDING_LEFT,
    top: 'calc(50% - ' + BackRow.ARROW_HEIGHT/2 + 'px)',
    pointerEvents: 'none'
  });
  this.element().append(this._$arrow);
  this._fillCanvas();
}

BackRow.ARROW_PADDING_LEFT = 10;
BackRow.ARROW_PADDING_RIGHT = 10;
BackRow.ARROW_WIDTH = 10;
BackRow.ARROW_HEIGHT = 15;
BackRow.ARROW_THICKNESS = 2;

BackRow.prototype = Object.create(TextRow.prototype);

BackRow.prototype._fillCanvas = function() {
  var context = this._$arrow[0].getContext('2d');
  var ratio = Math.ceil(window.crystal.getRatio());
  var width = ratio * BackRow.ARROW_WIDTH;
  var height = ratio * BackRow.ARROW_HEIGHT;
  this._$arrow[0].width = width;
  this._$arrow[0].height = height;

  context.strokeStyle = this.textColor();
  context.lineWidth = ratio * BackRow.ARROW_THICKNESS;
  context.beginPath();
  context.moveTo(width-ratio*BackRow.ARROW_THICKNESS,
    ratio*BackRow.ARROW_THICKNESS);
  context.lineTo(ratio*BackRow.ARROW_THICKNESS, height/2);
  context.lineTo(width-ratio*BackRow.ARROW_THICKNESS,
    height-ratio*BackRow.ARROW_THICKNESS);
  context.stroke();
  context.closePath();
};

function CheckRow(checked, text, style) {
  if (!style) {
    style = {};
  }
  style.paddingLeft = CheckRow.CHECK_PADDING_LEFT + CheckRow.CHECK_WIDTH +
    CheckRow.CHECK_PADDING_RIGHT;

  TextRow.call(this, text, style);

  if (checked) {
    this._$check = $('<canvas></canvas>').css({
      width: CheckRow.CHECK_WIDTH,
      height: CheckRow.CHECK_HEIGHT,
      position: 'absolute',
      left: CheckRow.CHECK_PADDING_LEFT,
      top: 'calc(50% - ' + CheckRow.CHECK_HEIGHT/2 + 'px)',
      pointerEvents: 'none'
    });
    this.element().append(this._$check);
    this._fillCanvas();
  }
}

CheckRow.CHECK_PADDING_LEFT = 5;
CheckRow.CHECK_PADDING_RIGHT = 5;
CheckRow.CHECK_WIDTH = 20;
CheckRow.CHECK_HEIGHT = 15;
CheckRow.CHECK_THICKNESS = 2;

CheckRow.prototype = Object.create(TextRow.prototype);

CheckRow.prototype._fillCanvas = function() {
  var context = this._$check[0].getContext('2d');
  var ratio = Math.ceil(window.crystal.getRatio());
  var width = ratio * CheckRow.CHECK_WIDTH;
  var height = ratio * CheckRow.CHECK_HEIGHT;
  this._$check[0].width = width;
  this._$check[0].height = height;

  var thickness = CheckRow.CHECK_THICKNESS * ratio;

  context.strokeStyle = this.textColor();
  context.lineWidth = thickness;
  context.beginPath();
  context.moveTo(thickness, height/2);
  context.lineTo(width/3, height-thickness);
  context.lineTo(width-thickness, thickness);
  context.stroke();
  context.closePath();
};

exports.TextRow = TextRow;
exports.ExpandableRow = ExpandableRow;
exports.BackRow = BackRow;
exports.CheckRow = CheckRow;
