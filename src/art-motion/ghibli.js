/* Health · the vision story as five hand-painted anime landscapes (Ghibli-style watercolour backgrounds).
   Technique after huashu-art-motion's 25_ghibli recipe (MIT): paper → watercolour washes (deformed polygons,
   thin multiply layers, pigment edge) → opaque white cumulus with a blue-grey belly → grass that moves in
   gusts (a wave travels across the field) → small loops (laundry, gulls, a kite, fireflies, petals).
   Original compositions, no film characters: a small figure seen from afar is the only person.
   Static layers are cached per chapter and size; only the living parts are drawn each frame (12 fps). */
import { TAU, clamp, lerp, ss, rng, hash, noise, watercolor, ellipsePts } from './core.js';

const DW = 1000, DH = 1000;                         // design space; fitted to the canvas with "cover"
const wash = watercolor, el = ellipsePts;
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };

/* ---------- shared pieces ---------- */
function paper(g, seed) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(120,100,70,${r() * .06})`; g.fillRect(r() * DW, r() * DH, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 14; i++) wash(g, el(r() * DW, r() * DH, 60 + r() * 160, 40 + r() * 120, 12), ['#f3d9a8', '#cfe0e8', '#f2c9c0', '#d8e8c0'][i % 4], { layers: 2, alpha: .05, amp: 40, seed: seed + i, edge: 0 });
  g.restore();
}
const CLOUDS = new Map();
function cloud(w, h, seed, belly = 'rgba(140,175,215,.5)', top = '#ffffff') {
  const key = [w, h, seed, belly, top].join(); if (CLOUDS.has(key)) return CLOUDS.get(key);
  const c = off(w, h), g = c.getContext('2d'), r = rng(seed), puffs = [];
  for (let i = 0; i < 18; i++) { const x = w * (0.14 + r() * 0.72), y = h * 0.66 - Math.sin((x / w) * Math.PI) * h * (0.26 + r() * 0.3); puffs.push([x, y, Math.min(w * (0.07 + r() * 0.09), h * .3)]); }
  puffs.push([w * .5, h * .6, Math.min(w * .26, h * .3)]);   // keep every puff inside the sprite: no flat cut bottoms
  puffs.forEach(([x, y0, rr], i) => { const y = clamp(y0, rr * 1.05, h - rr * 1.05); wash(g, el(x, y, rr, rr * .84, 14), top, { layers: 3, alpha: .92, amp: rr * .08, seed: seed + i, edge: 0, blend: 'source-over' }); });
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = lg(g, 0, h * .3, 0, h, [[0, 'rgba(150,175,205,0)'], [1, belly]]); g.fillRect(0, 0, w, h); g.restore();
  CLOUDS.set(key, c); return c;
}
function hillShape(y0, amp, f, ph, seed) {
  const pts = [[-20, DH + 20]]; for (let x = -20; x <= DW + 20; x += 25) pts.push([x, y0 - Math.sin(x / DW * TAU * f + ph) * amp - noise(x * .006, seed) * amp * .6]); pts.push([DW + 20, DH + 20]); return pts;
}
function grass(g, t, { y0, y1, n, seed, cols, h0 = 14, h1 = 34, gust = 3.1, strength = 1, dir = 1 }) {
  const r = rng(seed); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * DW, y = y0 + r() * (y1 - y0), h = (h0 + r() * (h1 - h0)) * (0.6 + (y - y0) / (y1 - y0 + 1) * 0.8), ph = r() * TAU;
    const wind = Math.sin(t * gust - x * 0.012 * dir) * .5 + .5, sway = dir * ((0.25 + wind * .75) * h * .55 * strength + Math.sin(t * 8 + ph) * 1.6);
    g.strokeStyle = cols[i % cols.length]; g.lineWidth = 1.6 + r() * 2.2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway * .3, y - h * .6, x + sway, y - h); g.stroke();
  }
}
function treeSprite(seed, { trunk = '#4a3a2a', dark = '#2f5f30', mid = '#3f7a3a', light = '#8cc65a', w = 420, h = 460, warm }) {
  const key = 'tree' + seed + (warm || ''); if (CLOUDS.has(key)) return CLOUDS.get(key);
  const c = off(w, h), g = c.getContext('2d'), r = rng(seed), cx = w / 2;
  g.fillStyle = trunk; g.beginPath(); g.moveTo(cx - 22, h); g.quadraticCurveTo(cx - 8, h * .6, cx - 30, h * .42); g.lineTo(cx + 26, h * .42); g.quadraticCurveTo(cx + 10, h * .62, cx + 24, h); g.fill();
  for (let i = 0; i < 26; i++) { const x = cx + (r() - .5) * w * .78, y = h * .32 + (r() - .5) * h * .4, rr = 40 + r() * 52;
    wash(g, el(x, y, rr, rr * .8, 12), i % 3 ? mid : dark, { layers: 3, alpha: .62, amp: 10, seed: seed + i, edge: .15, blend: 'source-over' }); }
  for (let i = 0; i < 16; i++) { const x = cx - w * .1 + (r() - .5) * w * .6, y = h * .22 + (r() - .5) * h * .26, rr = 20 + r() * 26;
    wash(g, el(x, y, rr, rr * .7, 10), warm || light, { layers: 2, alpha: .5, amp: 6, seed: seed + 50 + i, edge: 0, blend: 'source-over' }); }
  CLOUDS.set(key, c); return c;
}
// a small figure seen from afar: hair in a bun, dress, cel shading — no film character
function figure(g, x, y, s, { dress = '#e2592d', pose = 'stand', t = 0, hair = '#3a2a22' } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const run = pose === 'run', k = run ? Math.sin(t * 14) : 0, lift = run ? Math.abs(Math.cos(t * 14)) * 3 : 0;
  g.translate(0, -lift);
  g.strokeStyle = '#f2cfae'; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(-3, -18); g.lineTo(-3 - k * 7, 0); g.moveTo(3, -18); g.lineTo(3 + k * 7, 0); g.stroke();   // legs
  g.fillStyle = dress; g.beginPath(); g.moveTo(-6, -40); g.lineTo(6, -40); g.lineTo(11, -16); g.lineTo(-11, -16); g.closePath(); g.fill();
  g.fillStyle = 'rgba(60,30,20,.25)'; g.beginPath(); g.moveTo(2, -40); g.lineTo(6, -40); g.lineTo(11, -16); g.lineTo(4, -16); g.closePath(); g.fill();
  g.strokeStyle = '#f2cfae'; g.lineWidth = 3;
  if (pose === 'stretch') { g.beginPath(); g.moveTo(-5, -38); g.lineTo(-11, -58); g.moveTo(5, -38); g.lineTo(11, -58); g.stroke(); }
  else if (pose === 'sit') { /* hands in lap */ }
  else { g.beginPath(); g.moveTo(-5, -37); g.lineTo(-9 + k * 6, -24); g.moveTo(5, -37); g.lineTo(9 - k * 6, -24); g.stroke(); }
  g.fillStyle = '#f2cfae'; g.beginPath(); g.arc(0, -47, 6.5, 0, TAU); g.fill();
  g.fillStyle = hair; g.beginPath(); g.arc(0, -48.5, 6.8, Math.PI * 1.05, Math.PI * 2.05); g.fill(); g.beginPath(); g.arc(-1, -55.5, 4, 0, TAU); g.fill();
  g.restore();
}
const fit = (W, H) => { const s = Math.max(W / DW, H / DH); return [s, (W - DW * s) / 2, (H - DH * s) * .65]; };

/* ---------- the five chapters ---------- */
const CH = [
  { // I · Morning on the hill — a healthy body is part of who I am
    still(g) {
      g.fillStyle = lg(g, 0, 0, 0, 620, [[0, '#7fbde6'], [.6, '#bfe0ef'], [1, '#fbe9c8']]); g.fillRect(0, 0, DW, DH);
      const sun = g.createRadialGradient(780, 430, 10, 780, 430, 360); sun.addColorStop(0, 'rgba(255,240,190,.95)'); sun.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = sun; g.fillRect(0, 0, DW, DH);
      wash(g, hillShape(560, 40, .7, 1, 2), '#8fb6a0', { layers: 3, alpha: .5, amp: 8, seed: 3, edge: .1, blend: 'source-over' });
      wash(g, hillShape(650, 55, .9, 2.4, 4), '#7fb84a', { layers: 4, alpha: .55, amp: 10, seed: 5, edge: .12, blend: 'source-over' });
      wash(g, hillShape(760, 40, 1.2, .3, 6), '#5c9a3e', { layers: 4, alpha: .6, amp: 10, seed: 7, edge: .12, blend: 'source-over' });
      // path
      g.fillStyle = 'rgba(238,214,160,.85)'; g.beginPath(); g.moveTo(330, DH); g.bezierCurveTo(420, 880, 560, 820, 640, 700); g.lineTo(668, 702); g.bezierCurveTo(610, 830, 520, 900, 470, DH); g.fill();
      // cottage
      const cx = 720, cy = 640; g.fillStyle = '#f6efe0'; g.fillRect(cx, cy - 70, 130, 70); g.fillStyle = '#c9553a'; g.beginPath(); g.moveTo(cx - 14, cy - 66); g.lineTo(cx + 65, cy - 126); g.lineTo(cx + 144, cy - 66); g.fill();
      g.fillStyle = '#8a5a3a'; g.fillRect(cx + 54, cy - 40, 22, 40); g.fillStyle = '#7fb6d8'; g.fillRect(cx + 16, cy - 50, 22, 18); g.fillRect(cx + 92, cy - 50, 22, 18);
      g.fillStyle = '#6a4a3a'; g.fillRect(cx + 100, cy - 140, 14, 40);
      paper(g, 11);
    },
    live(g, t) {
      g.drawImage(cloud(380, 220, 11), 60 + (t * 9) % 1300 - 250, 70); g.drawImage(cloud(260, 150, 23), 480 + (t * 13) % 1300 - 300, 150);
      for (let k = 0; k < 6; k++) { const q = (t * .35 + k / 6) % 1; g.fillStyle = `rgba(244,240,232,${.8 - q * .7})`; g.beginPath(); g.arc(827 + q * 40 + Math.sin(q * 6 + t) * 6, 498 - q * 120, 8 + q * 16, 0, TAU); g.fill(); }
      // laundry line: three sheets lift in the gusts
      g.strokeStyle = '#6a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(600, 560); g.quadraticCurveTo(650, 570, 700, 562); g.stroke();
      [610, 638, 666].forEach((x, k) => { const gust = .5 + .5 * Math.sin(t * 4.4 + k), b = 10 + gust * 16;
        g.fillStyle = k === 1 ? '#f2b8a8' : '#fbf8f0'; g.beginPath(); g.moveTo(x, 565); g.lineTo(x + 22, 565); g.quadraticCurveTo(x + 22 + b, 590, x + 18 + b * 1.2, 612); g.lineTo(x + b * .9, 610); g.quadraticCurveTo(x + b * .4, 590, x, 565); g.fill(); });
      grass(g, t, { y0: 780, y1: DH + 10, n: 520, seed: 5, cols: ['#5c9a3e', '#7fb84a', '#3f7a32', '#9ccc5a', '#4a8a3a'] });
      figure(g, 520, 852, 1.5, { pose: 'stretch', dress: '#e2592d' });
    },
  },
  { // II · Wind on the cliff — strong, enduring and supple
    still(g) {
      g.fillStyle = lg(g, 0, 0, 0, 600, [[0, '#3f8fd0'], [.7, '#9fd0ec'], [1, '#e2f2f4']]); g.fillRect(0, 0, DW, DH);
      g.drawImage(cloud(760, 520, 41, 'rgba(120,160,205,.55)'), 120, 40);
      g.fillStyle = lg(g, 0, 560, 0, 720, [[0, '#4f9ac8'], [1, '#2f6f9a']]); g.fillRect(0, 560, DW, 200);
      wash(g, [[-20, 640], [420, 600], [700, 640], [1020, 700], [1020, DH + 20], [-20, DH + 20]], '#6aa64a', { layers: 4, alpha: .6, amp: 14, seed: 9, edge: .12, blend: 'source-over' });
      wash(g, [[-20, 780], [400, 730], [760, 760], [1020, 820], [1020, DH + 20], [-20, DH + 20]], '#4f8f3a', { layers: 4, alpha: .6, amp: 12, seed: 10, edge: .12, blend: 'source-over' });
      wash(g, [[700, 640], [1020, 700], [1020, 760], [760, 730]], '#c9b48a', { layers: 3, alpha: .55, amp: 8, seed: 12, edge: .14, blend: 'source-over' });   // cliff face
      paper(g, 13);
    },
    live(g, t) {
      const r = rng(4); g.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 40; i++) { const x = r() * DW, y = 575 + r() * 150, a = .5 + .5 * Math.sin(t * 6 + i * 2.3); if (a > .6) g.fillRect(x, y, 6 + r() * 14, 2); }
      g.drawImage(cloud(260, 140, 47), (t * 16) % 1400 - 300, 380);
      // the lone tree bends with the gusts and springs back — supple
      const gust = .5 + .5 * Math.sin(t * 2.2), sp = treeSprite(21, {});
      g.save(); g.translate(330, 760); g.rotate(.05 + gust * .07 + Math.sin(t * 7) * .008); g.drawImage(sp, -210, -460); g.restore();
      // gulls glide on the wind
      for (let k = 0; k < 3; k++) { const x = (t * (40 + k * 12) + k * 300) % 1200 - 100, y = 250 + k * 60 + Math.sin(t * 1.5 + k) * 20, w = Math.sin(t * 5 + k) * 6;
        g.strokeStyle = '#3a4a5a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x - 14, y - w); g.quadraticCurveTo(x - 6, y - 8, x, y); g.quadraticCurveTo(x + 6, y - 8, x + 14, y - w); g.stroke(); }
      grass(g, t, { y0: 760, y1: DH + 10, n: 600, seed: 8, cols: ['#4f8f3a', '#7fb84a', '#3a7a30', '#a6cf62'], h0: 18, h1: 44, gust: 3.8, strength: 1.5 });
    },
  },
  { // III · Run, jump, carry, climb and play
    still(g) {
      g.fillStyle = lg(g, 0, 0, 0, 600, [[0, '#5aa8e0'], [1, '#d6eef4']]); g.fillRect(0, 0, DW, DH);
      g.drawImage(cloud(520, 320, 61), 420, 120); g.drawImage(cloud(300, 180, 67), 40, 230);
      wash(g, hillShape(600, 70, .6, 3, 8), '#9ccc5a', { layers: 4, alpha: .55, amp: 12, seed: 15, edge: .12, blend: 'source-over' });
      wash(g, hillShape(720, 50, 1.1, 1.2, 9), '#6aaa48', { layers: 4, alpha: .6, amp: 10, seed: 16, edge: .12, blend: 'source-over' });
      g.fillStyle = 'rgba(238,214,160,.9)'; g.beginPath(); g.moveTo(-20, 900); g.bezierCurveTo(300, 860, 520, 780, 1020, 760); g.lineTo(1020, 790); g.bezierCurveTo(560, 810, 320, 900, -20, 950); g.fill();
      g.drawImage(treeSprite(31, { w: 360, h: 420 }), 640, 300);
      paper(g, 17);
    },
    live(g, t) {
      // the swing under the tree
      const a = Math.sin(t * 2.4) * .5; g.save(); g.translate(800, 470); g.rotate(a);
      g.strokeStyle = '#6a4a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-18, 150); g.moveTo(18, 0); g.lineTo(18, 150); g.stroke(); g.fillStyle = '#8a5a3a'; g.fillRect(-26, 148, 52, 8); g.restore();
      // the runner holds the kite: run along the path, a little jump every couple of seconds
      const q = (t * .07) % 1, rx = lerp(60, 940, q), ry = lerp(905, 778, q) - Math.max(0, Math.sin(t * Math.PI / 1.1)) ** 6 * 26;
      const kx = rx - 160 + Math.sin(t * .7) * 30, ky = 170 + Math.sin(t * 1.3) * 18;
      g.strokeStyle = 'rgba(80,60,40,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(kx, ky + 30); g.quadraticCurveTo(kx + 40, ry - 300, rx + 10, ry - 34); g.stroke();
      g.fillStyle = '#e83729'; g.beginPath(); g.moveTo(kx, ky - 34); g.lineTo(kx + 24, ky); g.lineTo(kx, ky + 30); g.lineTo(kx - 24, ky); g.fill(); g.fillStyle = '#f8d867'; g.beginPath(); g.moveTo(kx, ky - 34); g.lineTo(kx + 24, ky); g.lineTo(kx, ky); g.fill();
      g.strokeStyle = '#e83729'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 10; i++) { const x = kx - i * 8, y = ky + 30 + i * 9 + Math.sin(t * 6 - i) * 6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      // butterflies + dandelion seeds
      for (let k = 0; k < 10; k++) { const q = (t * .06 + hash(k, 2)) % 1, x = q * 1100 - 50, y = 500 + hash(k, 3) * 300 + Math.sin(t * 2 + k) * 20; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); }
      grass(g, t, { y0: 820, y1: DH + 10, n: 480, seed: 9, cols: ['#5c9a3e', '#7fb84a', '#9ccc5a', '#4a8a3a'] });
      figure(g, rx, ry, 1.5, { pose: 'run', t, dress: '#e2592d' });
    },
  },
  { // IV · Deep sleep — night over the cottage
    still(g) {
      g.fillStyle = lg(g, 0, 0, 0, 760, [[0, '#13314a'], [.6, '#2f5a72'], [1, '#5f8a8a']]); g.fillRect(0, 0, DW, DH);
      const moon = g.createRadialGradient(720, 220, 10, 720, 220, 240); moon.addColorStop(0, 'rgba(255,248,220,.55)'); moon.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = moon; g.fillRect(0, 0, DW, DH);
      g.fillStyle = '#fbf3d8'; g.beginPath(); g.arc(720, 220, 52, 0, TAU); g.fill();
      g.drawImage(cloud(420, 200, 83, 'rgba(40,70,100,.85)', '#a9c4d0'), 380, 250);
      wash(g, hillShape(640, 50, .7, 1.5, 11), '#2f5a4a', { layers: 4, alpha: .7, amp: 10, seed: 21, edge: .1, blend: 'source-over' });
      wash(g, hillShape(760, 40, 1.1, .4, 12), '#24483a', { layers: 4, alpha: .75, amp: 10, seed: 22, edge: .1, blend: 'source-over' });
      const cx = 220, cy = 700; g.fillStyle = '#d8d2c0'; g.fillRect(cx, cy - 80, 150, 80); g.fillStyle = '#7a3a2e'; g.beginPath(); g.moveTo(cx - 14, cy - 76); g.lineTo(cx + 75, cy - 140); g.lineTo(cx + 164, cy - 76); g.fill();
      paper(g, 19);
    },
    live(g, t) {
      const r = rng(9);
      for (let i = 0; i < 70; i++) { const x = r() * DW, y = r() * 520, tw = .4 + .6 * (.5 + .5 * Math.sin(t * (1 + r() * 2) + i)); g.fillStyle = `rgba(255,250,225,${tw})`; g.beginPath(); g.arc(x, y, .8 + r() * 1.8, 0, TAU); g.fill(); }
      // the window glows, a curtain breathes
      const glow = .85 + .15 * Math.sin(t * 1.2); g.fillStyle = `rgba(255,200,110,${glow})`; g.fillRect(250, 645, 34, 28); g.fillRect(306, 645, 34, 28);
      g.fillStyle = 'rgba(255,240,210,.55)'; g.beginPath(); g.moveTo(250, 645); g.quadraticCurveTo(262 + Math.sin(t) * 3, 660, 252, 673); g.lineTo(250, 673); g.fill();
      const halo = g.createRadialGradient(295, 660, 4, 295, 660, 140); halo.addColorStop(0, `rgba(255,200,110,${.28 * glow})`); halo.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = halo; g.fillRect(150, 520, 300, 300);
      g.drawImage(cloud(240, 110, 89, 'rgba(40,70,100,.85)', '#9fb8c4'), (t * 6) % 1300 - 250, 120);
      grass(g, t, { y0: 800, y1: DH + 10, n: 380, seed: 12, cols: ['#1f3f32', '#2f5a42', '#3a6a4a'], gust: 1.4, strength: .5 });
      // fireflies drift and pulse
      for (let k = 0; k < 26; k++) { const x = 100 + hash(k, 1) * 820 + Math.sin(t * .6 + k) * 30, y = 700 + hash(k, 2) * 250 + Math.cos(t * .8 + k * 2) * 20, p = Math.pow(.5 + .5 * Math.sin(t * 2.4 + k * 1.7), 3);
        const f = g.createRadialGradient(x, y, 0, x, y, 14); f.addColorStop(0, `rgba(230,255,150,${p})`); f.addColorStop(1, 'rgba(230,255,150,0)'); g.fillStyle = f; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill(); }
    },
  },
  { // V · At eighty, still beautiful — golden hour under the old tree
    still(g) {
      g.fillStyle = lg(g, 0, 0, 0, 700, [[0, '#f2a27f'], [.55, '#f8d08a'], [1, '#fbe9c0']]); g.fillRect(0, 0, DW, DH);
      const sun = g.createRadialGradient(260, 560, 10, 260, 560, 420); sun.addColorStop(0, 'rgba(255,236,170,.95)'); sun.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = sun; g.fillRect(0, 0, DW, DH);
      g.fillStyle = '#fff4cf'; g.beginPath(); g.arc(260, 560, 46, 0, TAU); g.fill();
      g.drawImage(cloud(520, 200, 101, 'rgba(226,89,45,.45)', '#ffe2c8'), 340, 140);
      wash(g, hillShape(640, 40, .6, 2, 13), '#c8a85a', { layers: 4, alpha: .55, amp: 10, seed: 31, edge: .12, blend: 'source-over' });
      wash(g, hillShape(740, 60, 1, .7, 14), '#a8923a', { layers: 4, alpha: .6, amp: 12, seed: 32, edge: .12, blend: 'source-over' });
      paper(g, 23);
    },
    live(g, t) {
      const sp = treeSprite(41, { w: 560, h: 600, mid: '#5f7f3a', dark: '#3f5a2a', warm: '#e8b45a' });
      g.save(); g.translate(720, 780); g.rotate(Math.sin(t * .9) * .012); g.drawImage(sp, -280, -600); g.restore();
      // long shadow and the woman resting at the foot of the tree
      g.fillStyle = 'rgba(90,60,30,.25)'; g.beginPath(); g.ellipse(820, 790, 160, 14, 0, 0, TAU); g.fill();
      figure(g, 650, 784, 1.5, { pose: 'sit', dress: '#c9553a', hair: '#e8e2da' });
      // birds flying home
      for (let k = 0; k < 4; k++) { const x = 1050 - ((t * (30 + k * 6) + k * 260) % 1200), y = 260 + k * 30 + Math.sin(t + k) * 10, w = Math.sin(t * 6 + k) * 5;
        g.strokeStyle = '#5a3a2a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 11, y - w); g.quadraticCurveTo(x - 4, y - 6, x, y); g.quadraticCurveTo(x + 4, y - 6, x + 11, y - w); g.stroke(); }
      grass(g, t, { y0: 790, y1: DH + 10, n: 520, seed: 14, cols: ['#c8a85a', '#e8c46a', '#a8923a', '#f2d88a'], gust: 2.2, strength: 1.1 });
      // petals and golden dust drifting across the light
      for (let k = 0; k < 22; k++) { const q = (t * .05 + hash(k, 4)) % 1, x = 1050 - q * 1150 + Math.sin(t * 1.3 + k) * 20, y = 300 + hash(k, 6) * 520 + q * 120;
        g.fillStyle = k % 3 ? 'rgba(255,214,190,.9)' : 'rgba(255,240,180,.9)'; g.beginPath(); g.ellipse(x, y, 4.5, 2.6, t + k, 0, TAU); g.fill(); }
      const warm = g.createLinearGradient(0, 0, DW, DH); warm.addColorStop(0, 'rgba(255,200,120,.16)'); warm.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = warm; g.fillRect(0, 0, DW, DH);
    },
  },
];

/* ---------- player: one canvas, chapter changes cross-fade with a soft watercolour bloom ---------- */
export function mountGhibli(host, { budget = 460000 } = {}) {
  const cv = off(10, 10); cv.className = 'vcv'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d'), stills = {}, layer = off(10, 10), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = 0, prev = -1, tChange = 0, raf = 0, last = -1, visible = true, area = 0;
  const t0 = performance.now() - 3000;
  const size = () => { const r = host.getBoundingClientRect(); area = r.width * r.height; const s = Math.min(1, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(200, Math.round(r.height * s)); cv.width = layer.width = W; cv.height = layer.height = H; for (const k in stills) delete stills[k]; last = -1; };
  const still = j => { if (stills[j]) return stills[j]; const c = off(W, H), g = c.getContext('2d'), [s, ox, oy] = fit(W, H); g.setTransform(s, 0, 0, s, ox, oy); CH[j].still(g); return (stills[j] = c); };
  const paint = (g, j, t) => { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(still(j), 0, 0); const [s, ox, oy] = fit(W, H); g.setTransform(s, 0, 0, s, ox, oy); CH[j].live(g, t); g.setTransform(1, 0, 0, 1, 0, 0); };
  const draw = t => {
    paint(ctx, cur, t);
    const p = prev < 0 ? 1 : clamp((t - tChange) / .9);
    if (p < 1) {                                   // the old chapter dissolves through a growing watercolour bloom
      const lg2 = layer.getContext('2d'); lg2.setTransform(1, 0, 0, 1, 0, 0); lg2.clearRect(0, 0, W, H); paint(lg2, prev, t);
      lg2.globalCompositeOperation = 'destination-out'; wash(lg2, el(W * .55, H * .5, Math.hypot(W, H) * ss(0, 1, p) * .7 + 1, Math.hypot(W, H) * ss(0, 1, p) * .6 + 1, 22), '#000', { layers: 3, alpha: .6, amp: 40, seed: 7, edge: 0, blend: 'destination-out' });
      lg2.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 - ss(.55, 1, p); ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
    } else prev = -1;
  };
  const frame = now => { raf = requestAnimationFrame(frame); if (!visible || document.hidden) return; const step = Math.floor((now - t0) / 1000 * 12); if (step === last) return; last = step; draw(step / 12); };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) { size(); if (reduce) draw(6); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) draw(6); else raf = requestAnimationFrame(frame);
  return {
    canvas: cv, style: 'Hand-painted anime watercolour',
    chapter(j) { j = clamp(j, 0, CH.length - 1); if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = Math.floor((performance.now() - t0) / 1000 * 12) / 12; if (reduce) draw(6); },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}
export const GHIBLI_CHAPTERS = CH.length;
