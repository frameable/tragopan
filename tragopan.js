class Tragopan {

  constructor() {
    this.configure(...arguments);
    this.viewport.style.overflow = 'auto';
    this.content.style.transformOrigin = 'top left';
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.registeredEventListeners = { panstart: [], panmove: [], panend: [], panchange: [], panzoom: [] };
    this.window = window;
    this._addListeners();
    this._manualScroll();
    this.isDisabled = false;
    this.center();
  }

  configure({ viewport, content, minScale, maxScale, scaleIncrement, scrollZoom, spacePan }) {
    this.viewport = viewport || this.viewport;
    this.content = content || this.content;
    this.spacePan = spacePan !== undefined ? spacePan : this.spacePan;
    this.scrollZoom = scrollZoom !== undefined ? scrollZoom : this.scrollZoom;
    this.minScale = Number.isFinite(minScale) ? minScale : Number.isFinite(this.minScale) ? this.minScale : 0.5;
    this.maxScale = Number.isFinite(maxScale) ? maxScale : Number.isFinite(this.maxScale) ? this.maxScale : 4;
    this.scaleIncrement = scaleIncrement || this.scaleIncrement || 0.04;
  }

  dispatch(eventName, data) {
    if (this.isDisabled) return;
    for (const callback of this.registeredEventListeners[eventName]) {
      callback.call(this, { eventName, ...data });
    }
    if (eventName != 'panchange') {
      this.dispatch('panchange', { eventName, ...data });
    }
  }

  on(eventName, callback) {
    this.registeredEventListeners[eventName].push(callback);
  }

  _manualScroll() {
    if (this.viewport === document.body && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }

  _addListeners() {
    let x, y;

    const handleMouseMove = (e) => {
      if (!this.isPanning) return;
      if (this.isDisabled) return;
      if (x === null && y === null) {
        x = e.clientX;
        y = e.clientY;
        return;
      }
      const offsetX = e.clientX - x;
      const offsetY = e.clientY - y;
      this.viewport.scroll(this.viewport.scrollLeft - offsetX, this.viewport.scrollTop - offsetY);
      x = e.clientX;
      y = e.clientY;
      const dx = offsetX / this.scale;
      const dy = offsetY / this.scale;
      this.dispatch('panmove', { dx, dy, x: x / this.scale, y: y / this.scale, mouseEvent: e });
    };

    const handleMouseUp = (e) => {
      if (this.isDisabled) return;
      x = e.clientX;
      y = e.clientY;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      this.isPanning = false;
      this.dispatch('panend', { x, y, mouseEvent: e });
    };

    const handleMouseDown = (e) => {
      if (this.isDisabled) return;
      if (this.isPanning) return;
      if (this._isKeyboardInteractable(e.target)) return;
      x = e.clientX;
      y = e.clientY;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      this.isPanning = true;
      this.dispatch('panstart', { x, y, mouseEvent: e });
    }

    this.viewport.addEventListener('mousedown', (e) => {
      handleMouseDown(e);
    });

    this.viewport.addEventListener('wheel', (e) => {
      if (this.isDisabled) return;
      if (e.ctrlKey || (this.scrollZoom && !this.space)) {
        e.stopPropagation();
        e.preventDefault();
        const prevScale = this.scale;
        const dir = e.deltaY > 0 ? -1 : 1;
        const upScale = 1 + this.scaleIncrement;
        const downScale = 1 - this.scaleIncrement;
        const targetScale = this.scale * (dir == 1 ? upScale : downScale);
        let mouseX = e.offsetX;
        let mouseY = e.offsetY;
        let el = e.target;
        while (el !== this.content && el) {
          mouseX += el.offsetLeft;
          mouseY += el.offsetTop;
          el = el.offsetParent;
        }
        this.zoom(targetScale, { x: mouseX, y: mouseY });
        this.dispatch('panzoom', { mouseEvent: e });
      }
    }, { passive: false });

    this.viewport.addEventListener('scroll', (e) => {
      if (this.isDisabled) return;
      const originalX = this.tx;
      const originalY = this.ty;
      const x = this.tx = this.viewport.scrollLeft;
      const y = this.ty = this.viewport.scrollTop;
      const dx = this.tx - originalX;
      const dy = this.ty - originalY;
    });

    this.window.addEventListener('keydown', (e) => {
      if (e.keyCode !== 32) return;
      if (this._isKeyboardInteractable(e.target)) return;
      e.preventDefault();
      if (this.isPanning) return;
      this.isPanning = true;
      if (!this.spacePan) return;
      this.space = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      x = y = null;
      this.dispatch('panstart', { x, y, mouseEvent: e });
    });

    this.window.addEventListener('keyup', (e) => {
      if (!this.spacePan) return;
      if (this.isDisabled) return;
      this.space = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      this.isPanning = false;
      this.dispatch('panend', { x, y, mouseEvent: e });
    });
  }

  _isKeyboardInteractable(el) {
    // https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus/1600194#1600194
    const candidate = el.matches(`a[href],area[href],button,details,input,select,textarea,[tabindex]`);
    const interactable = (candidate && !el.disabled) || el.isContentEditable || el.classList.contains('tragopan-pannable');
    return interactable;
  }

  zoom(scale, focalPoint) {
    if (this.isDisabled) return;
    scale = Math.min(scale, this.maxScale);
    scale = Math.max(scale, this.minScale);
    const prevScale = this.scale;
    const factor = scale / prevScale;
    this.scale = scale;

    // determine our center focal point if it wasn't provided
    focalPoint = focalPoint || {
      x: this.tx + (this.viewport.offsetWidth / 2 / prevScale),
      y: this.ty + (this.viewport.offsetHeight / 2 / prevScale)
    };

    // determine how far we have to shift to compensate for scaling to keep focus
    const dx = Math.round(focalPoint.x * prevScale - focalPoint.x * this.scale);
    const dy = Math.round(focalPoint.y * prevScale - focalPoint.y * this.scale);
    const scrollLeft = (this.viewport.scrollLeft - dx);
    const scrollTop = (this.viewport.scrollTop - dy);

    // pan before or after depending on whether we're zooming in or out
    scale < prevScale && this.viewport.scroll(scrollLeft, scrollTop);
    this.content.style.transform = `scale(${this.scale})`;
    scale >= prevScale && this.viewport.scroll(scrollLeft, scrollTop);
    this.tx = scrollLeft / this.scale;
    this.ty = scrollTop / this.scale;
  }

  zoomIn(scaleIncrement) {
    scaleIncrement = Number.isFinite(scaleIncrement) ? scaleIncrement : this.scaleIncrement;
    const scale = this.scale * (1 + scaleIncrement);
    this.zoom(scale);
  }

  zoomOut(scaleIncrement) {
    scaleIncrement = Number.isFinite(scaleIncrement) ? scaleIncrement : this.scaleIncrement;
    const scale = this.scale * (1 - scaleIncrement);
    this.zoom(scale);
  }

  pan(x, y) {
    if (this.isDisabled) return;
    const scrollLeft = x * this.scale;
    const scrollTop = y * this.scale;
    const dx = this.viewport.scrollLeft - x;
    const dy = this.viewport.scrollTop - y;
    this.viewport.scroll(scrollLeft, scrollTop);
    this.tx = scrollLeft / this.scale;
    this.ty = scrollTop / this.scale;
    this.dispatch('panmove', { dx, dy, x, y, mouseEvent: null });
  }

  center() {
    const x = this.content.offsetWidth / 2 - this.viewport.offsetWidth / 2 / this.scale;
    const y = this.content.offsetHeight / 2 - this.viewport.offsetHeight / 2 / this.scale;
    this.pan(x, y);
  }

  disable() {
    this.isDisabled = true;
  }

  enable() {
    this.isDisabled = false;
  }

  reset() {
    if (this.isDisabled) return;
    this.content.style.transform = 'scale(1)';
    this.scale = 1;
    this.pan(0, 0);
  }
}

if (typeof module === "object" && module.exports) {
  module.exports = Tragopan;
}
