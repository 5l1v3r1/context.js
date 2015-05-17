// context.js version 0.1.0
//
// Copyright (c) 2015, Alexander Nichol and Jonathan Loeb.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
(function() {
  window.contextjs = {};
  var exports = window.contextjs;

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
  var ARROW_SIZE = 10;
  var ARROW_OVER_CONTENT = 4;
  var CANVAS_INSET = 5;
  var SHADOW_BLUR = 5;
  var SHADOW_COLOR = 'rgba(144, 144, 144, 1)';

  function Menu(items, $bounds, $pointTo) {
    this._$bounds = $bounds;
    this._$pointTo = $pointTo;
    this._$shielding = $('<div></div>').css({
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      background: 'transparent'
    }).click(this.hide.bind(this));
    this._$element = $('<div></div>').css({position: 'fixed'});
    this._$canvas = $('<canvas></canvas>').css({
      position: 'absolute',
      width: '100%',
      height: '100%'
    });
    this._$contents = $('<div></div>').css({
      position: 'absolute',
      left: ARROW_SIZE + CANVAS_INSET,
      top: CANVAS_INSET,
      height: 'calc(100% - ' + CANVAS_INSET*2 + 'px)',
      overflowY: 'hidden',
      overflowX: 'hidden'
    });
    this._$element.append(this._$canvas).append(this._$contents);
    this._screens = [items];
    this._addItemsFromScreen(items);
    this._showing = false;
  }

  Menu.prototype.hide = function() {
    if (!this._showing) {
      return;
    }
    this._$shielding.detach();
    this._$element.detach();
    this._showing = false;
  };

  Menu.prototype.show = function() {
    var metrics = this._computeMetrics();
    this._updateDOMWithMetrics(metrics);
    this._drawWithMetrics(metrics);

    var body = $(document.body);
    body.append(this._$shielding);
    body.append(this._$element);

    this._showing = true;
  };

  Menu.prototype._addItemsFromScreen = function(items) {
    for (var i = 0, len = items.length; i < len; ++i) {
      console.log('yo, ', i, items[i].element());
      this._$contents.append(items[i].element());
    }
  };

  Menu.prototype._computeMetrics = function() {
    var boundsPosition = this._$bounds.offset();
    var boundsWidth = this._$bounds.width();
    var boundsHeight = this._$bounds.height();
    var pointToPosition = this._$pointTo.offset();
    var pointToWidth = this._$pointTo.width();
    var pointToHeight = this._$pointTo.height();

    var result = new Metrics();

    var requestedHeight = this._contentHeight() + CANVAS_INSET*2;
    result.width = this._contentWidth() + CANVAS_INSET*2 + ARROW_SIZE;
    result.height = Math.min(requestedHeight, boundsHeight);
    if (boundsHeight < requestedHeight) {
      result.scrolls = true;
      result.scrollbarWidth = scrollbarWidth();
    }

    result.x = pointToPosition.left + pointToWidth - ARROW_OVER_CONTENT -
      CANVAS_INSET - ARROW_SIZE;

    result.y = pointToPosition.top - result.height/2 + pointToHeight/2;
    if (result.y < boundsPosition.top) {
      result.y = boundsPosition.top;
    } else if (result.y + result.height > boundsPosition.top + boundsHeight) {
      result.y = boundsPosition.top + boundsHeight - result.height;
    }

    result.arrowY = Math.floor(pointToPosition.top + pointToHeight/2 - result.y);
    if (result.arrowY < CANVAS_INSET + ARROW_SIZE) {
      result.arrowY = CANVAS_INSET + ARROW_SIZE;
    } else if (result.arrowY > result.height - CANVAS_INSET - ARROW_SIZE) {
      result.arrowY = result.height - CANVAS_INSET - ARROW_SIZE;
    }

    return result;
  };

  Menu.prototype._contentHeight = function() {
    var height = 0;
    var screen = this._screens[this._screens.length - 1];
    for (var i = 0, len = screen.length; i < len; ++i) {
      height += screen[i].height();
    }
    return height;
  };

  Menu.prototype._contentWidth = function() {
    var width = 0;
    var screen = this._screens[this._screens.length - 1];
    for (var i = 0, len = screen.length; i < len; ++i) {
      width = Math.max(screen[i].minimumWidth(), width);
    }
    return width;
  };

  Menu.prototype._drawWithMetrics = function(metrics) {
    var canvas = this._$canvas[0];
    var scale = Math.ceil(window.crystal.getRatio());
    var width = (metrics.width + metrics.scrollbarWidth) * scale;
    var height = metrics.height * scale;
    canvas.width = width;
    canvas.height = height;

    var inset = CANVAS_INSET * scale;
    var arrowSize = ARROW_SIZE * scale;
    var arrowY = metrics.arrowY * scale;

    var context = canvas.getContext('2d');

    context.shadowBlur = SHADOW_BLUR;
    context.shadowColor = SHADOW_COLOR;
    context.fillStyle = 'white';

    context.beginPath();
    context.moveTo(inset + arrowSize, inset);
    context.lineTo(inset + arrowSize, arrowY-arrowSize);
    context.lineTo(inset, arrowY);
    context.lineTo(inset + arrowSize, arrowY+arrowSize);
    context.lineTo(inset + arrowSize, height - inset);
    context.lineTo(width - inset, height - inset);
    context.lineTo(width - inset, inset);
    context.closePath();
    context.fill();
  };

  Menu.prototype._updateDOMWithMetrics = function(metrics) {
    this._$element.css({
      top: metrics.y,
      left: metrics.x,
      width: metrics.width + metrics.scrollbarWidth,
      height: metrics.height
    });
    this._$contents.css({width: metrics.width - ARROW_SIZE - CANVAS_INSET*2});
  };

  function Metrics() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.arrowY = 0;
    this.scrolls = false;
    this.scrollbarWidth = 0;
  }

  Metrics.prototype.copy = function() {
    var res = new Metrics();
    res.x = this.x;
    res.y = this.y;
    res.width = this.width;
    res.height = this.height;
    res.arrowY = this.arrowY;
    res.scrolls = this.scrolls;
    res.scrollbarWidth = this.scrollbarWidth;
    return res;
  };

  function intermediateMetrics(m1, m2) {
    // TODO: average the two Metrics.
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
  // A Page represents a list of rows to show in a context menu.  A menu can have
  // multiple pages in the form of submenus.
  function Page(rows) {
    this._rows = rows;
    this._$element = $('<')
  }var DEFAULT_COLOR = '#999999';

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

})();
