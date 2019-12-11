# tragopan

Minimal dependency-free pan/zoom library

```html
  <div id="viewport">
    <div id="content">
      <!-- your pan/zoomable content here -->
    </div>
  </div>

  <script>
    const tragopan = new Tragopan({
      viewport: document.querySelector('#viewport'),
      content: document.querySelector('#content')
    });
  </script>
```

## Methods

### new Tragopan(options)

Instantiate a pan/zoomable tragopan instance, given a viewport and a nested content element.  Options include:

  - `viewport`: reference to a top-level element which will contain content to be panned and zoomed
  - `content`: a child element of the viewport
  - `scaleIncrement`: percentage by which zooming in or out one click should change the scale (default `0.04`)
  - `scrollZoom`: enable bare scrolling to zoom, rather than ctrl/option-scroll to zoom (default `false`)
  - `spacePan`: enable panning via holding down the space bar (default `false`)
  - `minScale`: minimum zoom scale factor (default `0.5`)
  - `maxScale`: maximum zoom scale factor (default `4`)

### tragopan.pan(x, y)

Pan to the given x and y coordinates in content space.

### tragopan.zoom(scale[, focalPoint])

Zoom to the given scale, keeping the given focal point in-place on the screen.  Focal point should be an object with x and y coordinates in content space.  If focal point is ommitted, the center point of the viewport is used instead.


### tragopan.on(eventName, handlerFn)

Register an event handler to be called when some panning or zooming event occurs.  See below for more info.

## Events

### panstart

Fired when a pan may be starting as a result of the user mousing-down on the viewport.  A pan may or may not follow, with a click being a possible alternative conclusion.

### panmove

Fired when the content moves relative to the viewport, whether from a click-drag, from a call to `zoom()`, or from a native scroll mouse event.

### panend

Fired when a pan via click-drag ends with a mouse-up.

### panzoom

Fired when the scale changes, either from a call to `zoom()`, or from a native 
ctrl/option-scroll mouse event.

### panchange

Fired when any event above occurs.


