/* Health · the vision story as one hand-painted anime room, five moments of a life (Ghibli-style watercolour).
   Technique after huashu-art-motion's 25_ghibli recipe (MIT): paper → watercolour washes (deformed polygons,
   thin multiply layers, pigment edge) → curtains that billow in gusts, komorebi light on the wall, grass outside
   moving in waves → characters in two-tone cel shading (base + a crescent of shade cut by shifting the shape
   toward the light) with a warm brown line.
   The room is a fixed skeleton (huashu "speedrun" rule: the eye needs anchors); what changes per chapter is
   the light, the view through the window and what Minh and her cat are doing:
     I   morning stretch at the open window       II  yoga — tree pose, the cat copies her
     III skipping rope, the cat chases the yarn    IV  night — asleep in the armchair, cat curled up
     V   eighty — white hair, tea in the golden afternoon, the old cat beside her
   Minh is her own character art (poses/*.webp) used as a puppet; the cat and room are drawn in code.
   The still room is cached per chapter; only living parts are drawn each frame, at 12 fps ("on twos"). */
import { TAU, clamp, lerp, ss, rng, hash, noise, watercolor, ellipsePts } from './core.js';

const DW = 1000, DH = 1000, FLOOR = 640, LINE = '#5a3a2c';
const wash = watercolor, el = ellipsePts;
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const lgr = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
const disc = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const WIN = [150, 150, 300, 330];                       // window opening (x, y, w, h)

/* ---------- cel shading + limbs (after huashu RIG.limb / cel) ---------- */
function limb(A, B, wA, wB) {
  const p = new Path2D(), a = Math.atan2(B[1] - A[1], B[0] - A[0]), n = a + Math.PI / 2;
  p.moveTo(A[0] + Math.cos(n) * wA / 2, A[1] + Math.sin(n) * wA / 2);
  p.lineTo(B[0] + Math.cos(n) * wB / 2, B[1] + Math.sin(n) * wB / 2);
  p.arc(B[0], B[1], wB / 2, n, n - Math.PI, true);
  p.lineTo(A[0] - Math.cos(n) * wA / 2, A[1] - Math.sin(n) * wA / 2);
  p.arc(A[0], A[1], wA / 2, n - Math.PI, n - 2 * Math.PI, true);
  p.closePath(); return p;
}
const poly = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
const ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, TAU); return p; };
function cel(g, path, base, shade, dx = 8, dy = 5, line = true, lw = 2.4) {
  g.fillStyle = shade; g.fill(path);
  g.save(); g.clip(path); g.translate(-dx, -dy); g.fillStyle = base; g.fill(path); g.restore();
  if (line) { g.strokeStyle = LINE; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(path); }
}
function ik(S, T, a, b, bend) {
  const dx = T[0] - S[0], dy = T[1] - S[1], d = Math.min(Math.hypot(dx, dy), a + b - 0.01);
  const ang = Math.atan2(dy, dx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), e = ang + bend * Math.acos(cosA);
  return [S[0] + Math.cos(e) * a, S[1] + Math.sin(e) * a];
}
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const lerp2 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

/* ---------- Minh: her own character art, used as a puppet (human-md style) ----------
   The sprites are the drawn character from the site (poses/*.webp, cut at the thigh), so she stands in the
   foreground with the cut below the frame. Motion is puppetry: breathing, sway around the feet, hops with
   squash & stretch, pose swaps on a "pop". The window light is laid over her (source-atop) so she sits in
   the room's light; at night and at sunset the room tint covers her too. */
const IMG = {};
const SPRITES = { stand: 'poses/stand.webp', wave: 'poses/wave.webp', yoga: 'poses/yoga.webp', laugh: 'poses/laugh.webp', walk: 'poses/walk.webp', read: 'poses/read.webp', heart: 'poses/heart.webp', old: 'poses/her-old.webp' };
function loadSprites(base) { for (const [k, src] of Object.entries(SPRITES)) if (!IMG[k]) { const im = new Image(); im.decoding = 'async'; im.src = base + src; IMG[k] = im; } }
const SPR = off(10, 10);
function puppet(g, key, x, bottom, h, { rot = 0, sx = 1, sy = 1, light = 'rgba(255,236,190,.22)', from = 'left' } = {}) {
  const im = IMG[key]; if (!im || !im.complete || !im.naturalWidth) return;
  const w = h * im.naturalWidth / im.naturalHeight;
  // shadow on the floor
  g.save(); g.fillStyle = 'rgba(70,40,20,.18)'; g.beginPath(); g.ellipse(x, Math.min(bottom, 925), w * .34, 16, 0, 0, TAU); g.fill(); g.restore();
  // window light laid over the sprite only
  const m = g.getTransform(), S = Math.hypot(m.a, m.b), pw = Math.max(2, Math.round(w * S)), ph = Math.max(2, Math.round(h * S));
  if (SPR.width !== pw || SPR.height !== ph) { SPR.width = pw; SPR.height = ph; }
  const c = SPR.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, pw, ph); c.drawImage(im, 0, 0, pw, ph);
  if (light) { c.globalCompositeOperation = 'source-atop'; const q = c.createLinearGradient(from === 'left' ? 0 : pw, 0, from === 'left' ? pw : 0, 0); q.addColorStop(0, light); q.addColorStop(.6, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect(0, 0, pw, ph); }
  g.save(); g.translate(x, bottom); g.rotate(rot); g.scale(sx, sy); g.drawImage(SPR, -w / 2, -h, w, h); g.restore();
}
/* ---------- the cat (orange & white, cel) ---------- */
function cat(g, x, y, s, { pose = 'sit', t = 0, old = false }) {
  const O = old ? '#e8a868' : '#f3a24c', OS = old ? '#c88a52' : '#d27a2c', Wt = '#fffaf2', WS = '#e2d8ca';
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const blink = (t % 3.1) > 2.95, tail = Math.sin(t * 2.6) * .35;
  if (pose === 'sleep') {
    const br = 1 + Math.sin(t * 1.6) * .03, body = ell(0, -26, 70 * br, 38 * br);
    cel(g, body, O, OS, 10, 6); g.save(); g.clip(body); g.strokeStyle = '#c8682a'; g.lineWidth = 7; [-6, 16, 38].forEach(k => { g.beginPath(); g.moveTo(k, -64); g.lineTo(k + 10, -40); g.stroke(); }); g.restore();
    g.strokeStyle = LINE; g.lineWidth = 16; g.beginPath(); g.arc(0, -20, 62, .2, 1.9); g.stroke(); g.strokeStyle = O; g.lineWidth = 11; g.stroke();
    cel(g, ell(-44, -30, 28, 24), O, OS, 5, 4); g.fillStyle = Wt; g.beginPath(); g.ellipse(-50, -20, 16, 11, 0, 0, TAU); g.fill();
    [[-60, -50], [-30, -52]].forEach(([ex, ey]) => { const p = poly([[ex - 9, ey + 10], [ex, ey - 8], [ex + 9, ey + 10]]); cel(g, p, O, OS, 2, 1, true, 2); });
    g.strokeStyle = LINE; g.lineWidth = 2.2; [-54, -36].forEach(ex => { g.beginPath(); g.arc(ex, -32, 5, .3, Math.PI - .3); g.stroke(); });
    g.restore(); return;
  }
  let body = ell(0, -50, 46, 52), head = [0, -118], low = 0;
  if (pose === 'stretch') { const q = .5 + .5 * Math.sin(t * 1.4); low = q; body = ell(-6 * q, -50 + 14 * q, 46 + 26 * q, 52 - 18 * q, -.25 * q); head = [-60 * q, -118 + 70 * q]; }
  if (pose === 'hop') { const lift = Math.abs(Math.sin(t * 5.5)) * 40; g.translate(0, -lift); g.scale(1 - lift / 400, 1 + lift / 400); }
  g.strokeStyle = LINE; g.lineWidth = 17; g.beginPath(); g.moveTo(30, -14); g.quadraticCurveTo(80 + tail * 40, -20, 76 + tail * 70, -70 - low * 20); g.stroke(); g.strokeStyle = O; g.lineWidth = 12; g.stroke();
  cel(g, body, O, OS, 14, 8);
  g.save(); g.clip(body); g.strokeStyle = '#c8682a'; g.lineWidth = 7; [-26, -8, 10].forEach(k => { g.beginPath(); g.moveTo(30, -70 + k * 1.4); g.lineTo(46, -60 + k * 1.4); g.stroke(); }); cel(g, ell(-8, -36, 24, 34), Wt, WS, 5, 4, false); g.restore();
  [-18, 6].forEach(px => cel(g, limb([px - low * 30, -26 + low * 6], [px - low * 50, 0], 16, 16), Wt, WS, 3, 2));
  g.save(); g.translate(...head);
  const hd = ell(0, 0, 44, 38);
  [[-28, -30], [28, -30]].forEach(([ex, ey], k) => { const p = poly([[ex - 14 + k * 6, ey + 14], [ex + (k ? 8 : -8), ey - 22], [ex + 16 - k * 6, ey + 10]]); cel(g, p, O, OS, 3, 2); g.fillStyle = '#f2a8a0'; g.beginPath(); g.moveTo(ex - 6 + k * 3, ey + 8); g.lineTo(ex + (k ? 6 : -6), ey - 12); g.lineTo(ex + 8 - k * 3, ey + 6); g.fill(); });
  cel(g, hd, O, OS, 9, 6);
  g.save(); g.clip(hd); g.fillStyle = Wt; g.beginPath(); g.ellipse(0, 22, 26, 20, 0, 0, TAU); g.fill(); g.restore();
  g.strokeStyle = '#c8682a'; g.lineWidth = 5; [-10, 0, 10].forEach(k => { g.beginPath(); g.moveTo(k, -36); g.lineTo(k * 1.2, -24); g.stroke(); });
  [-16, 16].forEach(ex => { if (blink || (old && (t % 5) > 3.6)) { g.strokeStyle = LINE; g.lineWidth = 2.6; g.beginPath(); g.arc(ex, -2, 6, .25, Math.PI - .25); g.stroke(); }
    else { g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(ex, -2, 5, 7, 0, 0, TAU); g.fill(); disc(g, ex - 1.5, -5, 2, '#fff'); } });
  disc(g, 0, 10, 4, '#d8746a'); g.strokeStyle = LINE; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-6, 16); g.quadraticCurveTo(0, 20, 6, 16); g.stroke();
  g.lineWidth = 1.2; [[-14, 12, -40, 8], [-14, 16, -38, 20], [14, 12, 40, 8], [14, 16, 38, 20]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
  g.restore(); g.restore();
}

/* ---------- the room (cached per chapter) ---------- */
const LIGHT = [
  { wall: ['#fbf1dc', '#f0dcb4', '#d8bf92'], sky: ['#8ac4e8', '#fbe6c0'] },     // morning
  { wall: ['#fbf3e2', '#f2e0bc', '#dcc49a'], sky: ['#3f8fd0', '#cfe8f2'] },     // windy day
  { wall: ['#fdf4de', '#f4e2b8', '#e0c690'], sky: ['#5aa8e0', '#e2f2f4'] },     // bright noon
  { wall: ['#7f8aa0', '#5f6a84', '#3f4a62'], sky: ['#13314a', '#3f6f8a'] },     // night
  { wall: ['#fbe0b8', '#f0c890', '#d8a26a'], sky: ['#f2a27f', '#fbe0a8'] },     // golden afternoon
];
function room(g, j) {
  const L = LIGHT[j], r = rng(40 + j), night = j === 3;
  const wl = g.createRadialGradient(300, 300, 60, 420, 360, 900); wl.addColorStop(0, L.wall[0]); wl.addColorStop(.6, L.wall[1]); wl.addColorStop(1, L.wall[2]);
  g.fillStyle = wl; g.fillRect(0, 0, DW, FLOOR + 10);
  for (let i = 0; i < 18; i++) wash(g, el(r() * DW, r() * FLOOR, 60 + r() * 110, 40 + r() * 80, 12), ['#f3d9a8', '#cfdce8', '#f2c9c0', '#d8e8c0'][i % 4], { layers: 3, alpha: night ? .03 : .045, amp: 40, seed: 300 + i, edge: 0 });
  wash(g, rect(-10, FLOOR - 90, DW + 20, 90), night ? '#4a4a5a' : '#b8865a', { layers: 3, alpha: .5, amp: 3, seed: 7, edge: .14, blend: 'source-over' });
  g.strokeStyle = 'rgba(90,60,40,.35)'; g.lineWidth = 2; for (let x = 20; x < DW; x += 46) { g.beginPath(); g.moveTo(x, FLOOR - 88); g.lineTo(x, FLOOR); g.stroke(); }
  g.fillStyle = night ? '#3a3a4a' : '#9a6a44'; g.fillRect(0, FLOOR, DW, DH - FLOOR);
  for (let k = 0; k < 9; k++) wash(g, rect(-10, FLOOR + k * 42, DW + 20, 42), night ? (k % 2 ? '#41405a' : '#38364e') : (k % 2 ? '#a87650' : '#94643e'), { layers: 2, alpha: .55, amp: 3, seed: 60 + k, edge: .14, blend: 'source-over' });
  wash(g, el(560, 900, 320, 64, 24), night ? '#6a5a7a' : '#c9a5f8', { layers: 4, alpha: .55, amp: 6, seed: 9, edge: .2, blend: 'source-over' });   // rug
  wash(g, el(560, 900, 260, 46, 24), night ? '#7a6a8a' : '#e2c8fb', { layers: 3, alpha: .45, amp: 5, seed: 10, edge: .15, blend: 'source-over' });
  g.fillStyle = '#6a4a34'; g.fillRect(690, 250, 240, 12);                                                     // shelf + jars
  [['#6aa6a0', 30, 44], ['#e2a84a', 24, 34], ['#8fb66a', 22, 50], ['#e2592d', 28, 36]].forEach(([c, w, h], k) => wash(g, rect(710 + k * 54, 250 - h, w, h), c, { layers: 2, alpha: .85, amp: 2, seed: 70 + k, edge: .2, blend: 'source-over' }));
  wash(g, rect(890, 560, 54, 60), '#c87a4a', { layers: 2, alpha: .9, amp: 2, seed: 79, edge: .2, blend: 'source-over' });   // plant pot + leaves
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .34, cx = 917 + Math.cos(a) * 46, cy = 556 + Math.sin(a) * 52;
    g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); wash(g, el(0, 0, 13, 34, 10), k % 2 ? '#4f8f3a' : '#6aaa48', { layers: 2, alpha: .8, amp: 3, seed: 80 + k, edge: .2, blend: 'source-over' }); g.restore(); }
  if (night) {                                                                                                 // the armchair + floor lamp
    wash(g, [[420, 590], [700, 590], [716, 840], [404, 840]], '#8a5a6a', { layers: 3, alpha: .8, amp: 4, seed: 91, edge: .2, blend: 'source-over' });
    wash(g, [[372, 680], [450, 650], [462, 880], [372, 880]], '#7a4a5a', { layers: 3, alpha: .85, amp: 3, seed: 92, edge: .2, blend: 'source-over' });
    wash(g, [[670, 650], [748, 680], [748, 880], [658, 880]], '#7a4a5a', { layers: 3, alpha: .85, amp: 3, seed: 93, edge: .2, blend: 'source-over' });
    g.fillStyle = '#3a2a22'; g.fillRect(806, 420, 8, 300); g.fillRect(780, 716, 60, 8);
    wash(g, [[760, 380], [860, 380], [836, 432], [784, 432]], '#f2c46a', { layers: 2, alpha: .95, amp: 2, seed: 94, edge: .2, blend: 'source-over' });
  } else {                                                                                                     // small table with a cloth
    wash(g, [[740, 560], [950, 560], [956, 600], [734, 600]], '#fffdf6', { layers: 2, alpha: .95, amp: 3, seed: 95, edge: .25, blend: 'source-over' });
    g.fillStyle = '#6a4a34'; g.fillRect(760, 600, 12, 130); g.fillRect(918, 600, 12, 130);
  }
  const [wx, wy, ww, wh] = WIN;                                                                                // window: frame + sill
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(wx, wy, ww, wh); g.restore();
  g.strokeStyle = night ? '#c8c4cc' : '#f6f1e6'; g.lineWidth = 14; g.strokeRect(wx, wy, ww, wh); g.lineWidth = 8; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .45); g.lineTo(wx + ww, wy + wh * .45); g.stroke();
  g.fillStyle = night ? '#a8a4ac' : '#efe6d4'; g.fillRect(wx - 30, wy + wh + 4, ww + 60, 18);
  const pr = rng(5); g.save(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 2800; i++) { g.fillStyle = `rgba(120,100,70,${pr() * .07})`; g.fillRect(pr() * DW, pr() * DH, 1 + pr() * 2, 1 + pr() * 2); } g.restore();
}
const CLOUDS = new Map();
function cloud(w, h, seed, belly = 'rgba(140,175,215,.5)', top = '#ffffff') {
  const key = [w, h, seed, belly, top].join(); if (CLOUDS.has(key)) return CLOUDS.get(key);
  const c = off(w, h), g = c.getContext('2d'), r = rng(seed), puffs = [];
  for (let i = 0; i < 14; i++) { const x = w * (0.16 + r() * 0.68), y = h * 0.62 - Math.sin((x / w) * Math.PI) * h * (0.24 + r() * 0.26); puffs.push([x, y, Math.min(w * (0.08 + r() * 0.08), h * .3)]); }
  puffs.push([w * .5, h * .6, Math.min(w * .24, h * .3)]);
  puffs.forEach(([x, y0, rr], i) => { const y = clamp(y0, rr * 1.05, h - rr * 1.05); wash(g, el(x, y, rr, rr * .84, 14), top, { layers: 3, alpha: .92, amp: rr * .08, seed: seed + i, edge: 0, blend: 'source-over' }); });
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = lgr(g, 0, h * .3, 0, h, [[0, 'rgba(150,175,205,0)'], [1, belly]]); g.fillRect(0, 0, w, h); g.restore();
  CLOUDS.set(key, c); return c;
}
function view(g, j, t) {                                   // what the window shows, live
  const [wx, wy, ww, wh] = WIN, L = LIGHT[j];
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  g.fillStyle = lgr(g, 0, wy, 0, wy + wh, [[0, L.sky[0]], [1, L.sky[1]]]); g.fillRect(wx, wy, ww, wh);
  if (j === 3) { const r = rng(3); for (let i = 0; i < 40; i++) { const x = wx + r() * ww, y = wy + r() * wh * .6, a = .4 + .6 * (.5 + .5 * Math.sin(t * (1 + r() * 2) + i)); disc(g, x, y, .8 + r() * 1.4, `rgba(255,250,220,${a})`); }
    disc(g, wx + ww * .7, wy + 70, 30, '#fbf3d8'); }
  else if (j === 4) disc(g, wx + ww * .3, wy + wh * .55, 40, 'rgba(255,240,190,.95)');
  else if (j === 0) { const sg = g.createRadialGradient(wx + ww * .75, wy + wh * .6, 4, wx + ww * .75, wy + wh * .6, 160); sg.addColorStop(0, 'rgba(255,240,190,.95)'); sg.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = sg; g.fillRect(wx, wy, ww, wh); }
  if (j !== 3) g.drawImage(cloud(200, 110, 11 + j, j === 4 ? 'rgba(226,89,45,.4)' : undefined, j === 4 ? '#ffe2c8' : '#ffffff'), wx - 120 + ((t * (8 + j * 3)) % (ww + 240)), wy + 30);
  g.fillStyle = j === 3 ? '#2f5a4a' : j === 4 ? '#c8b060' : '#9cc68a'; g.beginPath(); g.moveTo(wx, wy + wh * .72); for (let x = 0; x <= ww; x += 10) g.lineTo(wx + x, wy + wh * .66 - Math.sin(x * .02 + 1) * 18); g.lineTo(wx + ww, wy + wh); g.lineTo(wx, wy + wh); g.fill();
  g.fillStyle = j === 3 ? '#24483a' : j === 4 ? '#b8a050' : '#7fb84a'; g.fillRect(wx, wy + wh * .8, ww, wh * .2);
  const bend = j === 1 ? .1 + .08 * Math.sin(t * 2.2) : .02 * Math.sin(t * 1.2);                       // the tree outside bends harder in II
  g.save(); g.translate(wx + ww * .72, wy + wh * .82); g.rotate(bend); g.fillStyle = '#4a3a2a'; g.fillRect(-6, -90, 12, 90);
  [[0, -120, 52], [-30, -100, 36], [30, -96, 38]].forEach(([x, y, rr], k) => wash(g, el(x, y, rr, rr * .8, 12), j === 3 ? '#1f3f32' : j === 4 ? '#7f8a3a' : (k ? '#3f7a3a' : '#5c9a3e'), { layers: 2, alpha: .8, amp: 6, seed: 120 + k, edge: .1, blend: 'source-over' }));
  g.restore();
  const r = rng(6 + j); g.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const x = wx + r() * ww, y = wy + wh * .82 + r() * wh * .18, h = 10 + r() * 18, wv = Math.sin(t * (j === 1 ? 4 : 2.6) - x * .03) * .5 + .5, sw = (.3 + wv * .7) * h * (j === 1 ? .9 : .5);
    g.strokeStyle = j === 3 ? '#2f5a42' : j === 4 ? ['#c8a85a', '#e8c46a', '#a8923a'][i % 3] : ['#5c9a3e', '#7fb84a', '#3f7a32'][i % 3];
    g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * .3, y - h * .6, x + sw, y - h); g.stroke(); }
  if (j === 2) { const kx = wx + ww * .3 + Math.sin(t * .8) * 20, ky = wy + 70 + Math.sin(t * 1.3) * 10; g.fillStyle = '#e83729'; g.beginPath(); g.moveTo(kx, ky - 18); g.lineTo(kx + 13, ky); g.lineTo(kx, ky + 16); g.lineTo(kx - 13, ky); g.fill(); }
  if (j === 3) for (let k = 0; k < 8; k++) { const x = wx + hash(k, 1) * ww + Math.sin(t * .7 + k) * 12, y = wy + wh * .7 + hash(k, 2) * wh * .25, p = Math.pow(.5 + .5 * Math.sin(t * 2.4 + k * 1.7), 3); disc(g, x, y, 3, `rgba(230,255,150,${p})`); }
  if (j === 4) for (let k = 0; k < 3; k++) { const x = wx + ww - ((t * 26 + k * 110) % (ww + 60)), y = wy + 60 + k * 22, w = Math.sin(t * 6 + k) * 4; g.strokeStyle = '#5a3a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y - w); g.quadraticCurveTo(x - 3, y - 5, x, y); g.quadraticCurveTo(x + 3, y - 5, x + 9, y - w); g.stroke(); }
  g.restore();
}
function curtains(g, j, t) {
  const [wx, wy, ww, wh] = WIN, force = j === 1 ? 1.5 : j === 3 ? .25 : .8, col = j === 3 ? '#c8ccd8' : '#ffffff';
  [-1, 1].forEach(side => {
    const gust = .5 + .5 * Math.sin(t * (j === 1 ? 5.4 : 3.2) + (side < 0 ? 0 : 1.3)), pts = [], N = 12, x0 = side < 0 ? wx - 40 : wx + ww + 40, inner = side < 0 ? wx + 40 : wx + ww - 40;
    for (let i = 0; i <= N; i++) { const q = i / N, y = wy - 20 + q * (wh + 40), bulge = q * q * (30 + 90 * gust) * force, w = Math.sin(t * 8 + q * 6 + side) * 10 * q * force; pts.push([inner + w + (side < 0 ? 1 : -1) * bulge * .5, y]); }
    for (let i = N; i >= 0; i--) { const q = i / N; pts.push([x0 + (side < 0 ? -1 : 1) * q * 20 * gust * force, wy - 20 + q * (wh + 40) + Math.sin(t * 6 + q * 4) * 3]); }
    g.save(); g.globalAlpha = j === 3 ? .55 : .8; wash(g, pts, col, { layers: 3, alpha: .42, amp: 3, seed: side < 0 ? 101 : 102, edge: 0, blend: 'source-over' }); g.restore();
  });
  g.fillStyle = '#6a4a34'; g.fillRect(wx - 70, wy - 26, ww + 140, 8);
}
function komorebi(g, j, t) {
  if (j === 3) return;
  g.save(); g.globalCompositeOperation = 'screen'; const r = rng(33), warm = j === 4 ? '255,200,120' : '255,236,170';
  for (let i = 0; i < 22; i++) { const bx = 480 + r() * 420, by = 120 + r() * 380, rr = 10 + r() * 24, x = bx + noise(i * 1.3, t * .9) * 22, y = by + noise(i * 2.1 + 5, t * .9) * 16, a = .14 + .2 * (.5 + .5 * Math.sin(t * 5 + i * 1.7));
    const q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, `rgba(${warm},${a})`); q.addColorStop(1, `rgba(${warm},0)`); g.fillStyle = q; g.beginPath(); g.ellipse(x, y, rr * 1.3, rr, .4, 0, TAU); g.fill(); }
  g.fillStyle = j === 4 ? 'rgba(255,190,110,.2)' : 'rgba(255,245,200,.18)';                          // the shaft of light onto the floor
  g.beginPath(); g.moveTo(WIN[0], WIN[1] + WIN[3]); g.lineTo(WIN[0] + WIN[2], WIN[1] + WIN[3]); g.lineTo(WIN[0] + WIN[2] + 260, DH); g.lineTo(WIN[0] + 120, DH); g.fill();
  g.restore();
}

/* ---------- the five moments ---------- */
const FOOT = 905, BOT = 1060, HH = 800;          // sprites stand with their thigh cut below the frame
const CH = [
  { // I · good morning: she greets the sun at the window, breathing in; the cat stretches
    actors(g, t) {
      const q = t % 8, wave = q > 3.2 && q < 6.4, pop = Math.max(0, 1 - Math.abs(q - 3.2) * 6) + Math.max(0, 1 - Math.abs(q - 6.4) * 6), br = Math.sin(t * 1.6) * .008;
      cat(g, 300, FOOT, .95, { pose: q > 2 && q < 6 ? 'stretch' : 'sit', t });
      puppet(g, wave ? 'wave' : 'stand', 640, BOT, HH, { rot: Math.sin(t * .8) * .012 - (wave ? .02 : 0), sx: 1 - pop * .03, sy: 1 + br + pop * .04 });
    },
  },
  { // II · tree pose, swaying like the tree outside; the cat copies her stretch
    actors(g, t) {
      const sway = Math.sin(t * 1.1) * .03, br = Math.sin(t * 1.3) * .01;
      cat(g, 300, FOOT, .95, { pose: 'stretch', t: t * .7 });
      puppet(g, 'yoga', 640, BOT, HH, { rot: sway, sy: 1 + br });
    },
  },
  { // III · she laughs and bounces, the cat chases the yarn
    actors(g, t) {
      const ph = (t * 1.4) % 1, air = Math.max(0, Math.sin(ph * TAU)), land = Math.max(0, -Math.sin(ph * TAU));
      const bx = 330 + Math.sin(t * .9) * 80; disc(g, bx, FOOT - 14, 14, '#c9a5f8'); g.strokeStyle = '#8f6ad0'; g.lineWidth = 2; g.beginPath(); g.arc(bx, FOOT - 14, 9, .5, 3.5); g.stroke();
      cat(g, bx - 74, FOOT, .9, { pose: 'hop', t });
      puppet(g, (t % 6) < 4 ? 'laugh' : 'walk', 650, BOT - air * 70, HH, { rot: Math.sin(t * 2.8) * .03, sx: 1 + land * .04 - air * .02, sy: 1 - land * .05 + air * .04 });
      for (let k = 0; k < 4; k++) { const p = (t * .4 + k / 4) % 1; g.globalAlpha = 1 - p; g.fillStyle = k % 2 ? '#e2592d' : '#f8d867'; g.font = `${26 + p * 10}px Georgia, serif`; g.fillText(k % 2 ? '♪' : '✦', 800 + k * 30 + Math.sin(t + k) * 10, 380 - p * 160); g.globalAlpha = 1; }
    },
  },
  { // IV · night — she has fallen asleep reading in the armchair; the cat curled up
    actors(g, t) {
      const br = Math.sin(t * 1.2), nod = Math.sin(t * .35) * .015;
      cat(g, 260, FOOT - 6, .95, { pose: 'sleep', t });
      puppet(g, 'read', 560, 1000, 700, { rot: nod - .02, sy: 1 + br * .008, light: 'rgba(255,190,110,.28)', from: 'right' });
      wash(g, [[380, 860], [740, 852], [760, 1010], [360, 1010]], '#f2c46a', { layers: 2, alpha: .85, amp: 4, seed: 7, edge: .2, blend: 'source-over' });   // blanket
      for (let k = 0; k < 3; k++) { const p = (t * .25 + k / 3) % 1; g.fillStyle = `rgba(255,255,255,${.9 - p * .9})`; g.font = `italic ${24 + p * 18}px Georgia, serif`; g.fillText('z', 680 + p * 60, 380 - p * 120); }
      g.save(); g.globalCompositeOperation = 'screen'; const lamp = g.createRadialGradient(810, 410, 10, 810, 410, 440); lamp.addColorStop(0, 'rgba(255,200,110,.34)'); lamp.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = lamp; g.fillRect(0, 0, DW, DH); g.restore();
    },
  },
  { // V · at eighty — silver hair, her tea in the golden afternoon, the old cat beside her
    actors(g, t) {
      const x = 660, br = Math.sin(t * 1.1) * .008, tilt = Math.sin(t * .5) * .015;
      wash(g, [[x - 150, 420], [x + 150, 420], [x + 144, 760], [x - 144, 760]], '#8a5a3a', { layers: 2, alpha: .9, amp: 2, seed: 61, edge: .2, blend: 'source-over' });   // tall chair back
      cat(g, 330, FOOT, .95, { pose: 'sit', t, old: true });
      puppet(g, 'old', x, BOT, HH, { rot: tilt, sy: 1 + br, light: 'rgba(255,200,120,.3)' });
      const w = HH * 880 / 1320, mx = x - w / 2 + w * .58, my = BOT - HH + HH * .47;                     // the mug in her hand
      for (let k = 0; k < 3; k++) { const p = (t * .5 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${.8 - p * .8})`; g.lineWidth = 3.5; g.beginPath(); g.moveTo(mx + k * 8 - 8, my - 10 - p * 40); g.quadraticCurveTo(mx + 10 + Math.sin(t * 3 + k) * 10, my - 30 - p * 50, mx + k * 8 - 6, my - 50 - p * 60); g.stroke(); }
      for (let k = 0; k < 12; k++) { const p = (t * .06 + hash(k, 4)) % 1, px = WIN[0] + 150 + p * 700 + Math.sin(t * 1.3 + k) * 20, py = WIN[1] + 200 + hash(k, 6) * 300 + p * 200; g.fillStyle = 'rgba(255,200,190,.9)'; g.beginPath(); g.ellipse(px, py, 5, 3, t + k, 0, TAU); g.fill(); }
    },
  },
];
const TINT = [null, null, null, 'rgba(70,90,150,.35)', 'rgba(255,170,90,.12)'];

/* ---------- player: one canvas; a chapter change blooms the new moment in like wet paint ---------- */
const fit = (W, H) => { const s = Math.max(W / DW, H / DH), ox = clamp(W / 2 - 560 * s, W - DW * s, 0), oy = (H - DH * s) * .6; return [s, ox, oy]; };
export function mountAnimeRoom(host, { budget = 460000, base = './' } = {}) {
  loadSprites(base);
  const cv = off(10, 10); cv.className = 'vcv'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d'), stills = {}, layer = off(10, 10), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = 0, prev = -1, tChange = 0, raf = 0, last = -1, visible = true, area = 0;
  const t0 = performance.now() - 3000;
  const size = () => { const r = host.getBoundingClientRect(); area = r.width * r.height; const s = Math.min(1.4, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(200, Math.round(r.height * s)); cv.width = layer.width = W; cv.height = layer.height = H; for (const k in stills) delete stills[k]; last = -1; };
  const still = j => { if (stills[j]) return stills[j]; const c = off(W, H), g = c.getContext('2d'), [s, ox, oy] = fit(W, H); g.setTransform(s, 0, 0, s, ox, oy); room(g, j); return (stills[j] = c); };
  const paint = (g, j, t) => {
    const [s, ox, oy] = fit(W, H);
    g.setTransform(s, 0, 0, s, ox, oy); view(g, j, t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(still(j), 0, 0);
    g.setTransform(s, 0, 0, s, ox, oy); curtains(g, j, t); komorebi(g, j, t); CH[j].actors(g, t);
    if (TINT[j]) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = TINT[j]; g.fillRect(0, 0, DW, DH); g.restore(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  const draw = t => {
    paint(ctx, cur, t);
    const p = prev < 0 ? 1 : clamp((t - tChange) / .9);
    if (p < 1) {
      const g2 = layer.getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W, H); paint(g2, prev, t);
      const R = Math.hypot(W, H) * ss(0, 1, p);
      wash(g2, el(W * .55, H * .55, R * .7 + 1, R * .6 + 1, 22), '#000', { layers: 3, alpha: .6, amp: 40, seed: 7, edge: 0, blend: 'destination-out' });
      ctx.globalAlpha = 1 - ss(.55, 1, p); ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
    } else prev = -1;
  };
  const frame = now => { raf = requestAnimationFrame(frame); if (!visible || document.hidden) return; const step = Math.floor((now - t0) / 1000 * 12); if (step === last) return; last = step; draw(step / 12); };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) { size(); if (reduce) draw(6); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) draw(6); else raf = requestAnimationFrame(frame);
  return {
    canvas: cv, style: 'Hand-painted anime room · Minh & her cat',
    chapter(j) { j = clamp(j, 0, CH.length - 1); if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = Math.floor((performance.now() - t0) / 1000 * 12) / 12; if (reduce) draw(6); },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}
