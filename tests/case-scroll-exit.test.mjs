import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// This repository contains the published build, not the React source.
// Exercise the real scroll gate from the bundle loaded by index.html.
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const entry = html.match(/<script[^>]+src="\/([^"\s]+)"/)[1];
const bundle = readFileSync(new URL(entry, root), 'utf8');
const start = bundle.indexOf('const Es=240,wd=180,Ld=180;');
const end = bundle.indexOf('function Gg(', start);
assert.ok(start >= 0 && end > start, 'Locate the deployed scroll gate');
const createGate = Function(`${bundle.slice(start, end)};return Yg;`)();
const wheel = (gate, now, dy = 30, dx = 0, enabled = true) =>
  gate.wheel({ now, dy, dx, enabled });

test('continued downward scrolling exits without a pause or click', () => {
  const gate = createGate();
  gate.observe(false, 0);
  wheel(gate, 0);
  gate.observe(true, 16);
  let progress;
  for (let now = 16; now <= 400; now += 16) {
    progress = wheel(gate, now);
  }
  assert.equal(progress, 1);
});

test('scrolling within the case cannot start an exit', () => {
  const gate = createGate();
  gate.observe(false, 0);
  for (let now = 0; now <= 500; now += 16) {
    assert.equal(wheel(gate, now), null);
  }
});

test('a short tail immediately on reaching the bottom does not exit', () => {
  const gate = createGate();
  gate.observe(true, 0);
  for (let now = 0; now <= 160; now += 16) {
    assert.equal(wheel(gate, now, 5), null);
  }
});

test('a new downward gesture after a pause still exits', () => {
  const gate = createGate();
  gate.observe(true, 0);
  wheel(gate, 500, 90);
  assert.equal(wheel(gate, 516, 90), 1);
});

test('horizontal movement and disabled gestures cannot start an exit', () => {
  const gate = createGate();
  gate.observe(true, 0);
  assert.equal(wheel(gate, 500, 30, 60), null);
  assert.equal(wheel(gate, 1000, 90, 0, false), null);
});

test('reversing direction unwinds the exit gesture', () => {
  const gate = createGate();
  gate.observe(true, 0);
  assert.ok(wheel(gate, 500, 90) > 0);
  assert.equal(wheel(gate, 516, -90), 0);
});

test('leaving the bottom cancels progress and re-arms the settling guard', () => {
  const gate = createGate();
  gate.observe(true, 0);
  wheel(gate, 500, 90);
  gate.observe(false, 516);
  assert.equal(wheel(gate, 532), null);
  gate.observe(true, 548);
  assert.equal(wheel(gate, 564), null);
  assert.equal(wheel(gate, 900, 90), 0.5);
});
