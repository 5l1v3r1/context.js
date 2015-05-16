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

  var CANVAS_INSET = 3;
  var ARROW_SIZE = 6;
  var ARROW_OVER_CONTENT = 7;

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

  Menu.prototype._addItemsFromScreen = function(screens) {
    for (var i = 0, len = screens.length; i < len; ++i) {
      this._$contents.append(screens[i]);
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

    result.x = pointToPosition.left + pointToWidth - ARROW_OVER_CONTENT;

    result.y = pointToPosition.top + result.height/2;
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
    // TODO: draw a blurb here.
  };

  Menu.prototype._updateDOMWithMetrics = function(metrics) {
    console.log('metrics', metrics, 'height', metrics.height);
    this._$element.css({
      top: metrics.y,
      left: metrics.x,
      width: metrics.width + metrics.scrollbarWidth,
      height: metrics.heigh
    });
    console.log({
      height: 36
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
      position: '',
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
      right: this.element().css('paddingRight'),
      top: 'calc(50% - ' + ExpandableRow.ARROW_HEIGHT/2 + 'px)'
    });
    this.element().css({minWidth: this.minimumWidth()});
    this.element().append(this._$arrow);
    this._fillCanvas();
  }

  ExpandableRow.ARROW_WIDTH = 20;
  ExpandableRow.ARROW_HEIGHT = 20;
  ExpandableRow.THICKNESS = 2;

  ExpandableRow.prototype = Object.create(TextRow.prototype);

  ExpandableRow.prototype.minimumWidth = function() {
    return TextRow.prototype.minimumWidth.call(this) +
      ExpandableRow.ARROW_WIDTH;
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
  exports.ExpandableRow = ExpandableRow;

})();
