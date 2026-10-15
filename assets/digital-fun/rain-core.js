/* Small, deterministic parts of the rain window; shared with the node tests. */
(function (root) {
  'use strict';
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const smooth = n => n * n * (3 - 2 * n);

  class RainState {
    constructor() {
      this.paused = false; this.hidden = false; this.offscreen = false;
      this.reduced = false; this.time = 0; this.last = null;
    }
    get running() { return !this.paused && !this.hidden && !this.offscreen && !this.reduced; }
    tick(ms) {
      if (!this.running) { this.last = null; return 0; }
      const dt = this.last === null ? 0 : clamp((ms - this.last) / 1000, 0, .05);
      this.last = ms;
      this.time += dt;
      return dt;
    }
  }

  class FogField {
    constructor(width, height) {
      this.width = width; this.height = height;
      this.strength = new Float32Array(width * height);
      this.stamp = new Float64Array(width * height);
    }
    value(i, time) {
      return this.strength[i] * (1 - smooth(clamp((time - this.stamp[i] - 5) / 20)));
    }
    sample(x, y, time) {
      const ix = Math.round(clamp(x) * (this.width - 1));
      const iy = Math.round(clamp(y) * (this.height - 1));
      return this.value(iy * this.width + ix, time);
    }
    // Radius is a fraction of height. Distance to the segment prevents gaps on fast swipes.
    wipe(x0, y0, x1, y1, radius, time) {
      const w = this.width, h = this.height, aspect = w / h;
      const ax = x0 * aspect, bx = x1 * aspect;
      const dx = bx - ax, dy = y1 - y0, length2 = dx * dx + dy * dy;
      const left = Math.floor(clamp(Math.min(x0, x1) - radius / aspect) * (w - 1));
      const right = Math.ceil(clamp(Math.max(x0, x1) + radius / aspect) * (w - 1));
      const top = Math.floor(clamp(Math.min(y0, y1) - radius) * (h - 1));
      const bottom = Math.ceil(clamp(Math.max(y0, y1) + radius) * (h - 1));
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const px = x / (w - 1) * aspect - ax, py = y / (h - 1) - y0;
        const t = length2 ? clamp((px * dx + py * dy) / length2) : 0;
        const d = Math.hypot(px - dx * t, py - dy * t) / radius;
        if (d >= 1) continue;
        const amount = 1 - smooth(clamp((d - .48) / .52));
        const i = y * w + x;
        this.strength[i] = Math.max(this.value(i, time), amount);
        this.stamp[i] = time;
      }
    }
    reset() { this.strength.fill(0); this.stamp.fill(0); }
    pixels(time, bytes) {
      for (let i = 0; i < this.strength.length; i++) {
        const v = Math.round(255 * this.value(i, time));
        bytes[i * 4] = v; bytes[i * 4 + 1] = v; bytes[i * 4 + 2] = v; bytes[i * 4 + 3] = 255;
      }
    }
  }

  // Video play can resolve after a page has been paused or hidden.
  class MediaPlayback {
    constructor(video, onBlocked = () => {}) { this.video=video; this.onBlocked=onBlocked; this.wanted=false; this.pending=null; this.request=0; }
    sync(running) {
      this.wanted=running;
      if(!running) { this.request++; this.pending=null; this.video.pause(); return Promise.resolve(); }
      if(this.pending) return this.pending;
      if(!this.video.paused) return Promise.resolve();
      const request=++this.request;
      try {
        this.pending=Promise.resolve(this.video.play()).then(()=>{
          if(!this.wanted)this.video.pause();
        }).catch(()=>{ if(this.wanted&&request===this.request)this.onBlocked(); }).finally(()=>{if(request===this.request)this.pending=null;});
      } catch(error) { this.onBlocked(); return Promise.resolve(); }
      return this.pending;
    }
  }

  const coverCrop = (imageAspect, stageAspect) => stageAspect > imageAspect ? [1,imageAspect/stageAspect] : [stageAspect/imageAspect,1];
  const api = { RainState, FogField, MediaPlayback, coverCrop, clamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RainCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
