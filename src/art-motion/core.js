/* Art-motion core — a small ES-module port of the painting toolkit from
   huashu-art-motion (https://github.com/alchaincyf/huashu-art-motion, MIT, © 2026 alchaincyf).
   See LICENSE-huashu-art-motion in this folder.
   Changes from the original: ES module instead of window globals, every renderer takes the
   canvas size (W, H) so it can paint at any header size, and only the pieces this site uses.
   Rules kept from the original SKILL.md: everything random is seeded (deterministic), strokes
   "boil" at a low fps so the painting is always alive, one style + palette per painting. */

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
export const hash = (i, j = 0) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const boilSeed = (t, fps = 8) => Math.floor(t * fps);

/* ---------- noise ---------- */
const perm = new Uint8Array(512);
{ const r = rng(1337), p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => { const u = (h & 1) ? x : -x, v = (h & 2) ? y : -y; return (h & 4) ? u + v * 0.5 : u * 0.5 + v; };
export const noise = (x, y) => {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
  return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
};
export const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); a *= 0.5; f *= 2; } return s; };

/* ---------- colour ---------- */
export const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const jitter = (c, r, amt) => [c[0] + (r() - .5) * amt, c[1] + (r() - .5) * amt, c[2] + (r() - .5) * amt];
export const swatch = (hexes, mixBase = 0.35) => { const cs = hexes.map(hex); return (x, y, col, r) => mix(cs[(r() * cs.length) | 0], col, mixBase); };

const pix = (sd, W, H, x, y) => (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4;
const data = (src, W, H) => src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;

/* ---------- 1) flow strokes (post-impressionist): short strokes that follow an angle field ---------- */
export function strokes(dst, src, W, H, { cell = 12, len = 22, width = 7, angle, seed = 1, t = 0, boil = 8, outline = 0.35, outlineCol = [20, 25, 60], outlineMix = 0.55, jitterCol = 18, palette, mask } = {}) {
  const sd = data(src, W, H), r = rng(seed * 1000 + boilSeed(t, boil));
  dst.lineCap = 'round';
  for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
    const px = x + (r() - .5) * cell, py = y + (r() - .5) * cell;
    if (mask && !mask(px, py)) { r(); r(); continue; }
    const i = pix(sd, W, H, px, py); let col = [sd[i], sd[i + 1], sd[i + 2]];
    const pc = palette ? palette(px, py, col, r) : null; if (pc) col = pc;
    const a = angle ? angle(px, py, t) : 0, l = len * (0.7 + r() * 0.6), dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
    if (outline > 0) { dst.strokeStyle = rgb(mix(col, outlineCol, outlineMix), outline); dst.lineWidth = width + 2.5; dst.beginPath(); dst.moveTo(px - dx, py - dy); dst.lineTo(px + dx, py + dy); dst.stroke(); }
    dst.strokeStyle = rgb(pc ? col : jitter(col, r, jitterCol)); dst.lineWidth = width;
    dst.beginPath(); dst.moveTo(px - dx, py - dy); dst.lineTo(px + dx, py + dy); dst.stroke();
  }
}

/* ---------- 2) dabs (impressionist): short oval dabs with warm/cool shift ---------- */
export function dabs(dst, src, W, H, { cell = 10, size = 9, seed = 2, t = 0, boil = 8, angle = -0.6, shift = 22 } = {}) {
  const sd = data(src, W, H), r = rng(seed * 1000 + boilSeed(t, boil));
  for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
    const px = x + (r() - .5) * cell * 1.2, py = y + (r() - .5) * cell * 1.2, i = pix(sd, W, H, px, py);
    const warm = r() < 0.5 ? [shift, shift * 0.5, -shift] : [-shift * 0.6, 0, shift];
    dst.fillStyle = `rgb(${sd[i] + warm[0]},${sd[i + 1] + warm[1]},${sd[i + 2] + warm[2]})`;
    dst.beginPath(); dst.ellipse(px, py, size * (0.8 + r() * 0.6), size * 0.45, angle + (r() - .5) * 0.5, 0, TAU); dst.fill();
  }
}

/* ---------- 3) pointillism (Seurat): equal dots, optical mix of two pure colours ---------- */
const pointCache = new WeakMap();
export function pointillism(c, src, W, H, { pal, comp = {}, pitch = 8, rad = 3.6, posJitter = 2, colorJitter = 40, compRate = 0.08, flicker = 0.07, fps = 6, t = 0, shimmer, white, dark, bleed = 45 } = {}) {
  const PAL = pal.map(v => typeof v === 'string' ? hex(v) : v);
  let cache = pointCache.get(pal); if (!cache) { cache = new Map(); pointCache.set(pal, cache); }
  const pick = (r, g, b) => {
    const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3); let v = cache.get(key); if (v) return v;
    let best = 1e18, bi = 0, bj = 0, bw = 1;
    for (let i = 0; i < PAL.length; i++) for (let j = i + 1; j < PAL.length; j++) {
      const pi = PAL[i], pj = PAL[j], ex = pi[0] - pj[0], ey = pi[1] - pj[1], ez = pi[2] - pj[2];
      const w = clamp(((r - pj[0]) * ex + (g - pj[1]) * ey + (b - pj[2]) * ez) / (ex * ex + ey * ey + ez * ez + 1e-6), 0.2, 0.8);
      const dr = pj[0] + w * ex - r, dg = pj[1] + w * ey - g, db = pj[2] + w * ez - b;
      const d = dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.8 + (ex * ex + ey * ey + ez * ez) * 0.004;
      if (d < best) { best = d; bi = i; bj = j; bw = w; }
    }
    v = [bi, bj, bw]; cache.set(key, v); return v;
  };
  const sd = data(src, W, H);
  const L = (x, y) => { const i = pix(sd, W, H, x, y); return sd[i] * 0.3 + sd[i + 1] * 0.59 + sd[i + 2] * 0.11; };
  const paths = PAL.map(() => new Path2D()), st = Math.floor(t * fps), ROWH = pitch * 0.866, hj = posJitter / 2;
  for (let j = 0, y = 0; y < H + ROWH; j++, y += ROWH) for (let i = 0, x = (j % 2) * pitch / 2; x < W + pitch; i++, x += pitch) {
    const px = x + (hash(i, j * 7 + 1) - 0.5) * 2 * hj, py = y + (hash(i * 3, j + 5) - 0.5) * 2 * hj, k = pix(sd, W, H, px, py);
    const dj = (hash(i * 7 + 3, j * 11) - 0.5) * colorJitter;
    const [a, bb, w] = pick(clamp(sd[k] + dj, 0, 255), clamp(sd[k + 1] + dj * 0.8, 0, 255), clamp(sd[k + 2] - dj * 0.6, 0, 255));
    const hs = shimmer && shimmer(px, py) ? hash(i + st * 977, j) : hash(i, j);
    let idx = hs < w ? a : bb; const h2 = hash(i * 5 + 2, j * 3 + 9);
    if (h2 < compRate && comp[idx] != null) idx = comp[idx];
    else if (hash(i * 13 + st * 31, j * 17) < flicker) idx = (hash(i, j + st) < w) ? bb : a;
    else if (white != null) { const dl = L(px, py) - L(px + 12, py + 5); if (Math.abs(dl) > bleed && h2 < 0.45) idx = dl > 0 ? white : dark; }
    paths[idx].moveTo(px + rad, py); paths[idx].arc(px, py, rad, 0, TAU);
  }
  paths.forEach((p, k) => { c.fillStyle = rgb(PAL[k]); c.fill(p); });
}

/* ---------- 4) mosaic (Byzantine / Klimt gold): tesserae with grout and a lit top edge ---------- */
export function mosaic(dst, src, W, H, { tile = 12, grout = '#3b352e', seed = 3, jitter: jit = 0.25, t = 0, glint } = {}) {
  const sd = data(src, W, H), r = rng(seed);
  dst.fillStyle = grout; dst.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += tile, row++) { const off = row % 2 ? tile * 0.5 * jit : 0; for (let x = -tile, col = 0; x < W; x += tile, col++) {
    const cx = x + off + tile / 2, cy = y + tile / 2, i = pix(sd, W, H, cx, cy);
    let c = jitter([sd[i], sd[i + 1], sd[i + 2]], r, 14); const s = tile * (0.82 + r() * 0.1);
    if (glint) { const g = glint(cx, cy, t, hash(col, row)); if (g > 0) c = mix(c, [255, 248, 214], g); }
    dst.fillStyle = rgb(c); dst.fillRect(cx - s / 2 + (r() - .5) * 1.5, cy - s / 2 + (r() - .5) * 1.5, s, s);
    dst.fillStyle = 'rgba(255,255,255,.14)'; dst.fillRect(cx - s / 2, cy - s / 2, s, 1.5);
  } }
}

/* ---------- 5) watercolour: deformed polygons, many thin multiply layers, pigment edge ---------- */
export function deform(pts, depth, amp, r) {
  let out = pts;
  for (let d = 0; d < depth; d++) {
    const n = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i], b = out[(i + 1) % out.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const g = (r() + r() + r() - 1.5) * amp * Math.min(1, len / 80), nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      n.push(a, [(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + ny * g]);
    }
    out = n; amp *= 0.6;
  }
  return out;
}
const fillPts = (g, pts) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); };
export function watercolor(g, pts, color, { layers = 6, alpha = 0.13, amp = 10, seed = 1, edge = 0.1, blend = 'multiply' } = {}) {
  const r = rng(seed * 7919 + 13), base = deform(pts, 3, amp, r);
  g.save(); g.globalCompositeOperation = blend; g.lineJoin = 'round';
  for (let k = 0; k < layers; k++) {
    const q = deform(base, 2, amp * 0.55, r); fillPts(g, q);
    g.globalAlpha = alpha; g.fillStyle = color; g.fill();
    if (edge) { g.globalAlpha = edge; g.strokeStyle = color; g.lineWidth = 1.4; g.stroke(); }
  }
  g.restore();
}
export const ellipsePts = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);

/* ---------- 6) cut paper (Matisse): resample a closed shape and jitter it — a hand-cut edge ---------- */
export function cut(pts, seed, step = 14, amp = 2.2) {
  const r = rng(seed), out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n) + (r() - .5) * amp * 2, lerp(a[1], b[1], k / n) + (r() - .5) * amp * 2]);
  }
  return out;
}
export const fillShape = (g, pts, col) => { fillPts(g, pts); g.fillStyle = col; g.fill(); };

/* ---------- paper grain, shared by every painting ---------- */
export function grain(g, W, H, seed = 9, alpha = 0.07) {
  const r = rng(seed); g.save(); g.globalAlpha = alpha;
  for (let i = 0; i < W * H / 90; i++) { g.fillStyle = r() < .5 ? '#000' : '#fff'; g.fillRect(r() * W, r() * H, 1, 1); }
  g.restore();
}
