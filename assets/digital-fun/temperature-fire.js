
  'use strict';

  // TemperatureFire: the original interactive artwork, with a transparent canvas.
  // Page controls and lifecycle live in digital-fun.js.
  const SETTINGS = {
    fontSize: 9,
    intensity: 1,
    fillerAmount: 0.27,
    speed: 1,
    maxFPS: 30,
    heatingRate: 90,  // Extra grader per sekund vid ihållande luft.
    coolingRate: 75,
    spreadSpeed: 0.022, // Längd per sekund i brasans normaliserade koordinater.
    charSeconds: 28,    // Tid från antändning till helt förkolnad bark.
    burnSeconds: 110,   // Brinntid för en antänd del; spridningen tar extra tid.
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    palette: [
      [55,  '#54565a'],
      [90,  '#8c8e91'],
      [120, '#c4ad64'],
      [150, '#ffe36b'],
      [175, '#ff922e'],
      [200, '#ff4027'],
      [240, '#d71e20'],
      [320, '#ff8245'],
      [400, '#ffe09b'],
      [500, '#fff9ec'],
      [580, '#ffffff'],
      [680, '#bce6ff'],
      [800, '#78bdff'],
      [899, '#4e98f0']
    ]
  };

  (() => {
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, x) => {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const fract = n => n - Math.floor(n);
    const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

    // Seeded, continuous value noise: the same moving field drives every mark.
    const side = 128;
    const lattice = new Float32Array(side * side);
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) lattice[y * side + x] = hash(x, y);
    }
    function noise(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const x0 = ix & 127, x1 = (ix + 1) & 127;
      const y0 = (iy & 127) * side, y1 = ((iy + 1) & 127) * side;
      return lerp(lerp(lattice[y0 + x0], lattice[y0 + x1], u),
        lerp(lattice[y1 + x0], lattice[y1 + x1], u), v);
    }

    const tongues = [
      { root: -0.40, height: 0.53, width: 0.22, phase: 2.6 },
      { root: -0.12, height: 0.89, width: 0.25, phase: 0.3 },
      { root:  0.20, height: 0.72, width: 0.23, phase: 4.1 },
      { root:  0.43, height: 0.46, width: 0.17, phase: 6.2 }
    ];

    class TemperatureFire {
      constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        if (!this.ctx) throw new Error('Den här webbläsaren saknar Canvas 2D.');
        this.options = { ...SETTINGS, ...options };
        this.time = 17.3;
        this.createdAt = this.time;
        this.paused = false;
        this.destroyed = false;
        this.raf = 0;
        this.lastFrame = 0;
        this.cells = [];
        this.gusts = [];
        this.heatPuffs = [];
        this.ignitions = [];
        this.spreadCache = { time: NaN, sources: [] };
        this.combustionCache = { time: NaN };
        this.logs = [
          { x: -0.83, y: -0.080, endX: 0.57, endY: 0.010, radius: 0.034 },
          { x: 0.81, y: -0.097, endX: -0.56, endY: -0.006, radius: 0.038 }
        ];
        this.naturalOrigins = this.logs.map((log, logId) => ({ logId, natural: true, offsetY: 0.014 }));
        // Stored heat belongs to the fuel, independent of the flickering flame and viewport.
        this.fuelHeat = new Float32Array(49);
        this.blowing = null;
        this.nextBlow = 0;
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.tick = this.tick.bind(this);
        this.handleEnvironment = () => {
          if (document.hidden || this.motion.matches) this.stopBlowing();
          this.syncAnimation();
        };
        this.motion.addEventListener('change', this.handleEnvironment);
        document.addEventListener('visibilitychange', this.handleEnvironment);
        this.handlePointer = event => {
          if (event.button !== 0 || event.isPrimary === false) return;
          const point = this.pointerPoint(event);
          if (!point) return;
          this.blowing = { ...point, pointerId: event.pointerId };
          if (Number.isFinite(event.pointerId)) this.canvas.setPointerCapture?.(event.pointerId);
          this.igniteAt(point.x, point.y, false);
          this.gustAt(point.x, point.y);
          this.nextBlow = this.time + 0.18;
        };
        this.handlePointerMove = event => {
          if (!this.blowing || event.pointerId !== this.blowing.pointerId) return;
          const point = this.pointerPoint(event);
          if (point) Object.assign(this.blowing, point);
        };
        this.handlePointerEnd = event => {
          if (!event || event.pointerId === undefined || event.pointerId === this.blowing?.pointerId) this.stopBlowing();
        };
        this.handleKey = event => {
          if (event.key !== 'Enter' || event.repeat) return;
          event.preventDefault();
          this.gustAt(this.width / 2, this.baseY - this.rows * this.cellH * (event.shiftKey ? 0.65 : 0.04));
        };
        canvas.addEventListener('pointerdown', this.handlePointer);
        canvas.addEventListener('pointermove', this.handlePointerMove);
        canvas.addEventListener('pointerup', this.handlePointerEnd);
        canvas.addEventListener('pointercancel', this.handlePointerEnd);
        canvas.addEventListener('lostpointercapture', this.handlePointerEnd);
        window.addEventListener('blur', this.handlePointerEnd);
        canvas.addEventListener('keydown', this.handleKey);
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
        this.buildPalette();
        this.resize();
        this.syncAnimation();
      }

      buildPalette() {
        const points = this.options.palette.map(([t, hex]) => ({
          t,
          rgb: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
        })).sort((a, b) => a.t - b.t);
        this.colors = Array.from({ length: 1000 }, (_, temperature) => {
          let left = points[0], right = points[points.length - 1];
          if (temperature <= left.t) right = left;
          else if (temperature >= right.t) left = right;
          else {
            for (let i = 1; i < points.length; i++) {
              if (temperature <= points[i].t) { left = points[i - 1]; right = points[i]; break; }
            }
          }
          const mix = left.t === right.t ? 0 : (temperature - left.t) / (right.t - left.t);
          const rgb = left.rgb.map((v, i) => Math.round(lerp(v, right.rgb[i], mix)));
          return `rgb(${rgb.join(',')})`;
        });
        // Only the wood material darkens. Temperature readings and glowing cracks
        // retain the temperature palette used by the flame.
        this.charColors = Array.from({ length: 17 }, (_, shade) => this.colors.map(color => {
          const rgb = color.match(/[0-9]+/g).map(Number);
          return `rgb(${rgb.map((value, i) => Math.round(lerp(value, [49, 50, 54][i], shade / 16))).join(',')})`;
        }));
      }

      resize() {
        if (this.destroyed) return;
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        this.width = rect.width;
        this.height = rect.height;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.fontSize = this.options.fontSize * clamp(this.width / 620, 0.77, 1);
        this.cellW = this.fontSize * 2.12;
        this.cellH = this.fontSize * 1.20;
        this.artW = Math.min(this.width * 0.94, this.height * 0.90);
        this.artH = Math.min(this.height * 0.82, this.artW * 1.20);
        this.baseY = this.height / 2 + this.artH * 0.43;
        this.columns = Math.floor(this.artW / this.cellW);
        this.rows = Math.floor(this.artH / this.cellH);
        this.cells = [];
        const left = (this.width - this.columns * this.cellW) / 2;
        this.gridLeft = left;
        for (let row = -Math.ceil(this.rows * 0.12); row <= this.rows; row++) {
          for (let col = 0; col < this.columns; col++) {
            const seed = hash(col + 11, row + 19);
            this.cells.push({
              x: left + (col + 0.5) * this.cellW,
              y: this.baseY - row * this.cellH,
              nx: (col + 0.5 - this.columns / 2) / (this.columns * 0.45),
              ny: row / this.rows,
              seed,
              gridKey: `${row}:${col}`,
              temperature: null
            });
          }
        }
        this.buildLogs();
        this.draw(0);
      }

      buildLogs() {
        // Two crossed pieces of wood, sampled onto the same rows as the flame.
        // Each temperature cell contains three smaller character columns.
        const logs = this.logs;
        const marks = new Map();
        this.woodOccupied = new Set();
        for (let logId = 0; logId < logs.length; logId++) {
          const log = logs[logId];
          for (let row = -Math.ceil(this.rows * 0.15); row <= Math.ceil(this.rows * 0.06); row++) {
            const ny = row / this.rows;
            for (let col = 0; col < this.columns * 3; col++) {
              const nx = ((col + 0.5) / 3 - this.columns / 2) / (this.columns * 0.45);
              const u = (nx - log.x) / (log.endX - log.x);
              const v = (ny - lerp(log.y, log.endY, u)) / log.radius;
              const endX = (nx - log.x) / 0.083;
              const endY = (ny - log.y) / log.radius;
              const ring = Math.sqrt(endX * endX + endY * endY);
              const cap = ring <= 1;
              const body = u >= 0 && u <= 1 && Math.abs(v) <= 1;
              if (!cap && !body) continue;
              const seed = hash(col + logId * 71, row + 46);
              const edge = !cap && (Math.abs(v) > 0.70 || u > 0.98);
              let mark;
              if (cap) {
                mark = ring < 0.23 ? 'o' : Math.abs(endX) < 0.25 ? '-' : endX < 0 ? '(' : ')';
              } else if (edge) {
                mark = v > 0 ? '_' : '-';
              } else {
                const grain = Math.sin(u * 38 + v * 9 + logId * 2);
                mark = grain > 0.28 ? '=' : grain < -0.60 ? '-' : seed < 0.3 ? '/' : ':';
              }
              const key = `${row}:${col}`;
              marks.set(key, { x: this.gridLeft + (col + 0.5) * this.cellW / 3,
                y: this.baseY - row * this.cellH, nx, ny, row, col, logId, u: clamp(u, 0, 1), seed, mark, edge, cap, v });
              this.woodOccupied.add(`${row}:${Math.floor(col / 3)}`);
            }
          }
        }
        this.woodGrid = marks;
        this.woodMarks = [];
        for (const mark of [...marks.values()].sort((a, b) => a.row - b.row || a.col - b.col)) {
          if (mark.consumed) continue;
          // Occasional full temperature readings sit inside the bark grain.
          const neighbors = [mark, marks.get(`${mark.row}:${mark.col + 1}`), marks.get(`${mark.row}:${mark.col + 2}`)];
          if (mark.col % 3 === 0 && mark.seed > 0.70
            && neighbors.every(m => m && m.logId === mark.logId && !m.cap && !m.edge)) {
            neighbors[1].consumed = neighbors[2].consumed = true;
            this.woodMarks.push({ ...mark, x: mark.x + this.cellW / 3, numeric: true });
          } else {
            this.woodMarks.push(mark);
          }
        }
      }

      drawLogs() {
        const ctx = this.ctx;
        this.visibleWood = new Set();
        for (const mark of this.woodMarks) {
          const fuel = this.fuelState(mark.logId, mark.u, this.time);
          const radius = 0.22 + 0.78 * Math.pow(fuel.remaining, 0.65);
          const bodyAlpha = fuel.consumed < 0.001 ? 1 : smooth(0, 0.08, fuel.remaining)
            * (1 - smooth(radius - 0.16, radius + 0.06, Math.abs(mark.v)))
            * (1 - smooth(mark.seed + 0.07, mark.seed + 0.32, fuel.consumed * 0.62));
          const emberAlpha = smooth(0.50, 0.98, fuel.consumed)
            * (1 - smooth(0.16, 0.65, Math.abs(mark.v))) * (0.50 + mark.seed * 0.45);
          if (Math.max(bodyAlpha, emberAlpha) < 0.025) continue;
          this.visibleWood.add(`${mark.row}:${Math.floor(mark.col / 3)}`);
          if (emberAlpha > bodyAlpha) {
            const pulse = noise(mark.nx * 23 + mark.logId, this.time * 0.35);
            const temperature = Math.round(clamp(86 + fuel.ember * (58 + mark.seed * 24)
              + pulse * 16 + Math.min(80, this.extraHeatAt(mark.nx, mark.ny)), 55, 240));
            ctx.fillStyle = this.colors[temperature];
            ctx.globalAlpha = emberAlpha;
            const glyph = mark.numeric ? String(temperature).padStart(3, '0')
              : mark.seed < 0.24 ? '*' : mark.seed < 0.63 ? ':' : '.';
            ctx.fillText(glyph, mark.x, mark.y);
            continue;
          }
          const char = this.charAt(mark.logId, mark.u, this.time);
          const contact = Math.max(
            Math.exp(-Math.pow(mark.nx / 0.59, 4)) * smooth(-0.12, 0.015, mark.ny),
            this.ignitionHeatAt(mark.nx, mark.ny, this.time));
          const crack = mark.numeric || (!mark.cap && mark.seed < lerp(0.18, 0.07, char));
          const glow = contact * (crack ? 1 : 0.30);
          const grain = mark.cap ? 98 : mark.edge ? 103 : 78 + mark.seed * 18;
          const normal = 55 + Math.pow(this.heatAt(mark.nx, Math.max(mark.ny, 0.01), this.time), 0.64) * 185;
          const temperature = Math.round(clamp(grain + glow * (normal - 80 + this.extraHeatAt(mark.nx, mark.ny)), 55, 899));
          const shade = Math.round(char * (mark.edge ? 0.85 : 1) * 16);
          ctx.fillStyle = crack ? this.colors[temperature] : this.charColors[shade][temperature];
          ctx.globalAlpha = (mark.cap || mark.edge ? 0.90 : 0.66 + glow * 0.30) * bodyAlpha;
          const glyph = !mark.edge && !mark.cap && char > 0.35 + mark.seed * 0.30
            ? ['#', ':', '%'][Math.floor(mark.seed * 3)] : mark.mark;
          ctx.fillText(mark.numeric ? String(temperature).padStart(3, '0') : glyph, mark.x, mark.y);
        }
      }

      pointerPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return { x: (event.clientX - rect.left) * this.width / rect.width,
          y: (event.clientY - rect.top) * this.height / rect.height };
      }

      stopBlowing() {
        const pointerId = this.blowing?.pointerId;
        this.blowing = null;
        if (Number.isFinite(pointerId) && this.canvas.hasPointerCapture?.(pointerId)) this.canvas.releasePointerCapture(pointerId);
      }

      igniteAt(px, py, redraw = true) {
        if (this.destroyed || !this.woodGrid || !Number.isFinite(px) || !Number.isFinite(py)) return false;
        const row = Math.round((this.baseY - py) / this.cellH);
        const col = Math.floor((px - this.gridLeft) / (this.cellW / 3));
        const wood = this.woodGrid.get(`${row}:${col}`);
        if (!wood || this.ignitions.length >= 8 || this.fuelState(wood.logId, wood.u, this.time).remaining < 0.04) return false;
        // Only new wood surfaces ignite. Existing flames keep their current character.
        if (this.heatAt(wood.nx, wood.ny + 0.045, this.time) > 0.22
          || this.ignitions.some(source => Math.hypot((wood.nx - source.x) / 0.13, (wood.ny - source.y) / 0.09) < 1)) return false;
        const log = this.logs[wood.logId];
        this.ignitions.push({ x: wood.nx, y: wood.ny, logId: wood.logId, u: wood.u,
          offsetY: wood.ny - lerp(log.y, log.endY, wood.u),
          spreadSpeed: clamp(this.options.spreadSpeed, 0.001, 0.15), phase: wood.seed * Math.PI * 2,
          start: this.time - (this.shouldAnimate() ? 0 : 2.4) });
        this.spreadCache.time = NaN;
        this.combustionCache.time = NaN;
        if (redraw) this.draw(0);
        return true;
      }

      burnArrival(logId, u) {
        if (this.destroyed) return { arrival: Infinity, origin: null };
        const log = this.logs[logId];
        // The already-lit middle also feeds an outward front. Its original flame
        // keeps its familiar shape, but it draws from the same finite wood supply.
        const x = lerp(log.x, log.endX, u);
        let arrival = this.createdAt + Math.max(0, Math.abs(x) - 0.46)
          / (clamp(this.options.spreadSpeed, 0.001, 0.15) * 0.5);
        let origin = this.naturalOrigins[logId];
        for (const source of this.ignitions) {
          if (source.logId !== logId) continue;
          const travel = Math.abs(u - source.u) * Math.hypot(log.endX - log.x, log.endY - log.y) / source.spreadSpeed;
          if (source.start + travel < arrival) { arrival = source.start + travel; origin = source; }
        }
        return { arrival, origin };
      }

      fuelState(logId, u, t) {
        const age = t - this.burnArrival(logId, u).arrival;
        const duration = Math.max(15, this.options.burnSeconds);
        const consumed = smooth(Math.min(6, duration * 0.1), duration, age);
        return { age, consumed, remaining: 1 - consumed,
          flame: age < 0 ? 0 : 1 - smooth(0.12, 0.96, consumed),
          ember: age < 0 ? 0 : 1 - 0.65 * smooth(duration, duration + 120, age) };
      }

      fuelAtX(x, t) {
        let remaining = 0, flame = 0;
        for (let logId = 0; logId < this.logs.length; logId++) {
          const log = this.logs[logId];
          const u = (x - log.x) / (log.endX - log.x);
          if (u < 0 || u > 1) continue;
          const state = this.fuelState(logId, u, t);
          remaining = Math.max(remaining, state.remaining);
          flame = Math.max(flame, state.flame);
        }
        return { remaining, flame };
      }

      combustionAt(t) {
        if (this.combustionCache.time === t) return this.combustionCache;
        const strengths = tongues.map(tongue => this.fuelAtX(tongue.root, t).flame);
        this.combustionCache = { time: t, strengths,
          strength: strengths.reduce((sum, strength) => sum + strength, 0) / strengths.length };
        return this.combustionCache;
      }

      burningSourcesAt(t) {
        if (this.spreadCache.time === t) return this.spreadCache.sources;
        const sources = this.ignitions.map(source => ({ ...source, ...this.fuelState(source.logId, source.u, t) }));
        // Fixed stations keep spread bounded even after a long burn or many clicks.
        for (let logId = 0; logId < this.logs.length; logId++) {
          const log = this.logs[logId];
          for (let i = 0; i < 12; i++) {
            const u = i / 11;
            const { arrival, origin } = this.burnArrival(logId, u);
            if (!origin || t < arrival) continue;
            const x = lerp(log.x, log.endX, u);
            if (origin.natural && Math.abs(x) < 0.52) continue;
            if (this.ignitions.some(source => source.logId === logId && Math.abs(source.x - x) < 0.095)) continue;
            sources.push({ x, y: lerp(log.y, log.endY, u) + origin.offsetY, u, logId,
              offsetY: origin.offsetY, start: arrival, spread: true,
              scale: 0.65 + hash(i, logId + 58) * 0.20, phase: hash(i + 85, logId) * Math.PI * 2,
              ...this.fuelState(logId, u, t) });
          }
        }
        this.spreadCache = { time: t, sources };
        return sources;
      }

      charAt(logId, u, t) {
        const { arrival } = this.burnArrival(logId, u);
        const exposure = Math.max(0, t - arrival);
        return smooth(3, Math.max(4, this.options.charSeconds), exposure);
      }

      ignitionHeatAt(x, y, t) {
        let heat = 0;
        for (const source of this.burningSourcesAt(t)) {
          const age = t - source.start;
          if (age < 0 || source.flame <= 0 || Math.abs(x - source.x) > 0.30 || y < source.y - 0.12 || y > source.y + 0.50) continue;
          const growth = smooth(0, 2.4, age);
          const scale = (source.scale || 1) * Math.pow(source.flame, 0.65);
          const height = (0.07 + growth * 0.38) * scale
            * (0.90 + 0.10 * Math.sin(t * 1.4 + source.phase));
          const u = (y - source.y) / height;
          const bed = Math.exp(-Math.pow((x - source.x) / 0.12, 2) * 2
            - Math.pow((y - source.y) / 0.055, 2) * 2) * 0.85;
          let flame = 0;
          if (u >= 0 && u < 1) {
            const flow = noise(x * 9 + source.phase, y * 12 - t * 1.25);
            const center = source.x + Math.sin(u * 7 - t * 1.4 + source.phase) * u * 0.045;
            const width = (0.055 + growth * 0.075) * scale * Math.pow(1 - u, 0.65) * (0.8 + flow * 0.35);
            const distance = (x - center) / (width + 0.004);
            flame = Math.exp(-distance * distance * 1.6) * Math.pow(1 - u, 0.55) * (0.60 + flow * 0.40);
          }
          heat = Math.max(heat, Math.max(flame, bed) * (0.12 + 0.88 * growth) * source.flame);
        }
        return heat;
      }

      gustAt(px, py, redraw = true) {
        if (this.destroyed || !this.columns || !this.rows || !Number.isFinite(px) || !Number.isFinite(py)) return;
        const x = (px - this.width / 2) / (this.columns * this.cellW * 0.45);
        const y = (this.baseY - py) / (this.rows * this.cellH);
        // Only air near the existing fuel bed feeds heat. Empty space and upper flames cannot.
        let fuel = Math.exp(-Math.pow(x / 0.72, 4))
          * smooth(-0.18, -0.03, y) * (1 - smooth(0.12, 0.30, y)) * this.fuelAtX(x, this.time).remaining;
        for (const source of this.burningSourcesAt(this.time)) {
          const dy = y - source.y;
          fuel = Math.max(fuel, Math.exp(-Math.pow((x - source.x) / 0.16, 2) * 2)
            * smooth(-0.10, -0.02, dy) * (1 - smooth(0.09, 0.23, dy)) * source.remaining);
        }
        this.gusts = this.gusts.filter(gust => this.time - gust.start < 1.5).slice(-5);
        this.gusts.push({
          x, y, fuel, direction: x <= 0 ? 1 : -1, start: this.time
        });
        if (fuel > 0.015) {
          this.heatPuffs = this.heatPuffs.filter(puff => this.time - puff.start < 0.55).slice(-7);
          this.heatPuffs.push({ x, strength: fuel, start: this.time });
        }
        // A direct response remains available when motion is reduced or manually paused.
        if (redraw) this.draw(0);
      }

      windAt(x, y, t) {
        if (!this.gusts.length) return null;
        let pushX = 0, pushY = 0;
        for (const gust of this.gusts) {
          const age = t - gust.start;
          if (age < 0 || age >= 1.5) continue;
          const dx = x - gust.x;
          const dy = y - gust.y - age * 0.10;
          const radiusX = 0.30 + age * 0.06;
          const radiusY = 0.22 + age * 0.04;
          const distance = (dx / radiusX) ** 2 + (dy / radiusY) ** 2;
          if (distance > 4) continue;
          const pulse = (0.5 + 0.5 * smooth(0, 0.12, age)) * (1 - smooth(0.18, 1.5, age));
          const influence = Math.exp(-distance * 1.7) * pulse * smooth(-0.03, 0.14, y);
          pushX += gust.direction * 0.22 * influence * (1 - 0.80 * gust.fuel);
          pushY += (0.55 + 0.45 * Math.tanh(dy / 0.12)) * 0.045 * influence;
        }
        return pushX || pushY ? { x: clamp(pushX, -0.24, 0.24), y: Math.min(pushY, 0.08) } : null;
      }

      updateFuelHeat(dt) {
        if (dt <= 0) return; // Clicking or repainting cannot instantly raise the temperature.
        for (let i = 0; i < this.fuelHeat.length; i++) {
          const x = -1.2 + i * 2.4 / (this.fuelHeat.length - 1);
          let air = 0;
          for (const puff of this.heatPuffs) {
            const age = this.time - puff.start;
            if (age < 0 || age >= 0.55) continue;
            const distance = Math.abs((x - puff.x) / 0.30);
            if (distance > 2) continue;
            air += puff.strength * Math.exp(-distance * distance * 1.5)
              * (1 - smooth(0.16, 0.55, age));
          }
          air = clamp(air, 0, 1);
          const rate = Math.max(0, this.options.heatingRate) * air
            - Math.max(0, this.options.coolingRate) * (1 - air);
          this.fuelHeat[i] = clamp(this.fuelHeat[i] + rate * dt, 0, 620);
        }
      }

      extraHeatAt(x, y) {
        const position = (x + 1.2) / 2.4 * (this.fuelHeat.length - 1);
        if (position < 0 || position > this.fuelHeat.length - 1) return 0;
        const index = Math.floor(position);
        const heat = lerp(this.fuelHeat[index], this.fuelHeat[Math.min(index + 1, this.fuelHeat.length - 1)], position - index);
        return heat * Math.exp(-Math.pow((y - 0.025) / 0.20, 2) * 1.5);
      }

      temperatureAt(x, y, t) {
        const heat = this.heatAt(x, y, t);
        const normal = 55 + Math.pow(heat, 0.64) * 185;
        const extra = this.extraHeatAt(x, y, t) * smooth(0.02, 0.18, heat);
        return clamp(normal + extra, 55, 899);
      }

      heatAt(x, y, t) {
        const wind = this.windAt(x, y, t);
        if (wind) { x -= wind.x; y -= wind.y; }
        const intensity = clamp(this.options.intensity, 0.2, 2);
        y /= 0.91 + intensity * 0.09;
        const bend = (noise(x * 2.3 + 9, y * 4.4 - t * 0.65) - 0.5)
          * (0.12 + 0.20 * y);
        const flow = noise(x * 5.1 + 40, y * 8.2 - t * 1.05);
        const detail = noise(x * 14.3 + 7, y * 19.1 - t * 1.9);
        const combustion = this.combustionAt(t);
        let flame = 0;
        for (let index = 0; index < tongues.length; index++) {
          const tongue = tongues[index], strength = combustion.strengths[index];
          if (strength <= 0) continue;
          const h = tongue.height * (0.87 + 0.15 * Math.sin(t * 0.8 + tongue.phase)
            + 0.10 * Math.sin(t * 1.7 + tongue.phase * 2)) * Math.pow(strength, 0.65);
          const u = y / h;
          if (u >= 1 || u < 0) continue;
          const center = tongue.root * (1 - 0.32 * u)
            + Math.sin(y * 8.7 - t * 1.4 + tongue.phase) * (0.025 + u * 0.10)
            + Math.sin(y * 18 - t * 2.1 + tongue.phase) * u * 0.025;
          const width = tongue.width * Math.pow(1 - u, 0.62)
            * (0.78 + flow * 0.48);
          const distance = (x + bend - center) / (width + 0.008);
          const plume = Math.exp(-distance * distance * 1.7) * Math.pow(1 - u, 0.52) * strength;
          flame = Math.max(flame, plume) + Math.min(flame, plume) * 0.13;
        }
        const bedShape = Math.exp(-Math.pow(x / 0.66, 4))
          * Math.exp(-Math.pow((y - 0.026) / 0.057, 2));
        const bed = bedShape * (0.48 + noise(x * 17 + 20, t * 0.5) * 0.55) * combustion.strength;
        const heat = flame * (0.64 + 0.55 * flow) - 0.105
          + (detail - 0.38) * 0.17 * smooth(0.02, 0.2, flame);
        return clamp(Math.max(heat, bed, this.ignitionHeatAt(x, y, t)) * (0.75 + 0.25 * intensity), 0, 1);
      }

      draw(dt) {
        if (this.destroyed || !this.width) return;
        this.gusts = this.gusts.filter(gust => this.time - gust.start < 1.5);
        this.heatPuffs = this.heatPuffs.filter(puff => this.time - puff.start < 0.55);
        this.updateFuelHeat(dt);
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.font = `500 ${this.fontSize}px ${this.options.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.drawLogs();
        const response = dt === 0 ? 1 : 1 - Math.exp(-dt * 11);
        for (const cell of this.cells) {
          if (this.visibleWood.has(cell.gridKey)) continue;
          const target = this.temperatureAt(cell.nx, cell.ny, this.time);
          cell.temperature = cell.temperature === null ? target
            : lerp(cell.temperature, target, response);
          const temperature = Math.round(cell.temperature);
          if (temperature < 72) continue;
          // Color is chosen from the actual displayed integer, never a separate random value.
          ctx.fillStyle = this.colors[temperature];
          ctx.globalAlpha = smooth(69, 112, cell.temperature) * (0.86 + cell.seed * 0.14);
          const edge = 1 - smooth(87, 132, temperature);
          const filler = cell.seed < clamp(this.options.fillerAmount, 0, 1) * (0.22 + 2.3 * edge);
          if (filler) {
            let mark;
            if (temperature < 89) mark = cell.seed > 0.22 ? ':' : '.';
            else if (temperature < 108) mark = cell.seed > 0.25 ? "'" : ':';
            else mark = Math.sin(this.time * 1.5 + cell.ny * 8) > 0 ? '/' : '\\';
            ctx.fillText(mark, cell.x, cell.y);
            if (temperature > 95 && cell.seed < 0.10) {
              ctx.globalAlpha *= 0.65;
              ctx.fillText('.', cell.x + this.cellW * 0.34, cell.y + this.cellH * 0.17);
            }
          } else {
            ctx.fillText(String(temperature).padStart(3, '0'), cell.x, cell.y);
          }
        }
        this.drawSparks();
        ctx.globalAlpha = 1;
      }

      drawSparks() {
        const ctx = this.ctx;
        // Sparks advance in discrete beats and use the flame's exact text grid.
        const sparkTime = Math.floor(this.time * 8) / 8;
        const left = (this.width - this.columns * this.cellW) / 2;
        const occupied = new Set();
        for (let i = 0; i < 30 + this.ignitions.length * 3; i++) {
          const seed = hash(i + 61, 17);
          const life = 3.2 + seed * 4.0;
          const source = i < 30 ? null : this.ignitions[Math.floor((i - 30) / 3)];
          const strength = source ? this.fuelState(source.logId, source.u, sparkTime).flame
            : this.combustionAt(sparkTime).strength;
          if (strength < 0.025) continue;
          const sinceLaunch = source ? sparkTime - source.start - 0.8 - ((i - 30) % 3) * 0.7 : 0;
          if (source && sinceLaunch < 0) continue;
          const age = source ? fract(sinceLaunch / life) : fract(sparkTime / life + seed * 11);
          const progress = age * age * 0.20 + age * 0.80;
          const x = (source ? source.x + (seed - 0.5) * 0.08 : (seed - 0.5) * 0.92)
            + Math.sin(progress * 7 + sparkTime * 0.65 + i) * progress * 0.13;
          const y = source ? source.y + 0.05 + progress * 0.55 * Math.sqrt(strength)
            : 0.07 + progress * (0.72 + hash(i, 9) * 0.26) * Math.sqrt(strength);
          const wind = this.windAt(x, y, sparkTime);
          const col = Math.round(this.columns / 2 - 0.5 + (x + (wind ? wind.x : 0)) * this.columns * 0.45);
          const row = Math.round((y + (wind ? wind.y : 0)) * this.rows);
          const cellKey = `${col}:${row}`;
          if (col < 0 || col >= this.columns || occupied.has(cellKey)) continue;
          const nx = (col + 0.5 - this.columns / 2) / (this.columns * 0.45);
          const ny = row / this.rows;
          const temperature = Math.round(clamp(lerp(181 + seed * 35, 64, age)
            + this.extraHeatAt(nx, ny, sparkTime) * 0.45, 55, 899));
          const alpha = strength * smooth(0, 0.08, age) * (1 - smooth(0.62, 1, age))
            * (1 - smooth(0.01, 0.12, this.heatAt(nx, ny, sparkTime)));
          if (alpha < 0.025) continue;
          occupied.add(cellKey);
          ctx.globalAlpha = alpha * 0.78;
          ctx.fillStyle = this.colors[temperature];
          const mark = seed > 0.83 ? String(temperature).padStart(3, '0')
            : age < 0.38 ? '*' : age < 0.69 ? "'" : '.';
          ctx.fillText(mark, left + (col + 0.5) * this.cellW,
            this.baseY - row * this.cellH);
        }
      }

      tick(now) {
        this.raf = 0;
        if (!this.shouldAnimate()) return;
        if (!this.lastFrame) this.lastFrame = now;
        const elapsed = now - this.lastFrame;
        if (elapsed >= 1000 / clamp(this.options.maxFPS, 1, 60) - 0.5) {
          const dt = elapsed / 1000;
          this.lastFrame = now;
          this.time += elapsed / 1000 * clamp(this.options.speed, 0, 4);
          if (this.blowing && this.time >= this.nextBlow) {
            this.gustAt(this.blowing.x, this.blowing.y, false);
            this.nextBlow = this.time + 0.18;
          }
          this.draw(dt);
        }
        this.raf = requestAnimationFrame(this.tick);
      }

      shouldAnimate() {
        return !this.destroyed && !this.paused && !this.motion.matches && !document.hidden;
      }

      syncAnimation() {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.lastFrame = 0;
        if (this.shouldAnimate()) this.raf = requestAnimationFrame(this.tick);
      }

      pause() { this.stopBlowing(); this.paused = true; this.syncAnimation(); }
      resume() { if (!this.destroyed) { this.paused = false; this.syncAnimation(); } }

      setOptions(options) {
        if (this.destroyed) return;
        this.options = { ...this.options, ...options };
        this.spreadCache.time = NaN;
        this.combustionCache.time = NaN;
        this.buildPalette();
        this.resize();
        this.syncAnimation();
      }

      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.stopBlowing();
        cancelAnimationFrame(this.raf);
        this.resizeObserver.disconnect();
        this.motion.removeEventListener('change', this.handleEnvironment);
        document.removeEventListener('visibilitychange', this.handleEnvironment);
        this.canvas.removeEventListener('pointerdown', this.handlePointer);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
        this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
        this.canvas.removeEventListener('lostpointercapture', this.handlePointerEnd);
        window.removeEventListener('blur', this.handlePointerEnd);
        this.canvas.removeEventListener('keydown', this.handleKey);
        this.gusts = [];
        this.heatPuffs = [];
        this.ignitions = [];
        this.spreadCache = { time: NaN, sources: [] };
        this.combustionCache = { time: NaN };
        this.fuelHeat.fill(0);
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }

    window.TemperatureFire = TemperatureFire;
  })();
