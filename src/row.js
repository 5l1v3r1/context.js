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
  return this._$element;
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

exports.TextRow = TextRow;
