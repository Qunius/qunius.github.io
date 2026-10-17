import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Exercise the real artwork model without a browser animation loop.
const window = {};
vm.runInNewContext(readFileSync(new URL('../assets/digital-fun/temperature-fire.js', import.meta.url), 'utf8'), { window });
function fire() {
  const f = Object.create(window.TemperatureFire.prototype);
  Object.assign(f, {
    options: { intensity: 1, burnSeconds: 110, charSeconds: 28, spreadSpeed: 0.022, heatingRate: 45, coolingRate: 18 },
    createdAt: 17.3, time: 17.3, destroyed: false, ignitions: [], gusts: [], heatPuffs: [],
    spreadCache: { time: NaN, sources: [] }, combustionCache: { time: NaN },
    logs: [{ x: -0.83, y: -0.080, endX: 0.57, endY: 0.010, radius: 0.034 },
      { x: 0.81, y: -0.097, endX: -0.56, endY: -0.006, radius: 0.038 }],
    naturalOrigins: [{ natural: true, offsetY: 0.014 }, { natural: true, offsetY: 0.014 }],
    fuelHeat: new Float32Array(49)
  });
  return f;
}

test('active flame readings are in a wood-fire range, and empty air is ambient', () => {
  const f = fire();
  const active = [];
  for (let y = 0.05; y < 0.7; y += 0.04) {
    for (let x = -0.5; x < 0.5; x += 0.04) {
      if (f.heatAt(x, y, f.time) > 0.22) active.push(f.temperatureAt(x, y, f.time));
    }
  }
  assert.ok(active.length > 20);
  assert.ok(Math.min(...active) >= 600, 'Visible flame must not read 100–240 °C');
  assert.ok(Math.max(...active) >= 900, 'Include hotter reaction regions');
  assert.ok(Math.max(...active) <= 1150);
  assert.equal(f.temperatureAt(1.5, 1.5, f.time), 22);
});

test('air cannot increase heat without limit or keep an exhausted fire hot', () => {
  const f = fire();
  f.heatPuffs = [{ x: 0, strength: 1, start: f.time }];
  f.updateFuelHeat(0);
  assert.equal(Math.max(...f.fuelHeat), 0);
  for (let i = 0; i < 600; i++) {
    f.heatPuffs[0].start = f.time;
    f.updateFuelHeat(1 / 30);
  }
  assert.ok(Math.max(...f.fuelHeat) <= 150, 'Extra oxygen has a limited heating effect');
  assert.ok(f.temperatureAt(0, 0.03, f.time) <= 1150);
  f.time += 1000;
  f.heatPuffs = [];
  for (let i = 0; i < 600; i++) f.updateFuelHeat(1 / 30);
  assert.equal(f.temperatureAt(0, 0.03, f.time), 22);
});

test('embers persist after the flames, then cool all the way to ambient', () => {
  const f = fire();
  const glowing = f.fuelState(0, 0.5, f.createdAt + 120);
  const cold = f.fuelState(0, 0.5, f.createdAt + 800);
  assert.equal(glowing.flame, 0);
  assert.ok(glowing.ember > 0.5);
  assert.equal(cold.ember, 0, 'Embers must not stay warm forever');
});

test('wood surfaces stay cooler than flame gas and cold embers lose their glow', () => {
  const f = fire();
  assert.equal(f.woodTemperature(0, 0, false), 22);
  assert.ok(f.woodTemperature(1, 0, false) >= 250);
  assert.ok(f.woodTemperature(1, 0, false) <= 400);
  assert.ok(f.woodTemperature(1, 1, true, 150) <= 800);
  assert.ok(f.emberTemperature(1, 0.5, 0.5) >= 550);
  assert.ok(f.emberTemperature(1, 0.5, 0.5) <= 800);
  assert.equal(f.emberTemperature(0, 0.5, 0.5), 22);
  assert.ok(f.emberTemperature(0.2, 0.5, 0.5) < 200);
});
