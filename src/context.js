var ARROW_CONTENT_OVERLAP = 5;
var DEFAULT_CONTAINER_PADDING = 5;

// A Context holds information about where a Menu is showing on the screen.
function Context($element, $container, containerPadding) {
  this._$element = $element;
  this._$container = $container || $(document.body);
  this._containerPadding = containerPadding || DEFAULT_CONTAINER_PADDING;
  this.onInvalidate = null;

  this._elementParents = [];
  this._boundInvalidate = this._invalidate.bind(this);
  this._registerElementScroll();
}

Context.prototype.arrowPosition = function() {
  var offset = this._$element.offset();
  return {
    left: offset.left + this._$element.width() - ARROW_CONTENT_OVERLAP,
    top: offset.top + this._$element.height()/2
  };
};

Context.prototype.containerBounds = function() {
  var offset = this._$container.offset();
  return {
    top: offset.top + this._containerPadding,
    left: offset.left + this._containerPadding,
    width: this._$container.width() - this._containerPadding*2,
    height: this._$container.height() - this._containerPadding*2
  };
};

Context.prototype.dispose = function() {
  this._unregisterElementScroll();
};

Context.prototype._invalidate = function() {
  if ('function' === typeof this.onInvalidate) {
    this.onInvalidate();
  }
  this._unregisterElementScroll();
};

Context.prototype._registerElementScroll = function() {
  var $element = this._$element;
  do {
    $element = $element.parent();
    $element.scroll(this._boundInvalidate);
    this._elementParents.push($element);
  } while ($element[0] !== document.body);
};

Context.prototype._unregisterElementScroll = function() {
  for (var i = 0, len = this._elementParents.length; i < len; ++i) {
    this._elementParents[i].off('scroll', this._boundInvalidate);
  }
};

exports.Context = Context;
