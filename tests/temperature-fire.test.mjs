import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const window = {};
const defaults = vm.runInNewContext(readFileSync(new URL('../assets/digital-fun/temperature-fire.js', import.meta.url), 'utf8') + '\nSETTINGS;', { window });
const fire = Object.create(window.TemperatureFire.prototype);

test('flame labels use plausible Celsius ranges without changing the visual heat field', () => {
  assert.equal(fire.celsiusReading(55), 0);
  assert.ok(fire.celsiusReading(150) >= 700 && fire.celsiusReading(150) <= 850);
  assert.ok(fire.celsiusReading(240) >= 950 && fire.celsiusReading(240) <= 1050);
  assert.ok(fire.celsiusReading(899) >= 1100 && fire.celsiusReading(899) <= 1150);
  let previous = 0;
  for (let value = 55; value <= 899; value++) {
    const reading = fire.celsiusReading(value);
    assert.ok(reading >= previous, 'A hotter visual cell must not show a lower reading');
    assert.ok(reading <= 1150);
    assert.equal(reading % 5, 0, 'Estimates should not imply single-degree precision');
    previous = reading;
  }
});

test('wood, embers and airborne sparks have separate temperature estimates', () => {
  assert.equal(fire.celsiusReading(80, 'wood'), 0);
  assert.ok(fire.celsiusReading(180, 'wood') >= 250 && fire.celsiusReading(180, 'wood') <= 400);
  assert.ok(fire.celsiusReading(160, 'ember') >= 550 && fire.celsiusReading(160, 'ember') <= 800);
  assert.ok(fire.celsiusReading(200, 'spark') >= 600 && fire.celsiusReading(200, 'spark') <= 900);
  assert.ok(fire.celsiusReading(899, 'wood') <= 800);
  assert.ok(fire.celsiusReading(899, 'ember') <= 800);
  assert.ok(fire.celsiusReading(899, 'spark') <= 1000);
});

function fuelModel() {
  const f = Object.create(window.TemperatureFire.prototype);
  Object.assign(f, {
    options: { ...defaults }, createdAt: 17.3, time: 17.3, destroyed: false,
    ignitions: [], gusts: [], fuelHeat: new Float32Array(49),
    spreadCache: { time: NaN, sources: [] }, combustionCache: { time: NaN },
    logs: [{ x: -0.83, y: -0.080, endX: 0.57, endY: 0.010, radius: 0.034 },
      { x: 0.81, y: -0.097, endX: -0.56, endY: -0.006, radius: 0.038 }],
    naturalOrigins: [{ natural: true, offsetY: 0.014 }, { natural: true, offsetY: 0.014 }]
  });
  return f;
}

test('ember heat expires completely after the flame rather than keeping a permanent floor', () => {
  const f = fuelModel();
  assert.ok(f.fuelState(0, 0.5, f.createdAt + 110).ember > 0.9);
  const cooling = f.fuelState(0, 0.5, f.createdAt + 200).ember;
  assert.ok(cooling > 0 && cooling < 0.9);
  assert.equal(f.fuelState(0, 0.5, f.createdAt + 400).ember, 0);
  assert.equal(f.fuelState(0, 0.5, f.createdAt + 10000).ember, 0);
});

test('cold ember readings reach the chosen ambient temperature', () => {
  assert.equal(fire.celsiusReading(160, 'ember', 0), 0);
  const hot = fire.celsiusReading(160, 'ember', 1);
  assert.ok(hot >= 550 && hot <= 800);
  assert.ok(Math.abs(fire.celsiusReading(160, 'ember', 0.5) - hot / 2) <= 5);
  const room = fuelModel();
  room.options.ambientTemperature = 20;
  assert.equal(room.celsiusReading(160, 'ember', 0), 20, 'Cooling must stop at ambient, not below it');
});

test('rendered ash becomes grey and displays zero after cooling', () => {
  const f = fuelModel();
  const marks = [];
  Object.assign(f, { width: 620, height: 620, fontSize: 9, cellW: 19.08, cellH: 10.8,
    rows: 44, columns: 30, baseY: 550, gridLeft: 23.8,
    ctx: { fillText(text) { marks.push({ text, colour: this.fillStyle }); } } });
  f.buildPalette();
  f.buildLogs();
  f.time = f.createdAt + 115;
  f.drawLogs();
  assert.ok(marks.some(m => /^\d+$/.test(m.text) && Number(m.text) >= 500), 'The comparison must include hot embers');
  marks.length = 0;
  f.time = f.createdAt + 400;
  f.fuelHeat.fill(620); // Even residual air heating must not revive exhausted ash.
  f.drawLogs();
  const numbers = marks.filter(m => /^\d+$/.test(m.text));
  assert.ok(numbers.length > 0, 'Cold ash should retain readable temperature labels');
  assert.ok(numbers.every(m => m.text === '000'), 'Ash must not retain a 500–600-degree reading');
  assert.ok(marks.every(m => m.colour === f.colors[55]), 'Cold ash must lose its coloured glow');
});
