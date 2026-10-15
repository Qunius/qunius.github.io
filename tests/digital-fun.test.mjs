import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/digital-fun/digital-fun.js', import.meta.url), 'utf8');

function fixture() {
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, Object.assign(new EventTarget(), {
      hidden: true, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }
    }));
    return nodes.get(id);
  };
  const motion = Object.assign(new EventTarget(), { matches: false });
  const instances = [];
  let onIntersection;
  class Fire {
    constructor() { this.paused = false; instances.push(this); }
    pause() { this.paused = true; }
    resume() { this.paused = false; }
    destroy() { this.destroyed = true; }
  }
  class Observer {
    constructor(callback) { onIntersection = callback; }
    observe() {}
  }
  const window = Object.assign(new EventTarget(), {
    TemperatureFire: Fire, matchMedia: () => motion, IntersectionObserver: Observer
  });
  vm.runInNewContext(source, {
    window, document: { getElementById: element }, IntersectionObserver: Observer, console
  });
  return {
    element, instances, motion, window,
    click(id) { element(id).dispatchEvent(new Event('click')); },
    visible(value) { onIntersection([{ isIntersecting: value }]); }
  };
}

test('scrolling away and browser history suspend the fire without undoing a manual pause', () => {
  const f = fixture();
  f.visible(true);
  assert.equal(f.instances[0].paused, false);
  f.visible(false);
  assert.equal(f.instances[0].paused, true);
  f.visible(true);
  assert.equal(f.instances[0].paused, false);
  f.click('pause-fire');
  f.visible(false);
  f.visible(true);
  f.window.dispatchEvent(new Event('pagehide'));
  f.window.dispatchEvent(new Event('pageshow'));
  assert.equal(f.instances[0].paused, true);
  assert.equal(f.element('pause-fire').textContent, 'Fortsätt');
});

test('new wood disposes the old fire and preserves the pause choice', () => {
  const f = fixture();
  f.visible(true);
  f.click('pause-fire');
  f.click('reset-fire');
  assert.equal(f.instances[0].destroyed, true);
  assert.equal(f.instances[1].paused, true);
  assert.match(f.element('fire-status').textContent, /pausad/);
  f.click('pause-fire');
  assert.equal(f.instances[1].paused, false);
});

test('reduced motion is explained and keyboard pause only toggles once per press', () => {
  const f = fixture();
  f.visible(true);
  f.motion.matches = true;
  f.motion.dispatchEvent(new Event('change'));
  assert.equal(f.element('pause-fire').disabled, true);
  assert.equal(f.element('motion-note').hidden, false);
  f.click('pause-fire');
  assert.equal(f.element('pause-fire').attributes['aria-pressed'], 'false');
  f.motion.matches = false;
  f.motion.dispatchEvent(new Event('change'));
  const space = new Event('keydown', { cancelable: true });
  Object.assign(space, { code: 'Space', repeat: false });
  f.element('fire').dispatchEvent(space);
  assert.equal(space.defaultPrevented, true);
  assert.equal(f.instances[0].paused, true);
  const repeat = new Event('keydown', { cancelable: true });
  Object.assign(repeat, { code: 'Space', repeat: true });
  f.element('fire').dispatchEvent(repeat);
  assert.equal(f.instances[0].paused, true);
});
