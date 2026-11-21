/* Minh, through the ages — the huashu-art-motion "art history speedrun", made with Minh.
   After huashu-art-motion (MIT): one fixed room skeleton (window left, table right, Minh with her tea,
   the orange cat on the floor) repainted era by era. The five layers of its 02 mechanism:
   a fixed skeleton the eye can anchor to · every era a living painting (she breathes, the cat's tail moves,
   each era adds its own motif loops) · transitions that grow out of the next style · a beat grid that speeds
   up · a year counter that rolls with time. Per its reference 18 the character is a region of the picture:
   her own character art is repainted by each era's medium (posterised into the era's palette, pixelated,
   inked, duotoned…) and then the whole frame goes through the era's renderer, so she belongs to every era.
   Original compositions; no master's painting or film character is copied. */
import { TAU, clamp, lerp, ss, rng, hash, noise, hex, rgb, mix, strokes, dabs, pointillism, mosaic, cut, fillShape, grain, watercolor, ellipsePts } from './core.js';
import { cat } from './anime-room.js';

const DW = 1600, DH = 900, FLOOR = 610, WIN = [230, 120, 330, 330], TABLE = [880, 650, 470];   // x, top y, width
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const disc = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const lgr = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };

/* ---------- her sprite, repainted per era (cached) ---------- */
let SRC = null;
const SW = 400, SH = 600;
const loadHer = base => SRC ??= new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = base + 'her.webp'; });
const CACHE = new Map();
function repaint(im, era) {
  if (CACHE.has(era.id)) return CACHE.get(era.id);
  const c = off(SW, SH), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, SW, SH);
  const mode = era.char || 'none';
  if (mode !== 'none') {
    const d = g.getImageData(0, 0, SW, SH), p = d.data, ramp = (era.ramp || []).map(hex), A = era.duo ? era.duo.map(hex) : null;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const L = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11) / 255;
      let o;
      if (mode === 'poster') { const k = Math.min(ramp.length - 1, Math.floor(Math.pow(L, era.gamma || 1) * ramp.length)); o = ramp[k]; }
      else if (mode === 'mono') { const v = clamp((L - .15) * 1.35); o = mix(hex(era.ink || '#1a1a1a'), hex(era.paper || '#f4efe4'), v); }
      else if (mode === 'duo') o = mix(A[0], A[1], L);
      else if (mode === 'tint') o = mix([p[i], p[i + 1], p[i + 2]], hex(era.tint), era.tintAmt || .35);
      if (o) { p[i] = o[0]; p[i + 1] = o[1]; p[i + 2] = o[2]; }
      if (era.hardAlpha) p[i + 3] = p[i + 3] > 120 ? 255 : 0;
    }
    g.putImageData(d, 0, 0);
  }
  if (era.pixel) { const t = off(SW / era.pixel | 0, SH / era.pixel | 0), tg = t.getContext('2d'); tg.imageSmoothingEnabled = true; tg.drawImage(c, 0, 0, t.width, t.height);
    const d = tg.getImageData(0, 0, t.width, t.height), p = d.data; for (let i = 0; i < p.length; i += 4) p[i + 3] = p[i + 3] > 110 ? 255 : 0; tg.putImageData(d, 0, 0);
    g.clearRect(0, 0, SW, SH); g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, SW, SH); }
  if (era.outline) {                                                             // a hand-inked contour around the silhouette
    const o = off(SW, SH), og = o.getContext('2d'), w = era.outline;
    for (let a = 0; a < 8; a++) og.drawImage(c, Math.cos(a / 8 * TAU) * w, Math.sin(a / 8 * TAU) * w);
    og.globalCompositeOperation = 'source-in'; og.fillStyle = era.ink || '#111'; og.fillRect(0, 0, SW, SH);
    og.globalCompositeOperation = 'source-over'; og.drawImage(c, 0, 0); CACHE.set(era.id, o); return o;
  }
  CACHE.set(era.id, c); return c;
}

/* ---------- shared room pieces, drawn in each era's palette ---------- */
function roomBase(g, P, t) {
  g.fillStyle = lgr(g, 0, 0, 0, FLOOR, [[0, P.wall[0]], [1, P.wall[1]]]); g.fillRect(0, 0, DW, FLOOR);
  g.fillStyle = lgr(g, 0, FLOOR, 0, DH, [[0, P.floor[0]], [1, P.floor[1]]]); g.fillRect(0, FLOOR, DW, DH - FLOOR);
}
function windowView(g, P, t, extra) {
  const [x, y, w, h] = WIN;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = lgr(g, 0, y, 0, y + h, [[0, P.sky[0]], [1, P.sky[1]]]); g.fillRect(x, y, w, h);
  if (P.hill) { g.fillStyle = P.hill; g.beginPath(); g.moveTo(x, y + h * .72); for (let i = 0; i <= w; i += 10) g.lineTo(x + i, y + h * .66 - Math.sin(i * .02 + 1) * 16); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill(); }
  if (P.tree) { const sw = Math.sin(t * 1.3) * .03; g.save(); g.translate(x + w * .7, y + h * .8); g.rotate(sw); g.fillStyle = P.trunk || '#4a3a2a'; g.fillRect(-6, -80, 12, 80); disc(g, 0, -110, 52, P.tree); disc(g, -34, -88, 34, P.tree); disc(g, 34, -84, 36, P.tree); g.restore(); }
  extra && extra(g, x, y, w, h, t);
  g.restore();
  g.strokeStyle = P.frame; g.lineWidth = 14; g.strokeRect(x, y, w, h); g.lineWidth = 8; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * .46); g.lineTo(x + w, y + h * .46); g.stroke();
}
function table(g, P) {
  const [x, y, w] = TABLE;
  g.fillStyle = P.table; g.fillRect(x + 30, y + 20, 14, DH - 70 - y); g.fillRect(x + w - 44, y + 20, 14, DH - 70 - y);
  g.fillStyle = P.cloth || P.table; g.fillRect(x, y, w, 26); { g.beginPath(); g.moveTo(x, y + 26); for (let i = 0; i <= 12; i++) g.lineTo(x + i * w / 12, y + 60 + (i % 2) * 10); g.lineTo(x + w, y + 26); g.fill(); }
}
function her(g, spr, t, P) {
  if (!spr) return;
  const h = 640, w = h * SW / SH, x = 1110, bottom = TABLE[1] + 58, br = Math.sin(t * 1.5) * .01, sway = Math.sin(t * .7) * .012;
  g.save(); g.translate(x, bottom); g.rotate(sway); g.scale(1, 1 + br); g.imageSmoothingEnabled = !P.pixelFrame; g.drawImage(spr, -w / 2, -h, w, h); g.restore();
  // steam from her tea
  const mx = x - w / 2 + w * .58, my = bottom - h + h * .47;
  for (let k = 0; k < 3; k++) { const q = (t * .5 + k / 3) % 1; g.strokeStyle = P.steam || `rgba(255,255,255,${.7 - q * .7})`; g.globalAlpha = 1 - q; g.lineWidth = 4; g.beginPath(); g.moveTo(mx + k * 9 - 9, my - 10 - q * 40); g.quadraticCurveTo(mx + 12 + Math.sin(t * 3 + k) * 10, my - 30 - q * 50, mx + k * 9 - 6, my - 52 - q * 60); g.stroke(); g.globalAlpha = 1; }
}
const theCat = (g, t, pose = 'sit') => cat(g, 470, DH - 70, 1.25, { pose, t });
function yearTag(g, era, P) {
  g.save(); g.textAlign = 'right'; g.fillStyle = P.tag || P.ink || '#201e1f'; g.font = `${P.tagFont || 'bold 64px Georgia, serif'}`; g.fillText(era.label, DW - 50, 96);
  g.font = '20px ui-monospace, monospace'; g.globalAlpha = .75; g.fillText(era.name, DW - 52, 128); g.restore();
}

/* ---------- renderers ---------- */
function pixelFrame(c, base, W, H, px, pal) {
  const t = off(Math.max(2, W / px | 0), Math.max(2, H / px | 0)), tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(base, 0, 0, t.width, t.height);
  if (pal) { const P = pal.map(hex), d = tg.getImageData(0, 0, t.width, t.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { let b = 0, bd = 1e9; for (let k = 0; k < P.length; k++) { const dr = p[i] - P[k][0], dg = p[i + 1] - P[k][1], db = p[i + 2] - P[k][2], dd = dr * dr * .3 + dg * dg * .59 + db * db * .11; if (dd < bd) { bd = dd; b = k; } } p[i] = P[b][0]; p[i + 1] = P[b][1]; p[i + 2] = P[b][2]; }
    tg.putImageData(d, 0, 0); }
  c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, W, H); c.imageSmoothingEnabled = true;
}
function halftone(c, base, W, H, { cell = 9, col = '#d8282f', alpha = .55 } = {}) {
  c.drawImage(base, 0, 0); const d = base.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  c.fillStyle = col; c.globalAlpha = alpha;
  for (let y = 0, j = 0; y < H; y += cell, j++) for (let x = (j % 2) * cell / 2; x < W; x += cell) { const i = ((y | 0) * W + (x | 0)) * 4, L = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; const r = (1 - L) * cell * .48; if (r > .6) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } }
  c.globalAlpha = 1;
}
const vignette = (c, W, H, a = .6, col = '0,0,0') => { const q = c.createRadialGradient(W * .58, H * .45, H * .15, W * .5, H * .5, W * .7); q.addColorStop(0, `rgba(${col},0)`); q.addColorStop(1, `rgba(${col},${a})`); c.fillStyle = q; c.fillRect(0, 0, W, H); };

/* ---------- the eras ---------- */
const glyph = (g, x, y, k, col) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3; const s = 14;
  if (k % 5 === 0) { g.beginPath(); g.ellipse(x, y, s, s * .55, 0, 0, TAU); g.stroke(); disc(g, x, y, 4, col); }
  else if (k % 5 === 1) { g.beginPath(); g.moveTo(x - s, y + s); g.quadraticCurveTo(x, y - s * 1.4, x + s, y + s); g.stroke(); }
  else if (k % 5 === 2) { g.beginPath(); g.arc(x, y - s * .5, s * .45, 0, TAU); g.moveTo(x, y); g.lineTo(x, y + s); g.moveTo(x - s * .6, y + 2); g.lineTo(x + s * .6, y + 2); g.stroke(); }
  else if (k % 5 === 3) { g.beginPath(); for (let i = 0; i < 3; i++) { g.moveTo(x - s, y - s + i * s); g.lineTo(x + s, y - s + i * s); } g.stroke(); }
  else { g.beginPath(); g.moveTo(x - s, y + s); g.lineTo(x, y - s); g.lineTo(x + s, y + s); g.closePath(); g.stroke(); } };

export const ERAS = [
  { id: 'cave', year: -40000, label: '40,000 BC', name: 'Cave painting', char: 'poster', ramp: ['#3a1a0c', '#8a3a18', '#c8642a', '#e8a060'], gamma: .8, outline: 0,
    P: { wall: ['#7a4a2c', '#5a3220'], floor: ['#4a2a18', '#2e1a10'], sky: ['#1a0e08', '#3a2010'], frame: '#3a2010', table: '#5a3420', ink: '#2a140a', tag: '#f0c890', tagFont: 'bold 60px Georgia, serif' },
    decor(g, P, t) { const r = rng(7); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < .5 ? '40,20,10' : '200,140,90'},${.08 + r() * .12})`; g.beginPath(); g.ellipse(r() * DW, r() * FLOOR, 30 + r() * 120, 20 + r() * 60, r() * 3, 0, TAU); g.fill(); }
      [[120, 520], [700, 160], [780, 220], [1450, 300]].forEach(([x, y], k) => { g.fillStyle = `rgba(200,80,40,${.45 + .15 * Math.sin(t * 2 + k)})`; g.beginPath(); g.ellipse(x, y, 26, 34, 0, 0, TAU); g.fill(); for (let f = 0; f < 5; f++) { g.save(); g.translate(x, y); g.rotate(-1 + f * .5); g.fillRect(-5, -70, 10, 40); g.restore(); } });
      const bx = 700 + Math.sin(t * .6) * 30; g.fillStyle = '#2a140a'; g.beginPath(); g.ellipse(bx, 330, 90, 45, 0, 0, TAU); g.fill(); g.fillRect(bx - 70, 360, 10, 50); g.fillRect(bx + 50, 360, 10, 50); disc(g, bx + 95, 310, 28, '#2a140a');
      const fl = .8 + .2 * Math.sin(t * 9); const q = g.createRadialGradient(300, 800, 10, 300, 800, 420); q.addColorStop(0, `rgba(255,150,60,${.35 * fl})`); q.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = q; g.fillRect(0, 300, 900, 600); },
    noWindow: true, render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 3, .12); vignette(c, W, H, .55); } },
  { id: 'egypt', year: -1350, label: '1350 BC', name: 'Egyptian wall painting', char: 'poster', ramp: ['#1a1410', '#3a6ea8', '#c8402a', '#e8b860', '#f4e6c4'], outline: 2, ink: '#1a1410',
    P: { wall: ['#efdcae', '#e2c890'], floor: ['#c89a5a', '#a87a40'], sky: ['#3a6ea8', '#8ab8d8'], frame: '#1a1410', table: '#8a5a2a', cloth: '#f4ecd8', ink: '#1a1410', hill: '#c8a860', tag: '#1a1410' },
    decor(g, P, t) { for (let row = 0; row < 3; row++) for (let i = 0; i < 18; i++) { const x = 640 + i * 52, y = 70 + row * 56; if (x > 1500) continue; glyph(g, x, y, i * 3 + row, row === 1 ? '#3a6ea8' : '#1a1410'); }
      for (let i = 0; i < 32; i++) { g.fillStyle = ['#3a6ea8', '#c8402a', '#e8b860', '#1a1410'][i % 4]; g.fillRect(i * 50, DH - 40, 50, 40); }
      const sx = 395, sy = 200 + Math.sin(t) * 4; disc(g, sx, sy, 34, '#c8402a'); for (let k = 0; k < 9; k++) { const a = Math.PI * .15 + k * Math.PI * .7 / 8; g.strokeStyle = '#c8402a'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40); g.lineTo(sx + Math.cos(a) * 120, sy + Math.sin(a) * 120); g.stroke(); } },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 5, .08); } },
  { id: 'roman', year: 79, label: '79 AD', name: 'Roman mosaic',
    P: { wall: ['#e8dcc4', '#d8c8a8'], floor: ['#b89a74', '#9a7a58'], sky: ['#6a8ab0', '#b8c8d8'], frame: '#5a4a3a', table: '#7a5a3a', cloth: '#efe4cc', ink: '#2a2018', hill: '#8a9a6a', tree: '#5a7a4a', tag: '#2a2018' },
    decor(g, P, t) { g.strokeStyle = '#5a3a2a'; g.lineWidth = 10; g.strokeRect(20, 20, DW - 40, DH - 40); g.strokeStyle = '#a8442a'; g.lineWidth = 6; g.strokeRect(44, 44, DW - 88, DH - 88);
      const vx = 700, vy = 560; g.fillStyle = '#a8442a'; g.beginPath(); g.moveTo(vx - 30, vy); g.quadraticCurveTo(vx - 50, vy - 70, vx - 16, vy - 100); g.lineTo(vx + 16, vy - 100); g.quadraticCurveTo(vx + 50, vy - 70, vx + 30, vy); g.fill(); },
    render(c, b, t, W, H) { mosaic(c, b, W, H, { tile: Math.max(6, W / 150 | 0), grout: '#4a3e32', seed: 9, jitter: .3, t, glint: (x, y, tt, h) => h > .985 ? .35 * (.5 + .5 * Math.sin(tt * 5 + h * 60)) : 0 }); } },
  { id: 'gothic', year: 1290, label: '1290', name: 'Gothic manuscript', char: 'tint', tint: '#c84a2a', tintAmt: .15, outline: 2, ink: '#2a1a10',
    P: { wall: ['#f2e6c8', '#e8d8b0'], floor: ['#2a4a8a', '#1a3a7a'], sky: ['#2a4a8a', '#c8a040'], frame: '#c8a040', table: '#8a2a1a', cloth: '#c8402a', ink: '#2a1a10', tag: '#8a2a1a' },
    decor(g, P, t) { g.strokeStyle = '#c8a040'; g.lineWidth = 6; g.strokeRect(30, 30, DW - 60, DH - 60); for (let i = 0; i < 60; i++) { const x = 30 + (i % 30) * 53, y = i < 30 ? 30 : DH - 30; disc(g, x, y, 6 + 2 * Math.sin(t * 3 + i), i % 2 ? '#c8402a' : '#2a4a8a'); }
      g.fillStyle = '#8a2a1a'; g.font = 'bold 120px Georgia, serif'; g.fillText('M', 660, 260); g.strokeStyle = '#c8a040'; g.lineWidth = 3; g.strokeRect(650, 150, 110, 130);
      g.fillStyle = '#2a1a10'; g.font = 'italic 26px Georgia, serif'; ['inu sana', 'mens clara', 'cor bonum'].forEach((s, k) => g.fillText(s, 780, 190 + k * 36)); },
    arch: true, render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 6, .06); } },
  { id: 'rembrandt', year: 1642, label: '1642', name: 'Chiaroscuro', char: 'tint', tint: '#6a3a1a', tintAmt: .25,
    P: { wall: ['#2a1e14', '#1a120c'], floor: ['#22180f', '#120c08'], sky: ['#0e1420', '#1a2230'], frame: '#3a2a1a', table: '#3a2414', cloth: '#7a2a1a', ink: '#e8c890', tag: '#e8c890' },
    decor(g, P, t) { const fl = .85 + .15 * Math.sin(t * 7) * Math.sin(t * 3.1); const cx = 940, cy = 600; g.fillStyle = '#e8dcb8'; g.fillRect(cx - 8, cy, 16, 50); g.fillStyle = `rgba(255,200,100,${fl})`; g.beginPath(); g.ellipse(cx, cy - 14, 9, 18 * fl, 0, 0, TAU); g.fill(); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); const fl = .85 + .15 * Math.sin(t * 7) * Math.sin(t * 3.1); c.save(); c.globalCompositeOperation = 'multiply'; const q = c.createRadialGradient(W * .66, H * .42, H * .12, W * .62, H * .5, W * .6); q.addColorStop(0, 'rgba(255,244,224,1)'); q.addColorStop(.4, 'rgba(210,160,110,1)'); q.addColorStop(1, 'rgba(30,18,10,1)'); c.fillStyle = q; c.fillRect(0, 0, W, H); c.restore();
      c.save(); c.globalCompositeOperation = 'screen'; const l = c.createRadialGradient(W * .6, H * .62, 4, W * .6, H * .62, H * .5); l.addColorStop(0, `rgba(255,190,110,${.35 * fl})`); l.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = l; c.fillRect(0, 0, W, H); c.restore(); } },
  { id: 'ink', year: 1690, label: '1690', name: 'Ink wash', char: 'mono', ink: '#1c1c1c', paper: '#f4f0e6',
    P: { wall: ['#f6f2e8', '#efe8da'], floor: ['#e8e0d0', '#d8d0c0'], sky: ['#f6f2e8', '#e8e4da'], frame: '#2a2a2a', table: '#3a3a3a', ink: '#1c1c1c', tag: '#1c1c1c', steam: 'rgba(60,60,60,.5)' },
    decor(g, P, t) { const sw = Math.sin(t * .9) * .05; g.save(); g.translate(760, 420); g.rotate(sw); g.strokeStyle = '#2a2a2a'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -320); g.stroke();
      for (let k = 0; k < 7; k++) { g.save(); g.translate(0, -60 - k * 40); g.rotate((k % 2 ? 1 : -1) * (.9 + Math.sin(t + k) * .1)); g.fillStyle = 'rgba(30,30,30,.8)'; g.beginPath(); g.ellipse(36, 0, 40, 9, 0, 0, TAU); g.fill(); g.restore(); } g.restore();
      g.fillStyle = '#b8302a'; g.fillRect(1500, 160, 34, 34); g.fillStyle = '#1c1c1c'; g.font = '30px serif'; g.fillText('心', 1504, 240); g.fillText('清', 1504, 280); },
    lineRoom: true, render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 8, .06); } },
  { id: 'monet', year: 1874, label: '1874', name: 'Impressionism', char: 'tint', tint: '#c8b8e8', tintAmt: .12,
    P: { wall: ['#e8e0f0', '#d8d0e8'], floor: ['#c8b898', '#b8a888'], sky: ['#9ac0e0', '#e8e4d0'], frame: '#f4f0f8', table: '#8a7a6a', cloth: '#f4f0e8', ink: '#4a4a6a', hill: '#8ab878', tree: '#6a9a5a', tag: '#4a4a6a' },
    decor(g, P, t) { for (let k = 0; k < 14; k++) disc(g, 680 + (k % 7) * 30, 560 - (k / 7 | 0) * 30 + Math.sin(t * 1.4 + k) * 3, 14, ['#e888a8', '#f4c860', '#e86a5a', '#b898e0'][k % 4]); g.fillStyle = '#5a8a4a'; g.fillRect(690, 590, 200, 20); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); dabs(c, b, W, H, { cell: Math.max(6, W / 190 | 0), size: Math.max(6, W / 190 | 0), t, boil: 8, seed: 31, angle: -.4, shift: 22 }); } },
  { id: 'seurat', year: 1884, label: '1884', name: 'Pointillism',
    P: { wall: ['#e8e0c8', '#d8d0b8'], floor: ['#c8a878', '#a88858'], sky: ['#7ab0d8', '#d8ecf4'], frame: '#f4f0e8', table: '#6a5a4a', cloth: '#f4f0e8', ink: '#1a2a58', hill: '#2f8a5a', tree: '#2f7a4a', tag: '#1a2a58' },
    decor() {}, render(c, b, t, W, H) { c.save(); c.filter = 'blur(2px)'; c.drawImage(b, 0, 0); c.restore(); pointillism(c, b, W, H, { pal: SEURAT, comp: { 2: 6, 3: 6, 5: 1, 6: 2 }, pitch: Math.max(5, W / 210), rad: Math.max(2.2, W / 470), t, fps: 6, white: 4, dark: 0 }); } },
  { id: 'vangogh', year: 1889, label: '1889', name: 'Post-impressionism',
    P: { wall: ['#3a5ab8', '#2a4aa0'], floor: ['#d8783a', '#b85a2a'], sky: ['#1a2a6a', '#3a5ab8'], frame: '#4a8a5a', table: '#c88a3a', cloth: '#f4e08a', ink: '#14205a', tag: '#f4d860' },
    sky(g, x, y, w, h, t) { [[.3, .25], [.7, .2], [.55, .5]].forEach(([u, v], k) => { const r = 26 + 6 * Math.sin(t * 2 + k); disc(g, x + u * w, y + v * h, r * 1.8, 'rgba(244,216,96,.3)'); disc(g, x + u * w, y + v * h, r, '#f4d860'); }); },
    decor(g, P, t) { for (let k = 0; k < 7; k++) disc(g, 700 + (k % 4) * 26, 540 - (k / 4 | 0) * 28, 15, '#f4c030'); g.fillStyle = '#4a8a5a'; g.fillRect(690, 560, 120, 50); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); const s = W / DW, [wx, wy, ww, wh] = WIN; strokes(c, b, W, H, { cell: Math.max(6, W / 160 | 0), len: W / 70, width: W / 260, t, boil: 8, seed: 17, outline: .25, outlineCol: [20, 25, 70], jitterCol: 26,
      angle: (x, y, tt) => { const cx = (wx + ww / 2) * s, cy = (wy + wh / 2) * s; if (x > wx * s && x < (wx + ww) * s && y > wy * s && y < (wy + wh) * s) return Math.atan2(y - cy, x - cx) + Math.PI / 2 + tt * .3; return y > FLOOR * s ? Math.cos(x * .01) * .3 : noise(x * .006 + tt * .1, y * .006) * 2.4; } }); } },
  { id: 'klimt', year: 1907, label: '1907', name: 'Gold period',
    P: { wall: ['#e8c050', '#c89a30'], floor: ['#2f5a3a', '#1f4a2a'], sky: ['#2a3a5a', '#c8a040'], frame: '#1a1410', table: '#1a1410', cloth: '#e8c050', ink: '#1a1410', tag: '#1a1410' },
    decor(g, P, t) { const r = rng(4); for (let i = 0; i < 40; i++) { const x = r() * DW, y = r() * FLOOR, s = 14 + r() * 26; g.strokeStyle = r() < .5 ? '#8a5a10' : '#fff0a8'; g.lineWidth = 3; g.beginPath(); for (let a = 0; a < TAU * 2.2; a += .3) { const rr = s * (1 - a / (TAU * 2.2)); g.lineTo(x + Math.cos(a + t * .4) * rr, y + Math.sin(a + t * .4) * rr); } g.stroke(); }
      for (let i = 0; i < 30; i++) disc(g, r() * DW, FLOOR + 20 + r() * 260, 8 + r() * 8, ['#e8688a', '#f4f0e0', '#e8a040', '#8ac0e8'][i % 4]); },
    render(c, b, t, W, H) { const sweep = (t * .3) % 1.4 - .2; mosaic(c, b, W, H, { tile: Math.max(5, W / 200 | 0), grout: '#5a3a0a', seed: 5, jitter: .4, t, glint: (x, y, tt, h) => Math.max(0, .6 - Math.abs(x / W - sweep - (y / H) * .3) * 6) * (y < H * .68 ? 1 : .3) + (h > .97 ? .45 * (.5 + .5 * Math.sin(tt * 5 + h * 70)) : 0) }); } },
  { id: 'bauhaus', year: 1923, label: '1923', name: 'Bauhaus', char: 'poster', ramp: ['#1a1a1a', '#d8282f', '#f4efe2'], gamma: .9, outline: 0,
    P: { wall: ['#f4efe2', '#f4efe2'], floor: ['#f4efe2', '#e8e2d2'], sky: ['#2a4ab8', '#2a4ab8'], frame: '#1a1a1a', table: '#1a1a1a', ink: '#1a1a1a', tag: '#1a1a1a', tagFont: 'bold 72px Helvetica, Arial, sans-serif' },
    decor(g, P, t) { const a = t * .4; g.save(); g.translate(1200, 330); g.rotate(a); g.fillStyle = '#d8282f'; g.beginPath(); g.arc(0, 0, 210, 0, TAU); g.fill(); g.restore();
      g.fillStyle = '#1a1a1a'; g.fillRect(620, 120 + Math.sin(t * 2) * 8, 26, 420); g.fillRect(660, 520, 220, 22); g.fillStyle = '#f4c820'; g.beginPath(); g.moveTo(720, 500); g.lineTo(840, 500); g.lineTo(780, 400 + Math.sin(t * 2.6) * 10); g.fill();
      g.save(); g.translate(90, 700); g.rotate(-Math.PI / 2); g.fillStyle = '#1a1a1a'; g.font = 'bold 120px Helvetica, Arial, sans-serif'; g.fillText('minh', 0, 0); g.restore(); },
    render(c, b) { c.drawImage(b, 0, 0); } },
  { id: 'matisse', year: 1947, label: '1947', name: 'Cut-outs', char: 'poster', ramp: ['#1a2a6a', '#e2592d', '#f4efe2'], outline: 0,
    P: { wall: ['#2a5ab0', '#2a5ab0'], floor: ['#3a8a4a', '#3a8a4a'], sky: ['#f4efe2', '#f4efe2'], frame: '#f4efe2', table: '#f4c820', cloth: '#e2592d', ink: '#f4efe2', tag: '#f4efe2' },
    decor(g, P, t) { const st = Math.floor(t * 10); [[690, 520, -.3, '#f4efe2'], [760, 540, .2, '#f4c820'], [120, 560, .1, '#f4efe2'], [1500, 520, -.2, '#e2592d']].forEach(([x, y, a, col], k) => { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + Math.sin(u * 9) * 18 * u, y - u * 300]); } for (let i = 10; i >= 0; i--) { const u = i / 10; pts.push([x + Math.sin(u * 9) * 18 * u + 40 * Math.sin(u * Math.PI), y - u * 300]); }
      g.save(); g.translate(x, y); g.rotate(a + Math.sin(t * 1.2 + k) * .08); g.translate(-x, -y); fillShape(g, cut(pts, st + k, 12, 2.4), col); g.restore(); });
      const sp = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 22 : 50; sp.push([395 + Math.cos(a) * r, 230 + Math.sin(a) * r]); } fillShape(g, cut(sp, st, 8, 1.6), '#1a2a6a'); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 4, .05); } },
  { id: 'pop', year: 1962, label: '1962', name: 'Pop art', char: 'poster', ramp: ['#141414', '#d8282f', '#f4d020', '#fbe8d0'], gamma: .8, outline: 4, ink: '#141414',
    P: { wall: ['#f4d020', '#f4d020'], floor: ['#d8282f', '#d8282f'], sky: ['#3a8ad8', '#3a8ad8'], frame: '#141414', table: '#141414', cloth: '#f4f0e8', ink: '#141414', tag: '#d8282f', tagFont: 'bold 70px Impact, Arial Black, sans-serif' },
    decor(g, P, t) { const pop = .5 + .5 * Math.sin(t * 2); g.fillStyle = '#fff'; g.strokeStyle = '#141414'; g.lineWidth = 5; g.beginPath(); g.ellipse(1260, 190, 120, 70, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(1200, 250); g.lineTo(1170, 300); g.lineTo(1235, 255); g.fill();
      g.fillStyle = '#141414'; for (let k = 0; k < 3; k++) disc(g, 1220 + k * 40, 192, 9 * (k / 3 < (t * .8 % 1) ? 1 : .5), '#141414');
      const bx = 690, by = 230; g.save(); g.translate(bx, by); g.scale(.9 + pop * .15, .9 + pop * .15); g.fillStyle = '#d8282f'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 60 : 110; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f4d020'; g.font = 'bold 44px Impact, sans-serif'; g.textAlign = 'center'; g.fillText('WOW!', 0, 14); g.restore(); },
    render(c, b, t, W, H) { halftone(c, b, W, H, { cell: Math.max(7, W / 160 | 0), col: '#c81c26', alpha: .35 }); } },
  { id: 'kusama', year: 1965, label: '1965', name: 'Infinity dots', char: 'poster', ramp: ['#1a1a1a', '#d8282f', '#f4f0e8'], outline: 0,
    P: { wall: ['#d8282f', '#d8282f'], floor: ['#c81c26', '#b81420'], sky: ['#1a1a1a', '#1a1a1a'], frame: '#f4f0e8', table: '#f4d020', ink: '#f4f0e8', tag: '#f4f0e8' },
    decor() {},
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); const s = W / DW, p = 46 * s;
      for (let y = p / 2, j = 0; y < H; y += p, j++) for (let x = (j % 2) * p / 2, i = 0; x < W; x += p, i++) { const d = Math.hypot(x - W * .7, y - H * .5), wv = .5 + .5 * Math.sin(d * .03 / s - t * 2.4); disc(c, x, y, p * (.1 + .17 * wv), `rgba(244,240,232,${.85})`); } } },
  { id: 'nes', year: 1985, label: '1985', name: '8-bit', char: 'none', pixelFrame: true,
    P: { wall: ['#5c94fc', '#5c94fc'], floor: ['#c84c0c', '#c84c0c'], sky: ['#5c94fc', '#9cfcf0'], frame: '#fcfcfc', table: '#7c3c00', cloth: '#fcfcfc', ink: '#000', hill: '#00a800', tree: '#00a800', tag: '#fcfcfc', tagFont: 'bold 56px ui-monospace, monospace' },
    decor(g, P, t) { g.strokeStyle = '#000'; g.lineWidth = 4; for (let y = FLOOR; y < DH; y += 40) for (let x = ((y / 40) % 2) * 40; x < DW; x += 80) g.strokeRect(x, y, 80, 40);
      const cy = 300 + Math.abs(Math.sin(t * 3)) * -40; g.fillStyle = '#fcd800'; g.fillRect(760, cy, 34, 44); g.fillStyle = '#000'; g.fillRect(772, cy + 10, 10, 24);
      g.fillStyle = '#fcfcfc'; g.font = 'bold 30px ui-monospace, monospace'; g.fillText(`MINH ×03   ♥♥♥   WORLD 1-1   ★${(t * 3 | 0) % 100}`, 60, 60); },
    render(c, b, t, W, H) { pixelFrame(c, b, W, H, Math.max(4, W / 220 | 0), NES); } },
  { id: 'ghibli', year: 1988, label: '1988', name: 'Anime watercolour',
    P: { wall: ['#fbf1dc', '#e8d0a0'], floor: ['#a87650', '#8a5a3a'], sky: ['#8ac4e8', '#fbe6c0'], frame: '#f6f1e6', table: '#6a4a34', cloth: '#fffdf6', ink: '#5a3a2c', hill: '#7fb84a', tree: '#4f8f3a', tag: '#2f6a4a', tagFont: 'italic bold 64px Georgia, serif' },
    decor(g, P, t) { const r = rng(9); for (let i = 0; i < 14; i++) watercolor(g, ellipsePts(r() * DW, r() * FLOOR, 60 + r() * 120, 40 + r() * 80, 12), ['#f3d9a8', '#cfdce8', '#f2c9c0', '#d8e8c0'][i % 4], { layers: 2, alpha: .06, amp: 40, seed: 300 + i, edge: 0 });
      [-1, 1].forEach(side => { const [x, y, w, h] = WIN, gust = .5 + .5 * Math.sin(t * 3 + side), pts = []; const x0 = side < 0 ? x - 30 : x + w + 30, inner = side < 0 ? x + 50 : x + w - 50;
        for (let i = 0; i <= 10; i++) { const q = i / 10; pts.push([inner + (side < 0 ? 1 : -1) * q * q * (20 + 60 * gust), y - 10 + q * (h + 20)]); } pts.push([x0, y + h + 10], [x0, y - 10]); g.globalAlpha = .75; fillShape(g, pts, '#fff'); g.globalAlpha = 1; }); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); grain(c, W, H, 5, .05); c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 16; i++) { const x = W * (.45 + hash(i, 1) * .5) + noise(i, t) * 14, y = H * (.1 + hash(i, 2) * .4), r = W * .012 * (1 + hash(i, 3)); const q = c.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(255,236,170,${.25 + .15 * Math.sin(t * 4 + i)})`); q.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = q; c.fillRect(x - r, y - r, r * 2, r * 2); } c.restore(); } },
  { id: 'vapor', year: 2011, label: '2011', name: 'Vaporwave', char: 'duo', duo: ['#2a0a5a', '#7af4f0'],
    P: { wall: ['#2a0a4a', '#8a2a8a'], floor: ['#1a0a3a', '#3a0a5a'], sky: ['#f45ab0', '#f4c060'], frame: '#7af4f0', table: '#f45ab0', ink: '#7af4f0', tag: '#7af4f0', tagFont: 'italic bold 64px Georgia, serif', steam: 'rgba(122,244,240,.6)' },
    sky(g, x, y, w, h, t) { const cx = x + w / 2, cy = y + h * .62, r = 90; g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip(); g.fillStyle = lgr(g, 0, cy - r, 0, cy + r, [[0, '#f4e060'], [1, '#f45a8a']]); g.fillRect(cx - r, cy - r, r * 2, r * 2); g.fillStyle = '#f45ab0'; for (let k = 0; k < 6; k++) { const yy = cy + (k * 16 + (t * 20) % 16); g.fillRect(cx - r, yy, r * 2, 4 + k); } g.restore(); },
    decor(g, P, t) { g.strokeStyle = '#f45ab0'; g.lineWidth = 2; const hz = FLOOR; for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(DW / 2 + i * 40, hz); g.lineTo(DW / 2 + i * 260, DH); g.stroke(); } for (let k = 0; k < 9; k++) { const q = ((k + t * .8) % 9) / 9, y = hz + q * q * (DH - hz); g.beginPath(); g.moveTo(0, y); g.lineTo(DW, y); g.stroke(); }
      g.fillStyle = '#7af4f0'; g.font = 'bold 54px sans-serif'; g.fillText('カフェ', 700, 260); },
    render(c, b, t, W, H) { c.drawImage(b, 0, 0); const sh = Math.sin(t * 13) > .92 ? 6 : 0; if (sh) { c.globalCompositeOperation = 'screen'; c.globalAlpha = .5; c.drawImage(b, sh, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); } },
  { id: 'flat', year: 2026, label: '2026', name: 'Flat illustration — now', char: 'none',
    P: { wall: ['#fbeee4', '#f8e4d6'], floor: ['#f2c8b0', '#e8b498'], sky: ['#9cc8f0', '#d8ecf8'], frame: '#fff', table: '#e2592d', cloth: '#fff', ink: '#201e1f', hill: '#69b488', tree: '#4f9a6a', tag: '#e2592d', tagFont: 'bold 64px Helvetica, Arial, sans-serif' },
    decor(g, P, t) { const sw = Math.sin(t * 1.2) * .06; g.save(); g.translate(1480, 600); g.fillStyle = '#e2592d'; g.fillRect(-36, 0, 72, 70); for (let k = 0; k < 6; k++) { g.save(); g.rotate(-1.3 + k * .5 + sw); g.fillStyle = k % 2 ? '#2f8a5a' : '#4fb07a'; g.beginPath(); g.ellipse(0, -70, 20, 60, 0, 0, TAU); g.fill(); g.restore(); } g.restore();
      g.strokeStyle = '#201e1f'; g.lineWidth = 3; g.beginPath(); g.moveTo(760, 0); g.lineTo(760, 140); g.stroke(); g.fillStyle = '#f8d867'; g.beginPath(); g.arc(760, 170, 40, Math.PI, 0); g.fill(); const gl = .5 + .5 * Math.sin(t * 2); g.fillStyle = `rgba(248,216,103,${.25 + .15 * gl})`; g.beginPath(); g.moveTo(720, 170); g.lineTo(800, 170); g.lineTo(900, 560); g.lineTo(620, 560); g.fill(); },
    render(c, b) { c.drawImage(b, 0, 0); } },
];
const SEURAT = ['#1a2a58', '#2f5fa8', '#5d9dc5', '#a6d0ea', '#f8f4e8', '#f8d867', '#f08a2a', '#2f8a5a', '#a8c83a', '#e8b4d0', '#c8402a', '#7a4a2a'];
const NES = ['#000000', '#fcfcfc', '#5c94fc', '#9cfcf0', '#00a800', '#c84c0c', '#7c3c00', '#fcd800', '#f8b8a0', '#a4e4fc', '#e45c10', '#fca044', '#bcbcbc', '#3cbcfc', '#d82800', '#503000'];

/* ---------- one frame ---------- */
function frame(g, era, spr, t) {
  const P = era.P; roomBase(g, P, t);
  if (era.arch) { const [x, y, w, h] = WIN; g.save(); g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + 90); g.quadraticCurveTo(x + w / 2, y - 80, x + w, y + 90); g.lineTo(x + w, y + h); g.closePath(); g.clip(); windowView(g, P, t, era.sky); g.restore(); }
  else if (!era.noWindow) windowView(g, P, t, era.sky);
  era.decor(g, P, t);
  theCat(g, t, era.id === 'kusama' || era.id === 'nes' ? 'hop' : era.id === 'rembrandt' || era.id === 'ink' ? 'sleep' : 'sit');
  her(g, spr, t, P);
  table(g, P);                                     // in front of her: the cloth hides where her picture ends
  yearTag(g, era, P);
}

/* ---------- player: hero (live), transitions between eras, speedrun on a 128 BPM grid ---------- */
export function mountAges(host, { base = './', onEra } = {}) {
  const cv = off(10, 10), ctx = cv.getContext('2d'), b = off(10, 10), bg = b.getContext('2d', { willReadFrequently: true }), prevC = off(10, 10);
  cv.className = 'ages-cv'; host.appendChild(cv);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = ERAS.length - 1, prev = -1, tChange = 0, raf = 0, last = -1, visible = true, im = null, run = null;
  const t0 = performance.now();
  const size = () => { const r = host.getBoundingClientRect(), s = Math.min(1.25, Math.sqrt(620000 / Math.max(1, r.width * r.height))); W = Math.max(320, r.width * s | 0); H = Math.max(180, r.height * s | 0); for (const c of [cv, b, prevC]) { c.width = W; c.height = H; } last = -1; };
  const paint = (c, era, t) => { bg.setTransform(W / DW, 0, 0, H / DH, 0, 0); bg.imageSmoothingEnabled = true; frame(bg, era, im && repaint(im, era), t); bg.setTransform(1, 0, 0, 1, 0, 0); c.save(); era.render(c, b, t, W, H); c.restore(); };
  const draw = t => {
    const p = prev < 0 ? 1 : clamp((t - tChange) / .7);
    if (p < 1) {                                                   // the incoming era grows over the old one — tiles, dots or a brushed wipe
      const pc = prevC.getContext('2d'); paint(pc, ERAS[prev], t); paint(ctx, ERAS[cur], t);
      const kind = ERAS[cur].id; ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = '#000'; ctx.beginPath();
      if (kind === 'roman' || kind === 'klimt' || kind === 'nes') { const n = 16, cw = W / n, ch = H / 9; for (let j = 0; j < 9; j++) for (let i = 0; i < n; i++) if (hash(i, j) < p * 1.15) ctx.rect(i * cw, j * ch, cw + 1, ch + 1); }
      else if (kind === 'seurat' || kind === 'kusama' || kind === 'pop') { const s = W / 40; for (let y = 0; y < H + s; y += s) for (let x = 0; x < W + s; x += s) { const r = s * .75 * ss(hash(x | 0, y | 0) * .6, hash(x | 0, y | 0) * .6 + .4, p); if (r > 0) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } } }
      else { const x = (p * 1.3 - .15) * W; ctx.moveTo(0, 0); ctx.lineTo(x + 60, 0); for (let y = 0; y <= H; y += H / 12) ctx.lineTo(x - (y / H) * 120 + Math.sin(y * .05 + t * 6) * 18, y); ctx.lineTo(0, H); }
      ctx.fill(); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.drawImage(prevC, 0, 0); ctx.restore();
    } else { prev = -1; paint(ctx, ERAS[cur], t); }
  };
  const frameLoop = now => {
    raf = requestAnimationFrame(frameLoop); if (!visible || document.hidden) return;
    const t = (now - t0) / 1000;
    if (run) { const beat = 60 / 128, step = run.steps[run.i]; if (t >= run.next) { run.i++; if (run.i >= ERAS.length) { run = null; onEra && onEra(cur, false); } else { go(run.i); run.next = t + run.steps[run.i] * beat; } } }
    const fr = Math.floor(t * 10); if (fr === last) return; last = fr; draw(fr / 10);
  };
  const go = j => { j = (j + ERAS.length) % ERAS.length; if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = Math.floor((performance.now() - t0) / 100) / 10; last = -1; onEra && onEra(cur, !!run); if (reduce) draw(6); };
  size(); loadHer(base).then(x => { im = x; last = -1; if (reduce) draw(6); });
  const ro = new ResizeObserver(() => { size(); if (reduce) draw(6); }), io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) draw(6); else raf = requestAnimationFrame(frameLoop);
  return {
    go, get era() { return cur; },
    speedrun() { if (reduce) return; const n = ERAS.length; const steps = ERAS.map((_, i) => i === n - 1 ? 8 : Math.max(1, Math.round(6 - i * 5 / (n - 2)))); cur = -1; prev = -1; go(0); run = { i: 0, steps, next: (performance.now() - t0) / 1000 + steps[0] * 60 / 128 }; },
    stopRun() { run = null; },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}
/* small stills for the filmstrip (drawn once each) */
export async function thumbs(base = './', w = 320, h = 180) {
  const im = await loadHer(base), out = [];
  for (const era of ERAS) { const c = off(w, h), g = c.getContext('2d'), b = off(w, h), bg = b.getContext('2d', { willReadFrequently: true }); bg.setTransform(w / DW, 0, 0, h / DH, 0, 0); frame(bg, era, im && repaint(im, era), 3); bg.setTransform(1, 0, 0, 1, 0, 0); era.render(g, b, 3, w, h); out.push(c); }
  return out;
}
