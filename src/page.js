// A Page represents a list of rows to show in a context menu.  A menu can have
// multiple pages in the form of submenus.
function Page(rows) {
  this._rows = rows;
  this._rowYValues = [];
  this._height = 0;
  this._width = 0;
  this._$element = $('<div></div>');

  this._hoveringRow = -1;
  this.onClick = null;

  // These events are passed onto the Menu so it can draw the selection
  // properly.
  this._onShowHover = null;
  this._onHideHover = null;

  for (var i = 0, len = rows.length; i < len; ++i) {
    var row = rows[i];
    this._rowYValues[i] = this._height;
    this._width = Math.max(this._width, row.minimumWidth());
    this._height += row.height();
    this._$element.append(row.element());
  }

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

Page.prototype._handleRowMouseEnter = function(row) {
  if (row.enabled()) {
    this._hoverRow = row;
    this._showHoverForRow(row);
  }
};

Page.prototype._handelRowMouseLeave = function() {
  this._hoverRow = null;
  this._onHideHover();
};

Page.prototype._registerUIEvents = function() {
  for (var i = 0, len = this._rows.length; i < len; ++i) {
    var row = this._rows[i];
    row.click(this._handleRowClick.bind(this, i));
    row.mouseenter(this._handleRowMouseEnter.bind(this, i));
    row.mouseleave(this._handleRowMouseLeave.bind(this));
  }
  this._$element.scroll(function() {

  });
};

Page.prototype._showHoverForRow = function(index) {
  var rowYValue = this._rowYValues[index];
  var height = this._rows[index].height();
  this._onShowHover(rowYValue, height);
};

exports.Page = Page;
