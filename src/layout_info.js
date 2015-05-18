function BaseLayoutInfo(context, page) {
  this._context = context;
  this._page = page;
  this._metrics = null;

  this.onUpdate = null;
  this.onNewLayoutInfo = null;
}

BaseLayoutInfo.prototype.begin = function() {
  this.setMetrics(Metrics.computeBestFittingMetrics(this.getContext(),
    this.getPage()));
};

BaseLayoutInfo.prototype.cssForContainer = function() {
  return {
    width: this.getMetrics().width + Menu.ARROW_SIZE + Menu.SHADOW_BLUR*2,
    height: this.getMetrics().height + Menu.SHADOW_BLUR*2,
    left: this.getMetrics().pointX - Menu.SHADOW_BLUR,
    top: this.getMetrics().pointY - this.getMetrics().pixelsAboveArrow -
      Menu.SHADOW_BLUR
  };
};

BaseLayoutInfo.prototype.cssForPage = function() {
  return {left: '', position: ''};
};

BaseLayoutInfo.prototype.cssForScroller = function() {
  return {overflowY: this.getMetrics().scrolls ? 'scroll' : 'hidden'};
};

BaseLayoutInfo.prototype.getContext = function() {
  return this._context;
};

BaseLayoutInfo.prototype.getMetrics = function() {
  return this._metrics;
};

BaseLayoutInfo.prototype.getPage = function() {
  return this._page;
};

BaseLayoutInfo.prototype.setMetrics = function(metrics) {
  this._metrics = metrics;
};

BaseLayoutInfo.prototype.terminate = function() {
};

function RegularLayoutInfo(context, page) {
  BaseLayoutInfo.call(this, context, page);
  this._resizeHandler = this._recomputeMetrics.bind(this);
}

RegularLayoutInfo.prototype = Object.create(BaseLayoutInfo.prototype);

RegularLayoutInfo.prototype.begin = function() {
  BaseLayoutInfo.prototype.begin.call(this);
  $(window).resize(this._resizeHandler);
};

RegularLayoutInfo.prototype.terminate = function() {
  $(window).off('resize', this._resizeHandler);
};

RegularLayoutInfo.prototype._recomputeMetrics = function() {
  var newMetrics = Metrics.computeBestFittingMetrics(this.getContext(),
    this.getPage());
  if (!this.getMetrics().equals(newMetrics)) {
    this.setMetrics(newMetrics);
    this.onUpdate();
  }
};

function TransitionLayoutInfo(context, page, startMetrics, forwards) {
  BaseLayoutInfo.call(this, context, page);

  this._startMetrics = startMetrics;
  this._forwards = forwards;

  this._endMetrics = null;
  this._startTime = null;
  this._left = 0;
  this._terminated = false;
}

TransitionLayoutInfo.DURATION = 300;

TransitionLayoutInfo.prototype = Object.create(BaseLayoutInfo.prototype);

TransitionLayoutInfo.prototype.begin = function() {
  this._endMetrics = Metrics.computeBestFittingMetrics(this.getContext(),
    this.getPage());
  this._startTime = new Date().getTime();
  this._updateLeft(0);
  this._updateMetrics(0);
  this._requestAnimationFrame();
};

TransitionLayoutInfo.prototype.cssForPage = function() {
  return {left: this._left, position: 'relative'};
};

TransitionLayoutInfo.prototype.terminate = function() {
  this._terminated = true;
};

TransitionLayoutInfo.prototype._done = function() {
  this.onNewLayoutInfo(new RegularLayoutInfo(this.getContext(),
    this.getPage()));
};

TransitionLayoutInfo.prototype._requestAnimationFrame = function() {
  if ('function' === typeof window.requestAnimationFrame) {
    window.requestAnimationFrame(this._tick.bind(this));
  } else {
    setTimeout(this._tick.bind(this), 1000/60);
  }
};

TransitionLayoutInfo.prototype._tick = function() {
  if (this._terminated) {
    return;
  }
  var elapsed = Math.max(new Date().getTime()-this._startTime, 0);
  var percent = elapsed / TransitionLayoutInfo.DURATION;
  if (percent >= 1) {
    this._done();
  } else {
    this._requestAnimationFrame();
    this._updateLeft(percent);
    this._updateMetrics(percent);
    this.onUpdate();
  }
};

TransitionLayoutInfo.prototype._updateLeft = function(percent) {
  var initialLeft;
  if (this._forwards) {
    initialLeft = this._startMetrics.width;
  } else {
    initialLeft = -this.getPage().width();
  }
  this._left = (1 - Math.min(percent*2, 1)) * initialLeft;
};

TransitionLayoutInfo.prototype._updateMetrics = function(percent) {
  this.setMetrics(Metrics.transition(this._startMetrics, this._endMetrics,
    Math.max(percent*2 - 1, 0)));
};
