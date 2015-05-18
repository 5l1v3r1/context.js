function Menu(context, page) {
  this._background = new Background();
  this._backstack = [];
  this._layoutInfo = new RegularLayoutInfo(context, page);

  this._hoverTop = 0;
  this._hoverHeight = 0;

  this._$shielding = $('<div></div>').css({
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
  }).click(this.hide.bind(this));

  this._$scrollingContent = $('<div></div>').css({
    position: 'absolute',
    left: Menu.SHADOW_BLUR + Menu.ARROW_SIZE,
    top: Menu.SHADOW_BLUR,
    width: 'calc(100% - ' + (Menu.SHADOW_BLUR*2+Menu.ARROW_SIZE) + 'px)',
    height: 'calc(100% - ' + Menu.SHADOW_BLUR*2 + 'px)',
    overflowX: 'hidden'
  }).scroll(this._updateHighlight.bind(this));

  this._$element = $('<div></div>').css({position: 'fixed'});
  this._$element.append(this._background.element());
  this._$element.append(this._$scrollingContent);

  this._state = Menu.STATE_INITIAL;
}

Menu.ARROW_SIZE = 10;
Menu.FADE_DURATION = 150;
Menu.MIN_ARROW_DISTANCE_FROM_EDGE = 3;
Menu.SHADOW_BLUR = 5;
Menu.SHADOW_COLOR = 'rgba(144, 144, 144, 1)';

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
  var transition = new TransitionLayoutInfo(this._layoutInfo.getContext(),
    this._backstack.pop(), this._layoutInfo.getMetrics(), false);
  this._switchToLayoutInfo(transition);
};

Menu.prototype.pushPage = function(page) {
  this._backstack.push(this._layoutInfo.getPage());
  var transition = new TransitionLayoutInfo(this._layoutInfo.getContext(),
    page, this._layoutInfo.getMetrics(), true);
  this._switchToLayoutInfo(transition);
};

Menu.prototype.show = function() {
  if (this._state === Menu.STATE_INITIAL) {
    this._state = Menu.STATE_SHOWING;
    this._configureNewLayoutInfo();
    $(document.body).append(this._$shielding).append(this._$element);
  }
};

Menu.prototype._configureNewLayoutInfo = function() {
  this._registerLayoutInfoEvents();
  this._registerPageEvents();
  this._layoutInfo.begin();
  this._layout();
  this._$scrollingContent.append(this._layoutInfo.getPage().element());
};

Menu.prototype._layout = function() {
  this._background.setMetrics(this._layoutInfo.getMetrics());
  this._$element.css(this._layoutInfo.cssForContainer());
  this._layoutInfo.getPage().element().css(this._layoutInfo.cssForPage());
  this._$scrollingContent.css(this._layoutInfo.cssForScroller());
};

Menu.prototype._registerLayoutInfoEvents = function() {
  this._layoutInfo.onUpdate = this._layout.bind(this);
  this._layoutInfo.onNewLayoutInfo = this._switchToLayoutInfo.bind(this);
};

Menu.prototype._registerPageEvents = function() {
  var page = this._layoutInfo.getPage();
  page._onShowHover = function(top, height) {
    this._hoverTop = top;
    this._hoverHeight = height;
    this._updateHighlight();
  }.bind(this);
  page._onHideHover = page._onShowHover.bind(this, 0, 0);
};

Menu.prototype._switchToLayoutInfo = function(layoutInfo) {
  this._layoutInfo.terminate();
  this._layoutInfo.getPage().element().detach();

  this._layoutInfo = layoutInfo;
  this._configureNewLayoutInfo();
};

Menu.prototype._updateHighlight = function() {
  var realTop = this._hoverTop - this._$scrollingContent.scrollTop();
  this._background.setHighlight(realTop, this._hoverHeight);
};

exports.Menu = Menu;
