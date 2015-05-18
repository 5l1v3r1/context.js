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
  var ARROW_SIZE = 10;
  var MIN_ARROW_DISTANCE_FROM_EDGE = 3;
  var SHADOW_BLUR = 5;
  var SHADOW_COLOR = 'rgba(144, 144, 144, 1)';
  var SELECTION_COLOR = '#f0f0f0';

  function Menu(context, page) {
    this._context = context;
    this._page = page;
    this._background = new MenuBackground();
    this._backstack = [];

    this._$shielding = $('<div></div>').css({
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%'
    }).click(this.hide.bind(this));

    this._$scrollingContent = $('<div></div>').css({
      position: 'absolute',
      left: SHADOW_BLUR + ARROW_SIZE,
      top: SHADOW_BLUR,
      width: 'calc(100% - ' + (SHADOW_BLUR*2+ARROW_SIZE) + 'px)',
      height: 'calc(100% - ' + SHADOW_BLUR*2 + 'px)',
      overflowX: 'hidden'
    }).append(this._page.element());

    this._$element = $('<div></div>').css({position: 'fixed'});
    this._$element.append(this._background.element());
    this._$element.append(this._$scrollingContent);

    this._state = Menu.STATE_INITIAL;
    this._animating = false;
    this._metrics = null;
    this._registerPageEvents();
  }

  Menu.FADE_DURATION = 150;
  Menu.STATE_INITIAL = 0;
  Menu.STATE_SHOWING = 1;
  Menu.STATE_HIDDEN = 2;

  Menu.prototype.hide = function() {
    if (this._state === Menu.STATE_SHOWING) {
      this._$shielding.remove();
      this._$element.fadeOut(Menu.FADE_DURATION, function() {
        $(this).remove();
      }).css({pointerEvents: 'none'});
      this._state = Menu.STATE_HIDDEN;
    }
  };

  Menu.prototype.popPage = function() {
    if (this._animating) {
      return;
    } else if (this._backstack.length === 0) {
      throw new Error('nothing to go back to');
    }
    this._startAnimation(this._backstack.pop(),
      SlideAnimation.DIRECTION_BACKWARDS);
  };

  Menu.prototype.pushPage = function(page) {
    if (this._animating) {
      return;
    }
    this._backstack.push(this._page);
    this._startAnimation(page, SlideAnimation.DIRECTION_FORWARDS);
  };

  Menu.prototype.show = function() {
    if (this._state === Menu.STATE_INITIAL) {
      this._metrics = this._computeMetrics();
      this._layoutWithMetrics(this._metrics);
      this._background.setMetrics(this._metrics);

      var $body = $(document.body);
      $body.append(this._$shielding);
      $body.append(this._$element);

      this._state = Menu.STATE_SHOWING;
    }
  };

  Menu.prototype._animationCompleted = function() {
    this._animating = false;
    this._metrics = this._computeMetrics();
    this._layoutWithMetrics(this._metrics);
    this._background.setMetrics(this._metrics);
    this._page.element().css({pointerEvents: ''});
  };

  Menu.prototype._animationFrame = function(metrics) {
    this._layoutWithMetrics(metrics);
    this._background.setMetrics(metrics);
  };

  Menu.prototype._computeMetrics = function() {
    var arrowPosition = this._context.arrowPosition();
    var bounds = this._context.containerBounds();

    // If the arrow position is too close to the top or bottom of the bounds, we
    // cannot point to it.
    if (arrowPosition.top < bounds.top+ARROW_SIZE+MIN_ARROW_DISTANCE_FROM_EDGE) {
      arrowPosition.top = bounds.top + ARROW_SIZE + MIN_ARROW_DISTANCE_FROM_EDGE;
    } else if (arrowPosition.top > bounds.top+bounds.height-ARROW_SIZE-
        MIN_ARROW_DISTANCE_FROM_EDGE) {
      arrowPosition.top = bounds.top + bounds.height - ARROW_SIZE -
        MIN_ARROW_DISTANCE_FROM_EDGE;
    }

    var height = this._page.height();
    var width = this._page.width();
    var scrolls = false;
    if (height > bounds.height) {
      scrolls = true;
      height = bounds.height;
      width += scrollbarWidth();
    }

    var pixelsAboveArrow = height / 2;

    // Make sure the menu doesn't go out of the bounds.
    if (arrowPosition.top-(height/2) < bounds.top) {
      pixelsAboveArrow = arrowPosition.top - bounds.top;
    } else if (arrowPosition.top+height/2 > bounds.top+bounds.height) {
      pixelsAboveArrow = height - (bounds.top + bounds.height -
        arrowPosition.top);
    }

    return new Metrics({
      width: width,
      height: height,
      pointX: arrowPosition.left,
      pointY: arrowPosition.top,
      pixelsAboveArrow: pixelsAboveArrow,
      scrolls: scrolls
    });
  };

  Menu.prototype._layoutWithMetrics = function(metrics) {
    this._$element.css({
      width: metrics.width + ARROW_SIZE + SHADOW_BLUR*2,
      height: metrics.height + SHADOW_BLUR*2,
      left: metrics.pointX - SHADOW_BLUR,
      top: metrics.pointY - metrics.pixelsAboveArrow - SHADOW_BLUR
    });
    this._$scrollingContent.css({
      overflowY: metrics.scrolls ? 'scroll' : 'hidden'
    });
  };

  Menu.prototype._registerPageEvents = function() {
    this._page._onShowHover = function(top, height) {
      this._background.setHighlight(top-this._$scrollingContent.scrollTop(),
        height);
    }.bind(this);
    this._page._onHideHover = this._background.setHighlight.bind(this._background,
      0, 0);
  };

  Menu.prototype._startAnimation = function(page, direction) {
    var initialMetrics = this._metrics;
    this._animating = true;
    this._page.element().detach();
    this._page = page;

    new SlideAnimation(initialMetrics, this._computeMetrics(), page, direction,
      this._animationFrame.bind(this), this._animationCompleted.bind(this));

    this._page.element().css({pointerEvents: 'none', position: 'relative'});
    this._registerPageEvents();
    this._$scrollingContent.append(this._page.element());
    this._background.setHighlight(0, 0);
  };

  // A MenuBackground draws the blurb and shadow which appears in the background
  // of a menu.
  function MenuBackground() {
    this._highlightTop = 0;
    this._highlightHeight = 0;
    this._metrics = null;
    this._canvas = document.createElement('canvas');
  }

  MenuBackground.prototype.element = function() {
    return $(this._canvas);
  };

  MenuBackground.prototype.setHighlight = function(top, height) {
    this._highlightTop = top;
    this._highlightHeight = height;
    this._draw();
  };

  MenuBackground.prototype.setMetrics = function(metrics) {
    this._metrics = metrics;
    this._draw();
  };

  MenuBackground.prototype._draw = function() {
    if (this._metrics === null) {
      return;
    }

    var scale = Math.ceil(window.crystal.getRatio());
    var inset = SHADOW_BLUR * scale;
    var width = (this._metrics.width+ARROW_SIZE)*scale + inset*2;
    var height = this._metrics.height*scale + inset*2;

    this._canvas.width = width;
    this._canvas.height = height;
    this._canvas.style.width = width/scale + 'px';
    this._canvas.style.height = height/scale + 'px';

    var context = this._canvas.getContext('2d');
    context.clearRect(0, 0, width, height);

    context.shadowBlur = SHADOW_BLUR * scale;
    context.shadowColor = SHADOW_COLOR;
    context.fillStyle = 'white';

    var arrowSize = ARROW_SIZE * scale;
    var arrowY = this._metrics.pixelsAboveArrow*scale + inset;

    // Draw the main blurb.
    context.beginPath();
    context.moveTo(inset+arrowSize, inset);
    context.lineTo(inset+arrowSize, arrowY-arrowSize);
    context.lineTo(inset, arrowY);
    context.lineTo(inset+arrowSize, arrowY+arrowSize);
    context.lineTo(inset+arrowSize, height-inset);
    context.lineTo(width-inset, height-inset);
    context.lineTo(width-inset, inset);
    context.closePath();
    context.fill();

    // Draw the highlight.
    context.shadowColor = 'transparent';
    context.save();
    context.clip();
    context.fillStyle = SELECTION_COLOR;
    context.fillRect(0, inset + this._highlightTop*scale, width,
      this._highlightHeight*scale);
    context.restore();
  };

  // A SlideAnimation facilitates the page transition for a Menu.
  function SlideAnimation(startMetrics, endMetrics, newPage, direction,
      metricsCb, doneCb) {
    this._startMetrics = startMetrics;
    this._endMetrics = endMetrics;
    this._newPage = newPage;
    this._direction = direction;
    this._metricsCb = metricsCb;
    this._doneCb = doneCb;
    this._start = new Date();
    this._tick();
  }

  SlideAnimation.DIRECTION_FORWARDS = 0;
  SlideAnimation.DIRECTION_BACK = 1;
  SlideAnimation.DURATION = 300;

  SlideAnimation.prototype._registerNextTick = function() {
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._tick.bind(this));
    } else {
      setTimeout(this._tick.bind(this), 1000/60);
    }
  };

  SlideAnimation.prototype._tick = function() {
    var elapsed = Math.max(new Date().getTime()-this._start, 0);
    var percent = Math.min(elapsed/SlideAnimation.DURATION, 1);
    this._updateLeft(percent);
    this._updateMetrics(percent);
    if (percent === 1) {
      this._doneCb();
    } else {
      this._registerNextTick();
    }
  };

  SlideAnimation.prototype._updateLeft = function(percent) {
    var leftPercent = Math.min(percent*2, 1);
    var initialLeft = 0;
    if (this._direction === SlideAnimation.DIRECTION_FORWARDS) {
      initialLeft = this._endMetrics.width;
    } else {
      initialLeft = -this._newPage.width();
    }
    this._newPage.element().css({left: (1 - leftPercent) * initialLeft});
  }

  SlideAnimation.prototype._updateMetrics = function(percent) {
    var metricsPercent = Math.max(percent*2 - 1, 0);
    this._metricsCb(intermediateMetrics(this._startMetrics, this._endMetrics,
      metricsPercent));
  };

  // Metrics stores general information about where a Menu is located and how
  // large it is.
  function Metrics(attrs) {
    this.width = attrs.width;
    this.height = attrs.height;
    this.pointX = attrs.pointX;
    this.pointY = attrs.pointY;
    this.pixelsAboveArrow = attrs.pixelsAboveArrow;
    this.scrolls = attrs.scrolls;
  }

  function intermediateMetrics(m1, m2, fraction) {
    var attributes = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow'];
    var res = {};
    for (var i = 0, len = attributes.length; i < len; ++i) {
      var attribute = attributes[i];
      res[attribute] = m1[attribute] + (m2[attribute]-m1[attribute])*fraction;
    }
    res.scrolls = (fraction < 1 ? false : m2.scrolls);
    return new Metrics(res);
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
  function TextRow(text, style) {
    this._$element = $('<div><label></label></div>').css({
      position: 'relative',
      cursor: 'pointer'
    });
    var $label = this._$element.find('label');
    $label.text(text).css(TextRow.DEFAULT_STYLE);
    if (style) {
      $label.css(style);
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
    pointerEvents: 'none'
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

    context.strokeStyle = this.element().find('label').css('color');
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

    context.strokeStyle = this.element().find('label').css('color');
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

  exports.TextRow = TextRow;
  exports.ExpandableRow = ExpandableRow;
  exports.BackRow = BackRow;

})();
