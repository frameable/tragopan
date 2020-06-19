const assert = require('assert');

suite('tragopan', function() {
  let Tragopan;

  test('require', function() {
    Tragopan = require('../tragopan');
    assert.ok(Tragopan);
  });

  test('constructor', function() {
    // mock some bits
    global.window = {
      addEventListener: _ => {},
    };
    global.document = {};
    const viewport = {
      style: {},
      scroll: _ => {},
      addEventListener: _ => {},
    };
    const content = {
      style: {},
    };

    const tragopan = new Tragopan({ viewport, content });
    assert.ok(tragopan);
  });
});
