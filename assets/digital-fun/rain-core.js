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

  class DropField {
    constructor(width, height, random = Math.random, count = 160) {
      this.width = width; this.height = height; this.random = random;
      this.drops = []; this.trails = []; this.spawn = 0; this.time = 0;
      this.target = count;
      for (let i = 0; i < count; i++) this.add(i < 16);
    }
    add(large = false) {
      const r = this.random;
      this.drops.push({ x:r() * this.width, y:r() * this.height,
        r:large ? 4.8 + r() * 2.6 : 1.6 + Math.pow(r(), 2) * 2.8,
        vy:0, seed:r() * 100 });
    }
    resize(width, height) {
      const sx = width / this.width, sy = height / this.height;
      for (const d of this.drops) { d.x *= sx; d.y *= sy; }
      this.trails.length = 0; this.width = width; this.height = height;
    }
    step(dt) {
      if (!dt) return;
      this.time += dt;
      this.spawn += dt * 4;
      while (this.spawn >= 1) {
        this.spawn--;
        if (this.target && this.drops.length >= this.target + 35) {
          // Incoming rain replaces the finest pinned bead when the surface is saturated.
          let smallest=0;
          for(let i=1;i<this.drops.length;i++)if(this.drops[i].r<this.drops[smallest].r)smallest=i;
          this.drops.splice(smallest,1);
        }
        if(this.target)this.add(this.random()<.16);
      }
      for (const d of this.drops) {
        const oldX = d.x, oldY = d.y;
        // Surface tension pins small beads. Heavy beads break free and leave a wet trace.
        if (d.r > 4.6) {
          const target = (d.r - 3.8) * 28 * (.65 + .35 * Math.sin(this.time * 1.4 + d.seed));
          d.vy += (target - d.vy) * Math.min(1, dt * 4);
          d.y += d.vy * dt;
          d.x += Math.sin(d.y * .027 + d.seed) * dt * 2;
          if (d.y - oldY > .1) this.trails.push({x:oldX,y:oldY,x2:d.x,y2:d.y,r:Math.min(1.6,d.r*.18),born:this.time});
          d.r = Math.max(1, d.r - dt * .035);
        }
      }
      // A small spatial grid keeps merging bounded even on long-running visits.
      const grid = new Map();
      for (let i = 0; i < this.drops.length; i++) {
        const a = this.drops[i]; if (a.dead) continue;
        const cx = Math.floor(a.x / 32), cy = Math.floor(a.y / 32);
        for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
          const bucket = grid.get(`${xx},${yy}`) || [];
          for (const b of bucket) {
            if (b.dead || Math.hypot(a.x-b.x,a.y-b.y) > (a.r+b.r)*.82) continue;
            const areaA=a.r*a.r, areaB=b.r*b.r, area=areaA+areaB;
            a.x=(a.x*areaA+b.x*areaB)/area; a.y=Math.max(a.y,b.y);
            a.r=Math.min(13,Math.sqrt(area)); a.vy=Math.max(a.vy,b.vy); b.dead=true;
          }
        }
        const key=`${cx},${cy}`;
        if (!grid.has(key)) grid.set(key,[]);
        grid.get(key).push(a);
      }
      this.drops = this.drops.filter(d => !d.dead && d.y < this.height + d.r * 2);
      this.trails = this.trails.filter(t => this.time-t.born < 8).slice(-1800);
    }
  }
  const coverCrop = (imageAspect, stageAspect) => stageAspect > imageAspect ? [1,imageAspect/stageAspect] : [stageAspect/imageAspect,1];
  const api = { RainState, FogField, DropField, coverCrop, clamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RainCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
