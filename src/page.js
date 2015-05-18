// A Page represents a list of rows to show in a context menu.  A menu can have
// multiple pages in the form of submenus.
function Page(rows) {
  this._rows = rows;
  this._rowYValues = [];
  this._height = 0;
  this._width = 0;
  this._$element = $('<div></div>');

  this.onClick = null;

  // These events are used to tell the Menu to draw the hover highlight.
  this._onShowHover = null;
  this._onHideHover = null;

  for (var i = 0, len = rows.length; i < len; ++i) {
    var row = rows[i];
    this._rowYValues[i] = this._height;
    this._width = Math.max(this._width, row.minimumWidth());
    this._height += row.height();
    this._$element.append(row.element());
  }

  this._$element.css({width: this._width, height: this._height});

  this._registerUIEvents();
}

Page.prototype.element = function() {
  return this._$element;
};

Page.prototype.height = function() {
  return this._height;
};

Page.prototype.width = function() {
  return this._width;
};

Page.prototype._handleRowClick = function(index) {
  if ('function' === typeof this.onClick) {
    this.onClick(index);
  }
};

Page.prototype._handleRowMouseEnter = function(index) {
  if (this._rows[index].enabled()) {
    var rowYValue = this._rowYValues[index];
    var height = this._rows[index].height();
    this._onShowHover(rowYValue, height);
  }
};

Page.prototype._handleRowMouseLeave = function() {
  this._hoverRowIndex = -1;
  this._onHideHover();
};

Page.prototype._registerUIEvents = function() {
  for (var i = 0, len = this._rows.length; i < len; ++i) {
    var $rowElement = this._rows[i].element();
    $rowElement.click(this._handleRowClick.bind(this, i));
    $rowElement.mouseenter(this._handleRowMouseEnter.bind(this, i));
    $rowElement.mouseleave(this._handleRowMouseLeave.bind(this));
  }
};

exports.Page = Page;
