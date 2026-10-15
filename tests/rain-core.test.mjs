import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let core;
try { core = require('../assets/digital-fun/rain-core.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }

test('a wiped point stays clear for five seconds and refogs over the following twenty', () => {
  assert.ok(core, 'rain simulation is available');
  const fog = new core.FogField(100, 100);
  fog.wipe(.5, .5, .5, .5, .1, 0);
  assert.equal(fog.sample(.5, .5, 0), 1);
  assert.equal(fog.sample(.5, .5, 5), 1);
  assert.equal(fog.sample(.5, .5, 15), .5);
  assert.equal(fog.sample(.5, .5, 25), 0);
  assert.equal(fog.sample(.1, .1, 0), 0);
});

test('fast swipes are continuous, feathered and independent of later strokes', () => {
  assert.ok(core, 'rain simulation is available');
  const fog = new core.FogField(200, 100);
  fog.wipe(.2, .4, .8, .4, .12, 0);
  assert.equal(fog.sample(.5, .4, 0), 1);
  const edge = fog.sample(.5, .49, 0);
  assert.ok(edge > 0 && edge < 1);
  fog.wipe(.5, .8, .5, .8, .1, 12);
  assert.equal(fog.sample(.5, .4, 25), 0);
  assert.equal(fog.sample(.5, .8, 17), 1);
  fog.reset();
  assert.equal(fog.sample(.5, .8, 17), 0);
});

test('pause, hidden page, offscreen and reduced motion freeze the same clock without catch-up', () => {
  assert.ok(core, 'rain simulation is available');
  for (const key of ['paused', 'hidden', 'offscreen', 'reduced']) {
    const state = new core.RainState();
    state.tick(0); state.tick(40);
    assert.equal(state.time, .04);
    state[key] = true;
    state.tick(80); state.tick(10000);
    assert.equal(state.time, .04, key);
    assert.equal(state.running, false);
    state[key] = false;
    state.tick(20000);
    assert.equal(state.time, .04, 'resuming establishes a new time baseline');
    state.tick(20040);
    assert.equal(state.time, .08);
  }
});

test('manual wipe still changes condensation on a paused clock', () => {
  assert.ok(core, 'rain simulation is available');
  const state = new core.RainState();
  const fog = new core.FogField(100, 100);
  state.paused = true;
  fog.wipe(.5, .5, .5, .5, .1, state.time);
  state.tick(30000);
  assert.equal(fog.sample(.5, .5, state.time), 1);
});

test('touching drops merge by area and a large merged drop starts running', () => {
  assert.ok(core, 'rain simulation is available');
  const rain = new core.DropField(1000, 800, () => .5, 0);
  rain.drops = [{x:300,y:200,r:3.6,vy:0,seed:1}, {x:304,y:200,r:3.6,vy:0,seed:2}];
  rain.step(.016);
  assert.equal(rain.drops.length, 1);
  assert.ok(Math.abs(rain.drops[0].r - Math.sqrt(25.92)) < .01);
  const y = rain.drops[0].y;
  for (let i = 0; i < 60; i++) rain.step(1/60);
  assert.ok(rain.drops[0].y > y + 5);
});

test('center-cover crop preserves the photo aspect ratio in wide and narrow scenes', () => {
  assert.ok(core, 'rain simulation is available');
  const wide = core.coverCrop(4/3, 16/10);
  assert.equal(wide[0], 1);
  assert.ok(Math.abs(wide[1] - 5/6) < 1e-12);
  const narrow = core.coverCrop(4/3, 4/5);
  assert.ok(Math.abs(narrow[0] - .6) < 1e-12);
  assert.equal(narrow[1], 1);
});

test('a long visit keeps receiving new running drops rather than exhausting the initial rain', () => {
  let seed=123;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const rain=new core.DropField(1280,800,random,160);
  for(let i=0;i<3600;i++)rain.step(1/30);
  assert.ok(rain.drops.some(d=>d.vy>10), 'there is still flowing rain after two minutes');
  assert.ok(rain.drops.length<=195, 'drop population stays bounded');
  assert.ok(rain.trails.length<=1800);
});
