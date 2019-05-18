class Tragopan {

  constructor({ viewport, content, minScale, maxScale }) {
    this.viewport = viewport;
    this.viewport.style.overflow = 'scroll';
    this.content = content;
    this.matrix = { scale: 1, tx: 0, ty: 0 };
    this.minScale = Number.isFinite(minScale) ? minScale : 0.5;
    this.maxScale = Number.isFinite(maxScale) ? maxScale : 4;
    this.registeredEventListeners = { panstart: [], panmove: [], panend: [], panchange: [], panzoom: [] };
    this._addListeners();
  }

  dispatch(eventName, data) {
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

  _addListeners() {
    let x, y;

    const handleMouseMove = (e) => {
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      x = e.clientX;
      y = e.clientY;
      this.pan(this.viewport.scrollLeft - dx, this.viewport.scrollTop - dy);
      this.dispatch('panmove', { dx, dy, x, y, mouseEvent: e });
    };

    const handleMouseUp = (e) => {
      x = e.clientX;
      y = e.clientY;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      this.dispatch('panend', { x, y, mouseEvent: e });
    };

    this.viewport.addEventListener('mousedown', (e) => {
      x = e.clientX;
      y = e.clientY;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      this.dispatch('panstart', { x, y, mouseEvent: e });
    });

    this.viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.stopPropagation();
        e.preventDefault();
        const prevScale = this.matrix.scale;
        const dir = e.wheelDelta > 0 ? 1 : -1;
        const targetScale = this.matrix.scale * (dir == 1 ? 1.04 : 0.96);
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
    });

    this.viewport.addEventListener('scroll', (e) => {
      const originalX = this.matrix.tx;
      const originalY = this.matrix.ty;
      const x = this.matrix.tx = this.viewport.scrollLeft;
      const y = this.matrix.ty = this.viewport.scrollTop;
      const dx = this.matrix.tx - originalX;
      const dy = this.matrix.ty - originalY;
    });
  }

  zoom(scale, focus) {
    scale = Math.min(scale, this.maxScale);
    scale = Math.max(scale, this.minScale);
    const prevScale = this.matrix.scale;
    const factor = scale / prevScale;
    this.matrix.scale = scale;

    focus = focus || {
      x: this.matrix.tx / prevScale + (this.viewport.offsetWidth / 2 / prevScale),
      y: this.matrix.ty / prevScale + (this.viewport.offsetHeight / 2 / prevScale)
    };

    const dx = Math.round(focus.x * prevScale - focus.x * this.matrix.scale);
    const dy = Math.round(focus.y * prevScale - focus.y * this.matrix.scale);

    const scrollLeft = this.viewport.scrollLeft - dx;
    const scrollTop = this.viewport.scrollTop - dy;

    // pan before or after depending on whether we're zooming in or out
    scale < prevScale && this.pan(scrollLeft, scrollTop);
    this.content.style.transform = `scale(${this.matrix.scale})`;
    scale >= prevScale && this.pan(scrollLeft, scrollTop);
  }

  pan(scrollLeft, scrollTop) {
    viewport.scroll(scrollLeft, scrollTop);
  }
}
