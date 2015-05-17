var ARROW_CONTENT_OVERLAP = 5;

// A Context holds information about where a Menu is showing on the screen.
function Context($element, $container) {
  this._$element = $element;
  this._$container = $container || $(document.body);
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
    top: offset.top,
    left: offset.left,
    width: this._$container.width(),
    height: this._$container.height()
  };
};

exports.Context = Context;
