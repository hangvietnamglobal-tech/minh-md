/* Eleven living paintings — one per life area, one art style each.
   Every scene paints a flat underpainting (base) for time t, then hands it to one renderer
   from core.js (strokes / dabs / pointillism / mosaic / watercolour / cut paper / facets…).
   Compositions keep the left side calm (the title sits there) and put the motif on the right.
   Original compositions; techniques after huashu-art-motion (MIT). */
import { TAU, clamp, lerp, ss, rng, hash, noise, fbm, hex, rgb, mix, swatch, strokes, dabs, pointillism, mosaic, watercolor, ellipsePts, cut, fillShape, grain } from './core.js';

const grad = (g, x0, y0, x1, y1, stops) => { const q = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
const disc = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const wide = (W, H) => W / H > 1.2;            // desktop header vs. tall mobile header
const focus = (W, H) => wide(W, H) ? [W * 0.74, H * 0.5] : [W * 0.62, H * 0.7];

/* ---------- Health · Post-impressionist sunrise (flow strokes) ---------- */
const health = {
  fps: 6,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx, fy] = focus(W, H), m = Math.min(W, H), sx = fx, sy = fy - m * 0.18, sr = m * 0.13;
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#b58ff2'], [0.55, '#d9bdfb'], [1, '#f6d2b4']]); g.fillRect(0, 0, W, H);
    const halo = g.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 3.2); halo.addColorStop(0, '#fff2b0'); halo.addColorStop(0.35, '#f8d867'); halo.addColorStop(1, 'rgba(201,165,248,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(sx, sy, sr * 3.2, 0, TAU); g.fill(); disc(g, sx, sy, sr, '#e2592d'); disc(g, sx - sr * .2, sy - sr * .2, sr * .55, '#fc8a3a');
    const hills = [[0.70, '#8fae5a', 0.9], [0.78, '#5f8f4a', 1.4], [0.87, '#e2b04a', 2.1], [0.95, '#3f6a3a', 2.8]];
    hills.forEach(([y0, col, f], k) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, H * y0 - Math.sin(x / W * TAU * f + k + t * 0.25) * H * 0.04 - fbm(x * 0.004, k) * H * 0.08); g.lineTo(W, H); g.fill(); });
    // cypress flame
    const cx = wide(W, H) ? W * 0.92 : W * 0.86, sway = Math.sin(t * 1.6) * m * 0.015;
    g.fillStyle = '#1f3a2c'; g.beginPath(); g.moveTo(cx - m * .05, H); g.bezierCurveTo(cx - m * .08, H * .7, cx - m * .02 + sway, H * .45, cx + sway * 2, H * .3); g.bezierCurveTo(cx + m * .03 + sway, H * .45, cx + m * .08, H * .7, cx + m * .05, H); g.fill();
    c.drawImage(b, 0, 0);
    strokes(c, b, W, H, { cell: 8, len: 17, width: 4.6, t, boil: 6, seed: 11, outline: 0.28, outlineCol: [60, 30, 90], jitterCol: 22,
      angle: (x, y, tt) => {
        const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy);
        if (d < sr * 3.4) return Math.atan2(dy, dx) + Math.PI / 2 + (d < sr * 1.05 ? Math.PI / 2 : 0.25 * Math.sin(tt * 2 + d * 0.05));
        if (y > H * 0.66) return Math.cos(x / W * TAU * 1.4 + y * 0.01) * 0.35;
        return noise(x * 0.006 + tt * 0.15, y * 0.006) * 2.2;
      } });
  },
};

/* ---------- Mind · Pointillist river (Seurat-style optical mixing) ---------- */
const MIND_PAL = ['#1a2a58', '#2f5fa8', '#5d9dc5', '#a6d0ea', '#f8f4e8', '#f8d867', '#f08a2a', '#2f8a5a', '#a8c83a', '#e8b4d0', '#cfe6f2', '#f6e49a'];
const mind = {
  fps: 5,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx] = focus(W, H), m = Math.min(W, H), hz = H * 0.52;
    g.fillStyle = grad(g, 0, 0, 0, hz, [[0, '#7fb6dc'], [1, '#d8ecf4']]); g.fillRect(0, 0, W, hz);
    const sun = [fx + m * 0.1, H * 0.22]; disc(g, ...sun, m * 0.08, '#f6e49a');
    g.fillStyle = '#2f8a5a'; g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 10) g.lineTo(x, hz - H * 0.05 - Math.abs(Math.sin(x * 0.013)) * H * 0.06); g.lineTo(W, hz + 2); g.fill();
    g.fillStyle = grad(g, 0, hz, 0, H, [[0, '#5d9dc5'], [1, '#2f5fa8']]); g.fillRect(0, hz, W, H - hz);
    g.fillStyle = 'rgba(248,216,103,.85)'; for (let k = 0; k < 9; k++) { const y = hz + (k + 1) * (H - hz) / 11, w = m * (0.03 + k * 0.012) * (1 + 0.3 * Math.sin(t * 3 + k)); g.fillRect(sun[0] - w / 2, y, w, 4 + k * 0.6); }
    // sailboats drift
    [[0, 1], [1, 0.7]].forEach(([k, s]) => { const span = W * 0.5, x = W * 0.45 + ((t * 26 * (k ? -0.7 : 1) + k * 200) % span + span) % span, y = hz + H * (0.12 + k * 0.08);
      g.fillStyle = '#f8f4e8'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - m * .2 * s); g.lineTo(x + m * .11 * s, y); g.fill();
      g.fillStyle = '#f08a2a'; g.beginPath(); g.moveTo(x - 4, y - m * .04 * s); g.lineTo(x - 4, y - m * .16 * s); g.lineTo(x - m * .07 * s, y - m * .04 * s); g.fill();
      g.fillStyle = '#1a2a58'; g.fillRect(x - m * .06 * s, y, m * .18 * s, m * .025 * s); });
    // a reader on the bank: a book open, pages turning
    const bx = fx - m * 0.05, by = H * 0.92, pg = (t * 0.6) % 1;
    g.fillStyle = '#f8f4e8'; g.beginPath(); g.ellipse(bx - m * .06, by, m * .06, m * .02, -0.15, 0, TAU); g.ellipse(bx + m * .06, by, m * .06, m * .02, 0.15, 0, TAU); g.fill();
    g.fillStyle = '#e8b4d0'; g.beginPath(); g.ellipse(bx + m * .06 * Math.cos(pg * Math.PI), by - m * .03 * Math.sin(pg * Math.PI), m * .06 * Math.abs(Math.cos(pg * Math.PI)) + 2, m * .02, 0, 0, TAU); g.fill();
    const blur = b; c.save(); c.filter = 'blur(3px) brightness(1.05)'; c.drawImage(blur, 0, 0); c.restore();
    pointillism(c, b, W, H, { pal: MIND_PAL, comp: { 2: 6, 3: 6, 5: 1, 6: 2, 7: 9, 8: 9 }, pitch: 6.5, rad: 2.9, t, fps: 5, shimmer: (x, y) => y > hz, white: 4, dark: 0 });
  },
};

/* ---------- Emotions · Watercolour blooms that breathe ---------- */
const emotions = {
  fps: 6,
  draw(c, b, t, W, H) {
    const [fx, fy] = focus(W, H), m = Math.min(W, H), st = Math.floor(t * 6);
    c.fillStyle = '#ffd3e2'; c.fillRect(0, 0, W, H);
    const blooms = [[0, -0.1, 0.34, '#ff8fb5'], [0.2, 0.12, 0.26, '#f8d867'], [-0.22, 0.18, 0.22, '#c9a5f8'], [0.05, 0.3, 0.18, '#fc6a3a'], [0.34, -0.2, 0.16, '#7fb6dc']];
    blooms.forEach(([dx, dy, r, col], k) => {
      const br = 1 + 0.12 * Math.sin(t * 0.9 + k * 1.7), x = fx + dx * m + Math.sin(t * 0.3 + k) * m * 0.02, y = fy + dy * m;
      watercolor(c, ellipsePts(x, y, r * m * br, r * m * 0.82 * br, 20), col, { layers: 5, alpha: 0.12, amp: m * 0.06, seed: k * 31 + st, edge: 0.12 });
    });
    // hearts rise and dissolve
    for (let k = 0; k < 6; k++) { const q = (t * 0.08 + k / 6) % 1, x = fx + (hash(k, 3) - 0.5) * m * 0.9 + Math.sin(t + k) * 10, y = H * (1.05 - q * 1.1), s = m * (0.035 + hash(k, 7) * 0.03);
      const pts = []; for (let a = 0; a < TAU; a += TAU / 22) pts.push([x + s * 16 * Math.sin(a) ** 3 / 16, y - s * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]);
      c.globalAlpha = Math.sin(q * Math.PI); watercolor(c, pts, k % 2 ? '#e2592d' : '#ff4f8a', { layers: 3, alpha: 0.35, amp: s * 0.25, seed: k + st, edge: 0.3 }); c.globalAlpha = 1; }
    // pigment granulation
    const r = rng(st + 5); for (let i = 0; i < W * H / 260; i++) { c.fillStyle = `rgba(160,40,90,${r() * 0.12})`; c.fillRect(r() * W, r() * H, 1.4, 1.4); }
  },
};

/* ---------- Character · Byzantine mosaic diamond with a travelling glint ---------- */
const character = {
  fps: 10,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx, fy] = focus(W, H), m = Math.min(W, H), s = m * 0.36, rot = Math.sin(t * 0.5) * 0.08;
    g.fillStyle = grad(g, 0, 0, W, H, [[0, '#c92a20'], [1, '#e83729']]); g.fillRect(0, 0, W, H);
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + t * 0.12; g.fillStyle = k % 2 ? 'rgba(252,140,60,.35)' : 'rgba(255,214,120,.22)';
      g.beginPath(); g.moveTo(fx, fy); g.arc(fx, fy, Math.max(W, H), a, a + TAU / 28); g.fill(); }
    g.save(); g.translate(fx, fy); g.rotate(rot);
    const top = -s * 0.55, girdle = -s * 0.2, tip = s * 0.75, half = s * 0.62, crown = s * 0.36;
    const facets = [
      [[-crown, top], [crown, top], [0, girdle], '#bfe6f6'], [[-crown, top], [-half, girdle], [0, girdle], '#8fd0ee'], [[crown, top], [half, girdle], [0, girdle], '#e8f6fc'],
      [[-half, girdle], [0, girdle], [0, tip], '#5fb2e0'], [[0, girdle], [half, girdle], [0, tip], '#a6dcf2'], [[-half, girdle], [-half * .5, girdle], [0, tip], '#3f8fc8'], [[half * .5, girdle], [half, girdle], [0, tip], '#cdeef9']];
    facets.forEach(([a, bb, cc, col]) => { g.fillStyle = col; g.beginPath(); g.moveTo(...a); g.lineTo(...bb); g.lineTo(...cc); g.closePath(); g.fill(); });
    g.restore();
    const sweep = ((t * 0.35) % 1.6) - 0.3;
    mosaic(c, b, W, H, { tile: Math.max(9, Math.round(m / 46)), grout: '#5a1410', seed: 7, t,
      glint: (x, y, tt, h) => { const u = (x - fx) / s + (y - fy) / s * 0.4 - (sweep * 2.6 - 1.3); return Math.max(0, 0.85 - Math.abs(u) * 3) * (Math.hypot(x - fx, y - fy) < s * 0.8 ? 1 : 0.25) + (h > 0.985 ? 0.6 * (0.5 + 0.5 * Math.sin(tt * 6 + h * 50)) : 0); } });
  },
};

/* ---------- Spirit · Water-lily pond in impressionist dabs ---------- */
const spirit = {
  fps: 8,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx, fy] = focus(W, H), m = Math.min(W, H);
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#0a2a9a'], [0.5, '#004edf'], [1, '#0b1f6a']]); g.fillRect(0, 0, W, H);
    for (let k = 0; k < 7; k++) { const y = H * (0.1 + k * 0.13) + Math.sin(t * 0.6 + k) * 8; g.fillStyle = k % 2 ? 'rgba(231,191,255,.28)' : 'rgba(120,200,240,.22)'; g.fillRect(0, y, W, H * 0.03); }
    const ring = (t * 0.25) % 1; g.strokeStyle = `rgba(231,240,255,${0.6 * (1 - ring)})`; g.lineWidth = 6; g.beginPath(); g.ellipse(fx, fy + m * .1, m * .5 * ring, m * .16 * ring, 0, 0, TAU); g.stroke();
    const pads = [[-0.3, 0.05, 0.11], [0.12, 0.22, 0.14], [0.3, -0.1, 0.09], [-0.1, -0.25, 0.08], [0.0, 0.0, 0.12], [-0.42, 0.3, 0.1]];
    pads.forEach(([dx, dy, r], k) => { const x = fx + dx * m + Math.sin(t * 0.2 + k) * m * 0.02, y = fy + dy * m;
      g.fillStyle = k % 2 ? '#2f8a5a' : '#4fa86a'; g.beginPath(); g.ellipse(x, y, r * m, r * m * 0.42, 0, 0.25, TAU - 0.05); g.lineTo(x, y); g.fill();
      if (k % 2 === 0) { const open = 0.6 + 0.4 * Math.sin(t * 0.7 + k), pr = r * m * 0.55 * open;
        for (let p = 0; p < 8; p++) { const a = p / 8 * TAU + t * 0.05; g.fillStyle = p % 2 ? '#e7bfff' : '#ff9cc4'; g.beginPath(); g.ellipse(x + Math.cos(a) * pr * .4, y - pr * .3 + Math.sin(a) * pr * .15, pr * .5, pr * .2, a, 0, TAU); g.fill(); }
        disc(g, x, y - pr * 0.3, pr * 0.18, '#f8d867'); } });
    c.drawImage(b, 0, 0);
    dabs(c, b, W, H, { cell: 8, size: 8, t, boil: 8, seed: 21, angle: 0.05, shift: 26 });
  },
};

/* ---------- Connection · Cut-paper shapes that dance (Matisse-style gouache cut-outs) ---------- */
const leaf = (x, y, s, a) => { const o = []; for (let i = 0; i <= 12; i++) { const u = i / 12; o.push([0, -u * s, Math.sin(u * Math.PI) * s * 0.28 * (1 + 0.5 * Math.sin(u * 9))]); }
  const pts = [...o.map(([_, v, w]) => [w, v]), ...o.reverse().map(([_, v, w]) => [-w, v])]; return pts.map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]); };
const connection = {
  fps: 10,
  draw(c, b, t, W, H) {
    const [fx, fy] = focus(W, H), m = Math.min(W, H), st = Math.floor(t * 10), T = st / 10;
    c.fillStyle = '#69b488'; c.fillRect(0, 0, W, H);
    fillShape(c, cut(ellipsePts(fx, fy, m * .42, m * .42, 40), 3 + st % 3, 16, 2.5), '#f4efe8');
    const leaves = [[-0.32, 0.45, 0.42, -0.3, '#e2592d'], [-0.12, 0.48, 0.5, 0.05, '#004edf'], [0.1, 0.46, 0.44, 0.35, '#e2592d'], [0.3, 0.48, 0.36, 0.6, '#f8d867'], [0.42, 0.5, 0.3, -0.5, '#004edf']];
    leaves.forEach(([dx, dy, s, a, col], k) => fillShape(c, cut(leaf(fx + dx * m, fy + dy * m, s * m, a + Math.sin(T * 1.4 + k) * 0.18), st * 7 + k, 12, 2), col));
    // the house of the family, a heart above it
    const hx = fx, hy = fy + m * .12, hs = m * .16;
    fillShape(c, cut([[hx - hs, hy], [hx - hs, hy - hs], [hx, hy - hs * 1.8], [hx + hs, hy - hs], [hx + hs, hy]], st + 40, 12, 1.8), '#1f3a2c');
    fillShape(c, cut([[hx - hs * .3, hy], [hx - hs * .3, hy - hs * .7], [hx + hs * .3, hy - hs * .7], [hx + hs * .3, hy]], st + 41, 10, 1.4), '#f8d867');
    const hb = 1 + 0.08 * Math.sin(T * 5), hr = hs * .45 * hb, hcy = hy - hs * 2.5;
    const hp = []; for (let a = 0; a < TAU; a += TAU / 30) hp.push([hx + hr * Math.sin(a) ** 3, hcy - hr * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]);
    fillShape(c, cut(hp, st + 50, 8, 1.5), '#e83729');
    // little stars, cut by hand
    for (let k = 0; k < 7; k++) { const x = fx + (hash(k, 1) - .5) * m * 1.1, y = fy + (hash(k, 2) - .7) * m * .9, s = m * (.02 + hash(k, 3) * .02) * (1 + .25 * Math.sin(T * 3 + k)), pts = [];
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? s * .45 : s; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } fillShape(c, cut(pts, st + k, 6, 1), '#fff7e0'); }
    grain(c, W, H, 4, 0.05);
  },
};

/* ---------- Money · Gold-leaf tree of life (Klimt-style spirals in mosaic) ---------- */
const money = {
  fps: 10,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx, fy] = focus(W, H), m = Math.min(W, H);
    g.fillStyle = grad(g, 0, 0, W, H, [[0, '#f8d867'], [1, '#e8b43a']]); g.fillRect(0, 0, W, H);
    const r = rng(17); for (let i = 0; i < 70; i++) { g.fillStyle = r() < .5 ? 'rgba(200,140,30,.35)' : 'rgba(255,240,170,.45)'; g.fillRect(r() * W, r() * H, m * (.02 + r() * .04), m * (.02 + r() * .04)); }
    // trunk + spiral branches that keep curling
    g.strokeStyle = '#7a4a12'; g.lineCap = 'round'; g.lineWidth = m * 0.05; g.beginPath(); g.moveTo(fx, H); g.lineTo(fx, fy); g.stroke();
    const spiral = (x, y, dir, R, k) => { g.lineWidth = m * 0.016; g.beginPath(); const turns = 2.2 + 0.25 * Math.sin(t * 0.8 + k);
      for (let a = 0; a < TAU * turns; a += 0.12) { const rr = R * (1 - a / (TAU * turns)), aa = dir * a + t * 0.3 * dir; const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); };
    [[-1, -0.05, 0.16], [1, -0.08, 0.17], [-1, -0.28, 0.12], [1, -0.3, 0.12], [-1, 0.14, 0.1], [1, 0.12, 0.1]].forEach(([d, dy, R], k) => {
      const x = fx + d * m * (0.2 + R * 0.6), y = fy + dy * m; g.strokeStyle = '#7a4a12'; g.lineWidth = m * 0.022; g.beginPath(); g.moveTo(fx, y + m * .05); g.quadraticCurveTo((fx + x) / 2, y - m * .08, x, y); g.stroke(); spiral(x, y, d, R * m, k); });
    // coins drop and stack in the roots, blue Klimt eyes on the gold
    for (let k = 0; k < 5; k++) { const q = (t * 0.22 + k / 5) % 1, x = fx + (k - 2) * m * 0.1, y = lerp(fy - m * .45, H * 0.95 - (k % 3) * m * .03, ss(0, 0.8, q));
      disc(g, x, y, m * 0.035, '#fff0a8'); disc(g, x, y, m * 0.025, '#e2a82a'); }
    for (let k = 0; k < 9; k++) { const x = fx + (hash(k, 9) - .5) * m * 1.3, y = fy + (hash(k, 5) - .5) * m * 1.1, s = m * 0.02; g.fillStyle = '#004edf'; g.fillRect(x - s, y - s * .6, s * 2, s * 1.2); disc(g, x, y, s * .45, '#f4efe8'); }
    const sweep = (t * 0.3) % 1.4 - 0.2;
    mosaic(c, b, W, H, { tile: Math.max(7, Math.round(m / 60)), grout: '#5a3a0a', seed: 5, jitter: 0.4, t,
      glint: (x, y, tt, h) => Math.max(0, 0.7 - Math.abs(x / W - sweep - (y / H) * 0.3) * 6) + (h > 0.97 ? 0.5 * (0.5 + 0.5 * Math.sin(tt * 5 + h * 70)) : 0) });
  },
};

/* ---------- Career · Cubist city of work (facets that shift with the sun) ---------- */
function facets(dst, src, W, H, { nx, ny, seed = 5, t = 0, shiftAmt = 26, edge = 'rgba(40,30,20,.45)' }) {
  const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, r = rng(seed), pts = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const e = i === 0 || j === 0 || i === nx || j === ny; pts.push([i / nx * W + (e ? 0 : (r() - .5) * W / nx * .9), j / ny * H + (e ? 0 : (r() - .5) * H / ny * .9)]); }
  const col = (x, y) => { const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4; return [sd[i], sd[i + 1], sd[i + 2]]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = pts[j * (nx + 1) + i], b = pts[j * (nx + 1) + i + 1], c2 = pts[(j + 1) * (nx + 1) + i], d2 = pts[(j + 1) * (nx + 1) + i + 1];
    for (const tri of (r() < .5 ? [[a, b, d2], [a, d2, c2]] : [[a, b, c2], [b, d2, c2]])) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, sh = Math.sin(t * 2 + cx * 0.01) * shiftAmt * r();
      const c0 = col(cx + sh, cy), q = dst.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]);
      q.addColorStop(0, rgb(mix(c0, [255, 250, 235], 0.14))); q.addColorStop(1, rgb(mix(c0, [50, 40, 30], 0.3)));
      dst.fillStyle = q; dst.beginPath(); tri.forEach((p, k) => k ? dst.lineTo(p[0], p[1]) : dst.moveTo(p[0], p[1])); dst.closePath(); dst.fill();
      dst.strokeStyle = edge; dst.lineWidth = 1.2; dst.stroke();
    }
  }
}
const career = {
  fps: 8,
  draw(c, b, t, W, H) {
    const g = b.getContext('2d'), [fx] = focus(W, H), m = Math.min(W, H), gy = H * 0.86;
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#d6dca8'], [1, '#b0be77']]); g.fillRect(0, 0, W, H);
    const sun = [fx + m * 0.22, H * 0.28 - Math.sin(t * 0.2) * H * 0.03]; disc(g, ...sun, m * 0.11, '#e83729');
    const blds = [[-0.42, 0.42, '#26512f'], [-0.28, 0.6, '#f4efe8'], [-0.12, 0.5, '#004edf'], [0.02, 0.72, '#26512f'], [0.18, 0.46, '#f8d867'], [0.32, 0.58, '#f4efe8'], [0.46, 0.4, '#26512f']];
    blds.forEach(([dx, h, col], k) => { const x = fx + dx * m, w = m * 0.13, top = gy - h * m * 0.8; g.fillStyle = col; g.fillRect(x - w / 2, top, w, gy - top);
      g.fillStyle = 'rgba(32,30,31,.5)'; for (let y = top + 12; y < gy - 10; y += 22) for (let xx = x - w / 2 + 8; xx < x + w / 2 - 8; xx += 18) if (hash(xx | 0, y | 0) > 0.4 + 0.3 * Math.sin(t + k)) g.fillRect(xx, y, 9, 11); });
    // chimney + smoke rising (the factory)
    const cx = fx - m * 0.2; g.fillStyle = '#201e1f'; g.fillRect(cx, gy - m * 0.85, m * 0.04, m * 0.85);
    for (let k = 0; k < 6; k++) { const q = (t * 0.3 + k / 6) % 1; disc(g, cx + m * .02 + q * m * .25, gy - m * .87 - q * m * .3, m * (.03 + q * .06), `rgba(244,239,232,${.85 - q * .7})`); }
    g.fillStyle = '#7a8a42'; g.fillRect(0, gy, W, H - gy);
    const big = m > 500;
    facets(c, b, W, H, { nx: big ? 26 : 16, ny: big ? 16 : 22, seed: 9, t, shiftAmt: m * 0.04 });
  },
};

/* ---------- Life Quality · Infinity dots (polka-dot pumpkin, dots breathing in waves) ---------- */
const lifeq = {
  fps: 12,
  draw(c, b, t, W, H) {
    const [fx, fy] = focus(W, H), m = Math.min(W, H);
    c.fillStyle = '#f2a27f'; c.fillRect(0, 0, W, H);
    const pitch = m * 0.055;
    for (let y = pitch / 2, j = 0; y < H + pitch; y += pitch, j++) for (let x = (j % 2) * pitch / 2, i = 0; x < W + pitch; x += pitch, i++) {
      const d = Math.hypot(x - fx, y - fy), wv = 0.5 + 0.5 * Math.sin(d * 0.02 - t * 2.2);
      disc(c, x, y, pitch * (0.12 + 0.2 * wv), wv > 0.75 ? '#e83729' : '#c2502e'); }
    // pumpkin: ribbed lobes, each lobe dotted
    const pw = m * 0.38, ph = m * 0.3, py = fy + m * 0.12, br = 1 + 0.03 * Math.sin(t * 2);
    for (let k = -3; k <= 3; k++) { const lx = fx + k * pw * 0.26, lw = pw * (0.36 - Math.abs(k) * 0.03) * br;
      c.fillStyle = '#f8d867'; c.beginPath(); c.ellipse(lx, py, lw, ph * br, 0, 0, TAU); c.fill(); c.strokeStyle = '#201e1f'; c.lineWidth = 3; c.stroke();
      for (let q = 0; q < 14; q++) { const a = hash(k + 9, q) * TAU, rr = Math.sqrt(hash(q, k + 3)), dx = Math.cos(a) * lw * .8 * rr, dy = Math.sin(a) * ph * .85 * rr;
        disc(c, lx + dx, py + dy, m * (0.008 + 0.012 * (1 - rr)) * (1 + 0.3 * Math.sin(t * 3 + q)), '#201e1f'); } }
    c.fillStyle = '#201e1f'; c.beginPath(); c.moveTo(fx - m * .025, py - ph); c.quadraticCurveTo(fx, py - ph - m * .12, fx + m * .05, py - ph - m * .13); c.lineTo(fx + m * .045, py - ph - m * .09); c.lineTo(fx + m * .025, py - ph); c.fill();
    grain(c, W, H, 6, 0.05);
  },
};

/* ---------- Energy · Concentric circles that pulse (Bauhaus colour study on night) ---------- */
const energy = {
  fps: 12,
  draw(c, b, t, W, H) {
    const [fx, fy] = focus(W, H), m = Math.min(W, H);
    c.fillStyle = '#0d1430'; c.fillRect(0, 0, W, H);
    const cols = ['#f8d867', '#e2592d', '#69b488', '#c9a5f8', '#5d9dc5', '#ffabc8', '#f4efe8', '#e83729'];
    const n = wide(W, H) ? 3 : 2, cell = m * 0.3, ox = fx - (n - 1) * cell / 2, oy = fy - cell;
    for (let j = 0; j < 3; j++) for (let i = 0; i < n; i++) {
      const x = ox + i * cell, y = oy + j * cell, k = j * n + i, beat = Math.pow(0.5 + 0.5 * Math.sin(t * TAU * 128 / 60 / 4 - k * 0.7), 3);
      c.fillStyle = ['#1c2a5c', '#141d45', '#22306a'][(i + j) % 3]; c.fillRect(x - cell / 2 + 3, y - cell / 2 + 3, cell - 6, cell - 6);
      for (let r = 5; r >= 1; r--) disc(c, x, y, cell * 0.42 * r / 5 * (r === 5 ? 1 : 1 + beat * 0.08), cols[(k + r) % cols.length]);
      c.globalAlpha = 0.25 * beat; disc(c, x, y, cell * 0.5, '#fff6d0'); c.globalAlpha = 1;
    }
    // rough brushed edges + sparks
    const r = rng(Math.floor(t * 12)); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(248,216,103,${r() * .8})`; c.fillRect(fx + (r() - .5) * m * 1.2, fy + (r() - .5) * m * 1.1, 2, 2); }
    grain(c, W, H, 8, 0.08);
  },
};

/* ---------- Love · Ink plum blossom under a cream moon (sumi-e) ---------- */
function inkBranch(g, pts, w, r, reveal) {
  const n = Math.max(2, Math.floor(pts.length * reveal)); g.lineCap = 'round';
  for (let k = 0; k < 7; k++) { const o = (k / 6 - 0.5) * w; g.strokeStyle = `rgba(22,16,14,${0.35 + r() * 0.5})`; g.lineWidth = 1 + r() * w * 0.35; g.beginPath();
    for (let i = 0; i < n; i++) { const [x, y] = pts[i], taper = 1 - i / pts.length * 0.7; i ? g.lineTo(x + o * taper, y + o * taper * 0.4) : g.moveTo(x + o, y); } g.stroke(); }
}
const love = {
  fps: 10,
  draw(c, b, t, W, H) {
    const [fx, fy] = focus(W, H), m = Math.min(W, H), st = Math.floor(t * 10);
    c.fillStyle = grad(c, 0, 0, 0, H, [[0, '#e2592d'], [1, '#c63a1e']]); c.fillRect(0, 0, W, H);
    watercolor(c, ellipsePts(fx + m * .05, fy - m * .05, m * .36, m * .36, 28), '#f8e6cf', { layers: 4, alpha: 0.5, amp: m * .02, seed: 3, edge: 0.05, blend: 'source-over' });
    const branch = []; for (let i = 0; i <= 30; i++) { const u = i / 30; branch.push([W + m * .05 - u * m * 0.85, fy + m * .32 - Math.sin(u * 3) * m * 0.22 + noise(u * 4, 2) * m * .05]); }
    const twig = []; for (let i = 0; i <= 14; i++) { const u = i / 14, p = branch[12]; twig.push([p[0] - u * m * .25, p[1] - u * m * .3 + Math.sin(u * 4) * m * .03]); }
    const r = rng(st % 3 + 1), grow = ss(0, 3, t % 1e9);
    inkBranch(c, branch, m * 0.045, r, grow); inkBranch(c, twig, m * 0.022, r, ss(1, 4, t));
    const bloom = (x, y, k) => { const open = ss(0, 1.5, t - 1 - k * 0.25) * (0.85 + 0.15 * Math.sin(t * 1.5 + k)), pr = m * 0.028 * open; if (pr < 0.5) return;
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + k; c.fillStyle = k % 3 ? '#ffabc8' : '#fff1f4'; c.beginPath(); c.arc(x + Math.cos(a) * pr, y + Math.sin(a) * pr, pr * 0.85, 0, TAU); c.fill(); }
      disc(c, x, y, pr * 0.35, '#e83729'); };
    [...branch.filter((_, i) => i % 4 === 2), ...twig.filter((_, i) => i % 4 === 3)].forEach(([x, y], k) => bloom(x + (hash(k, 1) - .5) * m * .05, y - m * .02 - hash(k, 2) * m * .03, k));
    // two birds, together
    [[0, -1], [1, 1]].forEach(([k, s]) => { const x = fx - m * .18 + k * m * .07 + Math.sin(t * .8 + k) * 4, y = fy - m * .16 + Math.cos(t * .8 + k) * 3;
      c.fillStyle = '#201e1f'; c.beginPath(); c.ellipse(x, y, m * .03, m * .02, s * .2, 0, TAU); c.fill(); disc(c, x + s * m * .025, y - m * .015, m * .013, '#201e1f'); });
    // petals drifting down
    for (let k = 0; k < 12; k++) { const q = (t * 0.07 + hash(k, 4)) % 1, x = fx + (hash(k, 6) - .3) * m * 0.9 + Math.sin(t * 1.3 + k) * m * .03, y = q * H * 1.1 - H * 0.05;
      c.fillStyle = 'rgba(255,171,200,.9)'; c.beginPath(); c.ellipse(x, y, m * .01, m * .006, t + k, 0, TAU); c.fill(); }
    grain(c, W, H, 3, 0.06);
  },
};

export const SCENES = { health, mind, emotions, character, spirit, connection, money, career, 'life-quality': lifeq, energy, love };
export const STYLE = {
  health: 'Post-impressionist flow strokes', mind: 'Pointillism', emotions: 'Watercolour', character: 'Byzantine mosaic',
  spirit: 'Impressionist dabs', connection: 'Cut-paper gouache', money: 'Gold-leaf mosaic', career: 'Cubist facets',
  'life-quality': 'Infinity dots', energy: 'Bauhaus colour study', love: 'Ink & blossom',
};
