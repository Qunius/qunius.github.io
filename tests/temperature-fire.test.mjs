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

test('a heat pulse rises from the fuel bed and disappears after blowing stops', () => {
  const f = fire();
  const start = f.time;
  f.heatPuffs = [{ x: 0, strength: 1, start }];
  const earlyLow = f.airLiftAt(0, 0.10, start + 0.2);
  const earlyHigh = f.airLiftAt(0, 0.70, start + 0.2);
  const lateLow = f.airLiftAt(0, 0.10, start + 1.8);
  const lateHigh = f.airLiftAt(0, 0.70, start + 1.8);
  assert.ok(earlyLow > 0.1, 'The response should begin near the wood');
  assert.ok(earlyLow > earlyHigh, 'The pulse must reach the base before the upper flame');
  assert.ok(lateHigh > 0, 'The pulse should remain visible while it rises');
  assert.ok(lateHigh > lateLow, 'The pulse should move upward instead of heating the whole flame at once');
  assert.equal(f.airLiftAt(0, 0.10, start + 3), 0);
  assert.equal(f.airLiftAt(0, 0.70, start + 3), 0);
});

test('overlapping heat pulses have a bounded lift and do not act before they begin', () => {
  const f = fire();
  f.heatPuffs = Array.from({ length: 100 }, () => ({ x: 0, strength: 1, start: f.time }));
  assert.equal(f.airLiftAt(0, 0.10, f.time + 0.2), 1, 'Repeated blowing must saturate at one');
  assert.equal(f.airLiftAt(0, 0.10, f.time - 0.1), 0);
  for (let y = -0.1; y <= 1.2; y += 0.05) {
    const lift = f.airLiftAt(0, y, f.time + 1.2);
    assert.ok(lift >= 0 && lift <= 1);
  }
});

test('upper-air gusts and gusts over exhausted wood produce wind without heat pulses', () => {
  for (const exhausted of [false, true]) {
    const f = fire();
    Object.assign(f, { width: 1000, columns: 100, cellW: 10, rows: 100, cellH: 10, baseY: 1000 });
    if (exhausted) f.time += 1000;
    const y = exhausted ? 0.04 : 0.70;
    f.gustAt(500, f.baseY - y * f.rows * f.cellH, false);
    assert.equal(f.gusts.length, 1);
    assert.equal(f.heatPuffs.length, 0, exhausted ? 'Spent wood cannot feed a hot pulse' : 'Upper flame air cannot feed a hot pulse');
    assert.ok(f.windAt(0, y + 0.02, f.time + 0.2), 'Air should still visibly push the flame');
    assert.equal(f.airLiftAt(0, y, f.time + 0.2), 0);
  }
});

test('blowing at burning wood creates a moderately larger visible flame field', () => {
  const blown = fire();
  const control = fire();
  Object.assign(blown, { width: 1000, columns: 100, cellW: 10, rows: 100, cellH: 10, baseY: 1000 });
  blown.gustAt(500, 960, false);
  assert.ok(blown.heatPuffs.length > 0, 'A gust near live fuel should start a hot pulse');
  // Give both fields the same wind so this comparison isolates flame growth.
  control.gusts = blown.gusts.map(gust => ({ ...gust }));
  let baselineCells = 0, blownCells = 0;
  const t = blown.time + 0.7;
  for (let y = 0.10; y < 1; y += 0.015) {
    for (let x = -0.85; x <= 0.85; x += 0.015) {
      if (control.heatAt(x, y, t) > 0.16) baselineCells++;
      if (blown.heatAt(x, y, t) > 0.16) blownCells++;
    }
  }
  assert.ok(baselineCells > 100);
  assert.ok(blownCells > baselineCells * 1.01, 'The hot pulse should enlarge the flame, not only change its temperature');
  assert.ok(blownCells < baselineCells * 1.5, 'Blowing should strengthen the flame moderately');
  assert.equal(blown.heatAt(0, 0.3, blown.time + 3), control.heatAt(0, 0.3, control.time + 3),
    'The extra flame growth should expire after the gust');
});

test('a rising pulse adds limited temperature only while it passes', () => {
  const f = fire();
  const t = f.time + 0.2;
  const baseline = f.temperatureAt(0, 0.10, t, 0.6);
  f.heatPuffs = [{ x: 0, strength: 1, start: f.time }];
  const warmed = f.temperatureAt(0, 0.10, t, 0.6);
  assert.ok(warmed > baseline, 'Passing hot air should raise the local flame reading');
  assert.ok(warmed <= baseline + 70, 'The pulse contributes at most 70 degrees');
  assert.ok(f.temperatureAt(0, 0.10, t, 1) <= 1150);
  const expired = f.temperatureAt(0, 0.10, f.time + 3, 0.6);
  f.heatPuffs = [];
  assert.equal(expired, f.temperatureAt(0, 0.10, f.time + 3, 0.6));
});
