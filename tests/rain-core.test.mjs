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

test('center-cover crop preserves the photo aspect ratio in wide and narrow scenes', () => {
  assert.ok(core, 'rain simulation is available');
  const wide = core.coverCrop(4/3, 16/10);
  assert.equal(wide[0], 1);
  assert.ok(Math.abs(wide[1] - 5/6) < 1e-12);
  const narrow = core.coverCrop(4/3, 4/5);
  assert.ok(Math.abs(narrow[0] - .6) < 1e-12);
  assert.equal(narrow[1], 1);
});

test('a pending video play cannot restart playback after pause or leaving the page', async () => {
  let finish;
  const video={paused:true,pause(){this.paused=true;},play(){return new Promise(resolve=>{finish=()=>{this.paused=false;resolve();};});}};
  const playback=new core.MediaPlayback(video);
  const playing=playback.sync(true);
  playback.sync(false);
  finish();await playing;
  assert.equal(video.paused,true);
  assert.equal(playback.wanted,false);
});

test('a rejected video start reports the blocked state and allows a fresh user retry', async () => {
  let attempts=0,blocked=0;
  const video={paused:true,pause(){this.paused=true;},play(){attempts++;if(attempts===1)return Promise.reject(new Error('blocked'));this.paused=false;return Promise.resolve();}};
  const playback=new core.MediaPlayback(video,()=>blocked++);
  await playback.sync(true);
  assert.equal(blocked,1);
  await playback.sync(true);
  assert.equal(video.paused,false);
  playback.sync(false);
  assert.equal(video.paused,true);
});

test('an obsolete play rejection cannot pause a newer resume request', async () => {
  const pending=[];let blocked=0;
  const video={paused:true,pause(){this.paused=true;},play(){return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
  const playback=new core.MediaPlayback(video,()=>blocked++);
  const first=playback.sync(true);playback.sync(false);const second=playback.sync(true);
  pending[0].reject(new Error('interrupted by pause'));await first;
  assert.equal(blocked,0);
  assert.equal(pending.length,2,'resuming starts a fresh play request');
  pending[1].resolve();await second;
});
