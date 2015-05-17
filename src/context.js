var ARROW_CONTENT_OVERLAP = 5;
var DEFAULT_CONTAINER_PADDING = 5;

// A Context holds information about where a Menu is showing on the screen.
function Context($element, $container, containerPadding) {
  this._$element = $element;
  this._$container = $container || $(document.body);
  this._containerPadding = containerPadding || DEFAULT_CONTAINER_PADDING;
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

exports.Context = Context;
