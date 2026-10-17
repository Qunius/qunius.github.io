import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const window = {};
vm.runInNewContext(readFileSync(new URL('../assets/digital-fun/temperature-fire.js', import.meta.url), 'utf8'), { window });
const fire = Object.create(window.TemperatureFire.prototype);

test('flame labels use plausible Celsius ranges without changing the visual heat field', () => {
  assert.equal(fire.celsiusReading(55), 20);
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
  assert.equal(fire.celsiusReading(80, 'wood'), 20);
  assert.ok(fire.celsiusReading(180, 'wood') >= 250 && fire.celsiusReading(180, 'wood') <= 400);
  assert.ok(fire.celsiusReading(160, 'ember') >= 550 && fire.celsiusReading(160, 'ember') <= 800);
  assert.ok(fire.celsiusReading(200, 'spark') >= 600 && fire.celsiusReading(200, 'spark') <= 900);
  assert.ok(fire.celsiusReading(899, 'wood') <= 800);
  assert.ok(fire.celsiusReading(899, 'ember') <= 800);
  assert.ok(fire.celsiusReading(899, 'spark') <= 1000);
});
