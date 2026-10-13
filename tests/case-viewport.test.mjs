import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

// Load the helper actually imported by the deployed entry point.
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const entry = html.match(/<script[^>]+src="\/([^"\s]+)"/)[1];
const bundleURL = new URL(entry, root);
const bundle = readFileSync(bundleURL, 'utf8');
const helper = bundle.match(/import \{fitCaseViewport\} from "([^"\s]+)"/)[1];
const { fitCaseViewport } = await import(new URL(helper, bundleURL));

function fixture({ height = 666, offsetTop = 110, scale = 1, visual = true } = {}) {
  const viewport = Object.assign(new EventTarget(), { height, offsetTop, scale });
  const frames = new Map();
  let id = 0;
  const view = Object.assign(new EventTarget(), {
    innerHeight: 666,
    visualViewport: visual ? viewport : undefined,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const panel = { style: { top: '', height: '', bottom: '' }, scrollTop: 240 };
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(fn => fn());
  };
  return { panel, view, viewport, flush, frames };
}

test('opening covers the visible area even when its origin is shifted', () => {
  const { panel, view } = fixture();
  fitCaseViewport(panel, view);
  assert.equal(panel.style.top, '110px');
  assert.equal(panel.style.height, '666px');
  assert.equal(panel.style.bottom, 'auto');
});

test('follows the address bar resizing and moving without resetting case scroll', () => {
  const { panel, view, viewport, flush } = fixture();
  fitCaseViewport(panel, view);
  flush();
  viewport.height = 776;
  viewport.offsetTop = 0;
  viewport.dispatchEvent(new Event('resize'));
  viewport.dispatchEvent(new Event('scroll'));
  flush();
  assert.equal(panel.style.top, '0px');
  assert.equal(panel.style.height, '776px');
  assert.equal(panel.scrollTop, 240);
  viewport.offsetTop = 48;
  viewport.dispatchEvent(new Event('scroll'));
  flush();
  assert.equal(panel.style.top, '48px');
});

test('keeps normal content magnification during pinch zoom and resyncs afterward', () => {
  const { panel, view, viewport, flush } = fixture({ offsetTop: 0 });
  fitCaseViewport(panel, view);
  flush();
  viewport.scale = 2;
  viewport.height = 333;
  viewport.offsetTop = 90;
  viewport.dispatchEvent(new Event('resize'));
  flush();
  assert.equal(panel.style.height, '666px');
  assert.equal(panel.style.top, '0px');
  viewport.scale = 1;
  viewport.height = 700;
  viewport.dispatchEvent(new Event('resize'));
  flush();
  assert.equal(panel.style.height, '700px');
  assert.equal(panel.style.top, '90px');
});

test('falls back to window height and follows rotation without VisualViewport', () => {
  const { panel, view, flush } = fixture({ visual: false });
  fitCaseViewport(panel, view);
  assert.equal(panel.style.height, '666px');
  view.innerHeight = 393;
  view.dispatchEvent(new Event('resize'));
  flush();
  assert.equal(panel.style.height, '393px');
});

test('closing restores styles, cancels queued work and removes listeners', () => {
  const { panel, view, viewport, flush, frames } = fixture();
  panel.style.top = '2px';
  panel.style.height = '90dvh';
  const dispose = fitCaseViewport(panel, view);
  dispose();
  assert.deepEqual(panel.style, { top: '2px', height: '90dvh', bottom: '' });
  assert.equal(frames.size, 0);
  viewport.dispatchEvent(new Event('resize'));
  viewport.dispatchEvent(new Event('scroll'));
  view.dispatchEvent(new Event('resize'));
  flush();
  assert.equal(frames.size, 0);
  assert.equal(panel.style.top, '2px');
});
