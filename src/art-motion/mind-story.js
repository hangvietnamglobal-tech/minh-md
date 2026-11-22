// mind-story.js — the Mind vision as six living paintings: Minh's reading life, from the lamp to the open field.
// Each chapter is its own painted night (or day), composed after Tuệ Minh's mood board and painted in code with the
// huashu-art-motion toolkit: cached still + live layer at 12 fps, seeded marks, one look per painting, her own sprites.
import { TAU, clamp, lerp, ss, hash, noise, fbm, grain, strokes } from './core.js';

const off = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const IMG = {};
const SRC = { read: 'poses/read.webp', meditate: 'poses/meditate.webp', wave: 'poses/wave.webp' };

// her sprite (cut at the thigh), lit for the scene: a light pool where the light comes from, the rest sinks into the night
function lit(key, h, { lx = .5, ly = .5, shade = 'rgba(12,16,44,.5)', warm = null, sil = null, rim = null } = {}) {
  const im = IMG[key]; if (!im || !im.complete || !im.naturalWidth) return null;
  const w = Math.round(h * im.naturalWidth / im.naturalHeight), c = off(w, Math.round(h)), g = c.getContext('2d');
  g.drawImage(im, 0, 0, w, h); g.globalCompositeOperation = 'source-atop';
  if (sil) { g.fillStyle = sil; g.fillRect(0, 0, w, h); }
  else {
    const q = g.createRadialGradient(lx * w, ly * h, 0, lx * w, ly * h, Math.max(w, h) * .95); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, shade); g.fillStyle = q; g.fillRect(0, 0, w, h);
    if (warm) { g.globalCompositeOperation = 'soft-light'; g.fillStyle = warm; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0, w, h); }
  }
  return c;
}
const legsColor = '#4a3530';
function legs(g, x, y, h, kind, t, k = 1) {         // brown leggings below the sprite's cut
  g.save(); g.strokeStyle = legsColor; g.lineCap = 'round'; g.lineWidth = h * .075 * k;
  if (kind === 'dangle') {                          // sitting on an edge, feet swinging
    [-1, 1].forEach((s, i) => { const sw = Math.sin(t * 2.1 + i * 2.4) * h * .05; g.beginPath(); g.moveTo(x + s * h * .045, y - h * .01); g.quadraticCurveTo(x + s * h * .05 + sw * .3, y + h * .14, x + s * h * .04 + sw, y + h * .27); g.stroke();
      g.fillStyle = '#f1c9a8'; g.beginPath(); g.ellipse(x + s * h * .04 + sw + s * h * .01, y + h * .285, h * .03, h * .016, 0, 0, TAU); g.fill(); });
  } else if (kind === 'cross') {                    // cross-legged: a lap wider than the hips
    g.fillStyle = legsColor; g.beginPath(); g.ellipse(x, y + h * .03, h * .2, h * .06, 0, 0, TAU); g.fill();
    g.fillStyle = '#f1c9a8'; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(x + s * h * .06, y + h * .07, h * .035, h * .017, s * .2, 0, TAU); g.fill(); });
  } else if (kind === 'stand') {
    g.lineWidth = h * .085 * k; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(x + s * h * .05, y - h * .02); g.lineTo(x + s * h * .06, y + h * .33); g.stroke(); });
  }
  g.restore();
}
const twinkle = (g, t, W, H, n, seed, area = [0, 0, 1, 1], col = '255,255,240', big = 1.4) => {
  for (let i = 0; i < n; i++) { const x = (area[0] + hash(i, seed) * (area[2] - area[0])) * W, y = (area[1] + hash(i, seed + 1) * (area[3] - area[1])) * H;
    const a = .25 + .75 * Math.pow(.5 + .5 * Math.sin(t * (1 + hash(i, seed + 2) * 2.5) + i), 3), r = (.5 + hash(i, seed + 3) * big) * Math.max(1, W / 900);
    g.fillStyle = `rgba(${col},${a})`; g.fillRect(x - r / 2, y - r / 2, r, r);
    if (hash(i, seed + 4) > .94) { g.strokeStyle = `rgba(${col},${a * .7})`; g.lineWidth = 1; const L = r * 5 * a; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke(); } }
};
const vgrad = (g, W, H, stops) => { const q = g.createLinearGradient(0, 0, 0, H); stops.forEach(([p, c]) => q.addColorStop(p, c)); g.fillStyle = q; g.fillRect(0, 0, W, H); };
const glow = (g, x, y, r, col, a) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${col},${a})`); q.addColorStop(1, `rgba(${col},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); };
function moonTex(g, x, y, r, base, dark, seed) {    // a mottled full moon
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.fillStyle = base; g.fillRect(x - r, y - r, r * 2, r * 2);
  for (let i = 0; i < 900; i++) { const a = hash(i, seed) * TAU, d = Math.sqrt(hash(i, seed + 1)) * r, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    const n = fbm(px / r * 2.2 + seed, py / r * 2.2, 4); if (n < .5) continue; g.fillStyle = `rgba(${dark},${(n - .5) * .5})`; g.beginPath(); g.arc(px, py, r * (.02 + hash(i, seed + 2) * .05), 0, TAU); g.fill(); }
  const q = g.createRadialGradient(x - r * .3, y - r * .3, r * .2, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.12)'); q.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function book(g, x, y, w, h, cover, page, seed, gold = false) {   // a book seen from the spine, pages at the right end
  const pw = w * (.22 + hash(seed, 3) * .1);
  g.fillStyle = page; g.fillRect(x + w - pw, y + h * .08, pw, h * .84);
  g.strokeStyle = 'rgba(90,70,40,.35)'; g.lineWidth = Math.max(.5, h * .04); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + w - pw, y + h * k / 4); g.lineTo(x + w - 1, y + h * k / 4); g.stroke(); }
  g.fillStyle = cover; g.beginPath(); g.roundRect(x, y, w - pw + h * .1, h, h * .25); g.fill();
  g.fillStyle = gold ? 'rgba(230,190,110,.8)' : 'rgba(255,255,255,.18)'; const b = x + w * (.1 + hash(seed, 4) * .1); g.fillRect(b, y + h * .12, Math.max(1, h * .08), h * .76); g.fillRect(b + h * .2, y + h * .12, Math.max(1, h * .05), h * .76);
}
function flyBook(g, x, y, s, t, ph, col = '#efe4cc', cover = '#b5413e') {   // an open book flapping like a bird
  const f = Math.sin(t * 7 + ph) * .55;
  g.save(); g.translate(x, y); g.rotate(Math.sin(t * .8 + ph) * .3);
  [-1, 1].forEach(sd => { g.fillStyle = cover; g.beginPath(); g.moveTo(0, 0); g.lineTo(sd * s, -s * f - s * .1); g.lineTo(sd * s, -s * f + s * .55); g.lineTo(0, s * .6); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(0, -s * .05); g.lineTo(sd * s * .92, -s * f - s * .12); g.lineTo(sd * s * .92, -s * f + s * .46); g.lineTo(0, s * .52); g.fill(); });
  g.restore();
}

/* ---------------- the six paintings ---------------- */
const SCENES = [
  { // I · lost in pages — the lamp, the tall window, the mountain at dusk
    still(g, W, H) {
      g.fillStyle = '#0c1130'; g.fillRect(0, 0, W, H);
      const wx0 = .1 * W, wx1 = .9 * W, wy0 = .05 * H, wy1 = .66 * H;
      g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
      vgrad(g, W, H, [[0, '#6f6a9c'], [.3, '#b58aa0'], [.42, '#c99a9c'], [.5, '#3a3f78'], [1, '#141a44']]);
      g.fillStyle = '#1f2a63'; g.beginPath(); g.moveTo(wx0, .55 * H);
      for (let x = wx0; x <= wx1; x += 3) { const u = (x - W * .5) / (W * .45); g.lineTo(x, H * (.34 + .21 * u * u) + fbm(x / 40, 1) * H * .03); } g.lineTo(wx1, wy1); g.lineTo(wx0, wy1); g.fill();
      g.fillStyle = 'rgba(160,170,220,.35)'; g.beginPath(); g.moveTo(W * .5, H * .34); for (let x = W * .5; x >= W * .2; x -= 3) { const u = (x - W * .5) / (W * .45); g.lineTo(x, H * (.34 + .21 * u * u) + fbm(x / 40, 1) * H * .03); } g.lineTo(W * .3, H * .5); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = '#090c20'; g.lineWidth = Math.max(3, W * .007);
      g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
      [1 / 3, 2 / 3].forEach(p => { g.beginPath(); g.moveTo(lerp(wx0, wx1, p), wy0); g.lineTo(lerp(wx0, wx1, p), wy1); g.stroke(); });
      [.2, .45].forEach(p => { g.beginPath(); g.moveTo(wx0, p * H); g.lineTo(wx1, p * H); g.stroke(); });
      g.lineWidth = Math.max(2, W * .004); for (let k = 0; k < 7; k++) { const a = Math.PI + (k + .5) / 7 * Math.PI; g.beginPath(); g.moveTo(W * .5, wy0 + H * .1); g.lineTo(W * .5 + Math.cos(a) * W * .3, wy0 + H * .1 + Math.sin(a) * H * .1); g.stroke(); }
      // bookshelves either side
      [[0, .27], [.73, 1]].forEach(([a, b], s) => { const x0 = a * W, x1 = b * W, y0 = .56 * H;
        g.fillStyle = '#3c2430'; g.fillRect(x0, y0, x1 - x0, H - y0); g.fillStyle = '#5a3640'; g.fillRect(x0, y0, x1 - x0, H * .018);
        for (let r = 0; r < 3; r++) { const sy = y0 + H * (.04 + r * .13); g.fillStyle = '#20131c'; g.fillRect(x0 + W * .012, sy, x1 - x0 - W * .024, H * .11);
          let bx = x0 + W * .016; let i = 0; while (bx < x1 - W * .03) { const bw = W * (.008 + hash(i, r * 9 + s * 40) * .01), bh = H * (.07 + hash(i, r + 3 + s) * .035);
            g.fillStyle = ['#7a3b3b', '#365a6b', '#7b6a3a', '#3d5a40', '#5a3e6b', '#8a5a3a'][(i + r + s) % 6]; g.globalAlpha = .75; g.beginPath(); g.roundRect(bx, sy + H * .11 - bh, bw, bh, bw * .3); g.fill(); g.globalAlpha = 1; bx += bw + W * .002; i++; } } });
      grain(g, W, H, 11, .06);
    },
    live(g, W, H, t, S) {
      twinkle(g, t, W, H, 30, 3, [.12, .06, .88, .3]);
      [[.3, .5], [.78, .52]].forEach(([x, y], i) => { const a = .5 + .5 * Math.sin(t * 1.5 + i * 2); g.strokeStyle = `rgba(230,240,255,${a})`; g.lineWidth = 1.5; const L = W * .012 * (.6 + a * .4);
        g.beginPath(); g.moveTo(x * W - L, y * H); g.lineTo(x * W + L, y * H); g.moveTo(x * W, y * H - L); g.lineTo(x * W, y * H + L); g.stroke(); });
      const fl = 1 + Math.sin(t * 9) * .02 + Math.sin(t * 2.3) * .03, lx = .4 * W, ly = .74 * H;
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .5, H * .86, W * .38 * fl, '255,170,90', .35); g.restore();
      const h = .3 * H, her = S.her || (S.her = lit('read', h, { lx: .25, ly: .6, shade: 'rgba(10,12,40,.62)', warm: 'rgba(255,170,90,.35)' }));
      const br = Math.sin(t * 1.6) * h * .006;
      if (her) g.drawImage(her, W * .5 - her.width / 2, H * .9 - h + br);
      // desk
      g.fillStyle = '#5a3c42'; g.beginPath(); g.moveTo(W * .16, H * .87); g.lineTo(W * .84, H * .87); g.lineTo(W * .92, H); g.lineTo(W * .08, H); g.fill();
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .48, H * .9, W * .3 * fl, '255,180,110', .45); g.restore();
      // lamp
      g.strokeStyle = '#1a1c2c'; g.lineWidth = W * .006; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx - W * .02, H * .9); g.quadraticCurveTo(lx - W * .06, ly, lx - W * .01, H * .7); g.stroke();
      g.fillStyle = '#26283a'; g.beginPath(); g.ellipse(lx - W * .02, H * .9, W * .03, H * .01, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(lx - W * .02, H * .69); g.lineTo(lx + W * .045, H * .71); g.lineTo(lx + W * .03, H * .745); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, lx + W * .035, H * .735, W * .05, '255,230,170', .9 * fl); g.restore();
      for (let i = 0; i < 26; i++) { const p = (t * .03 * (1 + hash(i, 5)) + hash(i, 6)) % 1, x = W * (.36 + hash(i, 7) * .3) + Math.sin(t + i) * W * .01, y = H * (.95 - p * .3);
        g.fillStyle = `rgba(255,220,160,${Math.sin(p * Math.PI) * .7})`; g.fillRect(x, y, 1.6, 1.6); }
    },
  },
  { // II · above the clouds — a tower of blue books under a full moon
    still(g, W, H) {
      const M = Math.min(W, H); vgrad(g, W, H, [[0, '#0d0f2e'], [1, '#1d1f52']]);
      g.save(); g.shadowColor = 'rgba(240,238,225,.5)'; g.shadowBlur = M * .08; g.fillStyle = '#eeebe0'; g.beginPath(); g.arc(W * .6, H * .4, M * .38, 0, TAU); g.fill(); g.restore();
      moonTex(g, W * .6, H * .4, M * .38, '#eeebe0', '170,170,170', 7);
      grain(g, W, H, 12, .05);
    },
    live(g, W, H, t, S) {
      const M = Math.min(W, H);
      twinkle(g, t, W, H, 50, 13, [0, 0, 1, 1], '230,230,255', 1.2);
      const cloud = (y, x0, len, th, sp, ph) => { const dx = ((t * sp + ph) % 1.6 - .3) * W; g.fillStyle = 'rgba(70,72,150,.85)'; g.beginPath(); g.moveTo(dx + x0 * W, y * H);
        for (let k = 0; k <= 20; k++) { const u = k / 20; g.lineTo(dx + (x0 + u * len) * W, y * H - Math.sin(u * Math.PI) * th * H * (1 + .3 * Math.sin(u * 7 + t))); }
        g.lineTo(dx + (x0 + len) * W, y * H + th * H * .3); g.quadraticCurveTo(dx + (x0 + len * .5) * W, y * H + th * H * .8, dx + x0 * W, y * H); g.fill(); };
      cloud(.15, -.2, .55, .05, .008, 0); cloud(.68, -.1, .45, .04, .006, .7);
      // the tower: narrow at the top, swaying more the higher it gets
      const n = 30, bh = H * .021, top = H * .55, cx = W * .44, sway = Math.sin(t * .9) * W * .0009;
      for (let k = 0; k < n; k++) { const y = H + bh * 2 - (k + 1) * (H + bh * 2 - top) / n, bw = M * (.1 + hash(k, 21) * .05), x = cx - bw / 2 + Math.sin(k * .8) * W * .008 + sway * k * k * .08 + (hash(k, 22) - .5) * W * .01;
        book(g, x, y, bw, bh * .95, ['#2b3f8f', '#3c5bb7', '#5578c9', '#24306c', '#4a6fa8', '#1f2a5a'][k % 6], '#c9d2ea', k); }
      const tx = cx + Math.sin((n - 1) * .8) * W * .008 + sway * (n - 1) * (n - 1) * .08;
      const h = .17 * H, her = S.her || (S.her = lit('read', h, { lx: .9, ly: .2, shade: 'rgba(20,24,70,.35)' }));
      legs(g, tx + h * .07, top - h * .02, h, 'dangle', t, .9);
      if (her) g.drawImage(her, tx - her.width / 2, top - h + Math.sin(t * 1.6) * h * .005);
      cloud(.86, .5, .6, .05, .01, .3);
    },
  },
  { // III · the planets — sitting on a few books, looking up
    still(g, W, H) { vgrad(g, W, H, [[0, '#3a2558'], [.55, '#1a1030'], [1, '#07050d']]);
      for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${.15 + hash(i, 31) * .5})`; g.fillRect(hash(i, 32) * W, hash(i, 33) * H, 1, 1); } grain(g, W, H, 13, .05); },
    live(g, W, H, t, S) {
      const M = Math.min(W, H); twinkle(g, t, W, H, 40, 41, [0, 0, 1, .8]);
      // a constellation drawing itself between stars
      const P = [[.15, .7], [.27, .62], [.36, .68], [.47, .58], [.55, .64]], pr = (t % 9) / 6;
      g.strokeStyle = 'rgba(220,210,255,.5)'; g.lineWidth = 1; g.beginPath(); for (let k = 0; k < P.length - 1; k++) { const f = clamp(pr * (P.length - 1) - k); if (f <= 0) break;
        g.moveTo(P[k][0] * W, P[k][1] * H); g.lineTo(lerp(P[k][0], P[k + 1][0], f) * W, lerp(P[k][1], P[k + 1][1], f) * H); } g.stroke();
      P.forEach(([x, y]) => glow(g, x * W, y * H, M * .012, '230,220,255', .9));
      const planet = (x, y, r, c1, c2, glowC, ring, ph) => { y += Math.sin(t * .5 + ph) * .01; g.save(); g.globalCompositeOperation = 'screen'; glow(g, x * W, y * H, r * M * 2, glowC, .25 + .1 * Math.sin(t + ph)); g.restore();
        if (ring) { g.strokeStyle = 'rgba(170,190,255,.8)'; g.lineWidth = r * M * .12; g.beginPath(); g.ellipse(x * W, y * H, r * M * 1.8, r * M * .45, -.2, Math.PI, TAU); g.stroke(); }
        const q = g.createLinearGradient(x * W, (y - r) * H, x * W, (y + r) * H); for (let k = 0; k <= 6; k++) q.addColorStop(k / 6, k % 2 ? c1 : c2); g.fillStyle = q; g.beginPath(); g.arc(x * W, y * H, r * M, 0, TAU); g.fill();
        const s = g.createRadialGradient((x - r * .3) * W, y * H - r * M * .3, 0, x * W, y * H, r * M); s.addColorStop(0, 'rgba(255,255,255,.25)'); s.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = s; g.beginPath(); g.arc(x * W, y * H, r * M, 0, TAU); g.fill();
        if (ring) { g.strokeStyle = 'rgba(170,190,255,.9)'; g.beginPath(); g.ellipse(x * W, y * H, r * M * 1.8, r * M * .45, -.2, 0, Math.PI); g.stroke(); } };
      planet(.36, .2, .1, '#c9b8ec', '#b3a2dc', '210,190,255', 0, 0); planet(.68, .1, .05, '#b0683c', '#c47c4c', '220,140,90', 0, 1); planet(.08, .1, .055, '#3c6a52', '#2f5a45', '120,200,150', 0, 2);
      planet(.15, .34, .06, '#6f8fd8', '#5878c4', '140,170,255', 1, 3); planet(.8, .3, .075, '#b8a4a4', '#a58f90', '230,200,210', 0, 4); planet(.43, .48, .03, '#e08aa4', '#d07490', '255,150,190', 0, 5);
      // her little stack of books, bottom right
      const cx = W * .76, bw = M * .26, bh = H * .045; let y = H;
      for (let k = 0; k < 6; k++) { y -= bh; book(g, cx - bw / 2 + (hash(k, 51) - .5) * bw * .15, y, bw * (.9 + hash(k, 52) * .15), bh * .94, ['#8b8a86', '#a09d96', '#7b7a76', '#96938c'][k % 4], '#d8d3c6', k + 60); }
      const h = .22 * H, her = S.her || (S.her = lit('meditate', h, { lx: .3, ly: .1, shade: 'rgba(30,16,60,.55)', warm: 'rgba(200,170,255,.3)' }));
      legs(g, cx, y - h * .03, h, 'cross', t);
      if (her) g.drawImage(her, cx - her.width / 2, y - h * .98 + Math.sin(t * 1.3) * h * .006);
      const sh = t % 7; if (sh < 1) { const a = Math.sin(sh * Math.PI), x = W * (.9 - sh * .4), yy = H * (.05 + sh * .15); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + W * .08, yy - H * .03); g.stroke(); }
    },
  },
  { // IV · every page is a door — flying through space on an open book
    still(g, W, H) { const M = Math.min(W, H);
      vgrad(g, W, H, [[0, '#1c2550'], [.5, '#3c5c6e'], [1, '#1d2348']]);
      for (let i = 0; i < 2600; i++) { const x = hash(i, 61) * W, y = hash(i, 62) * H, n = fbm(x / W * 3, y / H * 3, 3); if (n < .45) continue;
        g.fillStyle = `rgba(${hash(i, 63) > .5 ? '150,140,220' : '200,200,255'},${(n - .45) * .9})`; g.fillRect(x, y, 1.5, 1.5); }
      // the red giant, half out of frame
      const rx = W * .98, ry = H * .1, rr = M * .48; g.save(); g.beginPath(); g.arc(rx, ry, rr, 0, TAU); g.clip(); g.fillStyle = '#c4475a'; g.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
      for (let i = 0; i < 1800; i++) { const a = hash(i, 64) * TAU, d = Math.sqrt(hash(i, 65)) * rr, px = rx + Math.cos(a) * d, py = ry + Math.sin(a) * d, sw = Math.sin(py / rr * 9 + fbm(px / rr * 3, py / rr * 3) * 6);
        g.fillStyle = sw > .5 ? 'rgba(255,220,225,.35)' : sw < -.6 ? 'rgba(120,20,40,.3)' : 'rgba(230,110,120,.2)'; g.fillRect(px, py, 3, 3); } g.restore();
      grain(g, W, H, 14, .06);
    },
    live(g, W, H, t, S) {
      const M = Math.min(W, H); twinkle(g, t, W, H, 40, 71);
      const pl = (x, y, r, c, ph, ring) => { y += Math.sin(t * .6 + ph) * .008; if (ring) { g.strokeStyle = 'rgba(190,150,130,.7)'; g.lineWidth = r * M * .1; g.beginPath(); g.ellipse(x * W, y * H, r * M * 1.9, r * M * .4, -.15, 0, TAU); g.stroke(); }
        const q = g.createRadialGradient((x - r * .3) * W, y * H - r * M * .3, 0, x * W, y * H, r * M); q.addColorStop(0, c[0]); q.addColorStop(1, c[1]); g.fillStyle = q; g.beginPath(); g.arc(x * W, y * H, r * M, 0, TAU); g.fill(); };
      pl(.3, .24, .12, ['#6fb0e8', '#1f4fa0'], 0); pl(.86, .74, .045, ['#b8c98a', '#5c7340'], 1); pl(.8, .92, .07, ['#c08a6a', '#6a4030'], 2, 1); pl(.06, .9, .07, ['#d0c8d8', '#6a6478'], 3);
      // stardust river sweeping up toward the red giant
      g.save(); g.globalCompositeOperation = 'screen';
      for (let i = 0; i < 260; i++) { const u = (hash(i, 81) + t * .04) % 1, px = lerp(.05, .72, u) * W + Math.sin(u * 5) * W * .08 * (1 - u), py = (lerp(.78, .26, u) + Math.sin(u * 7 + 1) * .08 * (1 - u)) * H + (hash(i, 82) - .5) * H * .06 * (1 - u * .5);
        g.fillStyle = `rgba(240,240,255,${.25 + .5 * hash(i, 83)})`; g.fillRect(px, py, 1.6, 1.6); } g.restore();
      flyBook(g, W * (.32 + (t * .03 % .3)), H * (.44 - (t * .03 % .3) * .5), M * .03, t, 0); flyBook(g, W * .44, H * .38 + Math.sin(t) * H * .02, M * .025, t, 2, '#f3e9d8', '#c0393b');
      // the big open book, bobbing on the dark
      const bx = W * .5, by = H * .74 + Math.sin(t * 1.1) * H * .012, s = M * .3, rot = Math.sin(t * .7) * .04;
      g.save(); g.translate(bx, by); g.rotate(rot);
      g.fillStyle = '#b73b3e'; g.beginPath(); g.moveTo(-s * 1.25, s * .2); g.lineTo(s * 1.25, -s * .05); g.lineTo(s * 1.3, s * .08); g.lineTo(-s * .1, s * .5); g.lineTo(-s * 1.3, s * .32); g.fill();
      g.fillStyle = '#ede1c5'; g.beginPath(); g.moveTo(-s * 1.2, s * .18); g.quadraticCurveTo(-s * .6, -s * .1, 0, -s * .02); g.quadraticCurveTo(s * .6, -s * .4, s * 1.2, -s * .3); g.lineTo(s * 1.22, -s * .06); g.quadraticCurveTo(s * .5, -s * .05, -s * .05, s * .38); g.quadraticCurveTo(-s * .6, s * .2, -s * 1.22, s * .3); g.fill();
      g.strokeStyle = 'rgba(120,100,80,.35)'; g.lineWidth = 1; for (let k = 0; k < 9; k++) { const u = k / 9; g.beginPath(); g.moveTo(-s * (1.05 - u * .1), s * (.18 + u * .1)); g.lineTo(-s * .2, s * (.08 + u * .2)); g.moveTo(s * .2, s * (-.05 + u * .2)); g.lineTo(s * (1.05 - u * .05), -s * (.24 - u * .2)); g.stroke(); }
      const h = .26 * H, her = S.her || (S.her = lit('read', h, { lx: .5, ly: .7, shade: 'rgba(20,30,70,.4)' }));
      if (her) g.drawImage(her, -her.width / 2 - s * .05, s * .06 - h);
      // the near pages lift and fall over her lap
      const fl = .5 + .5 * Math.sin(t * 2.2); g.fillStyle = '#f5ebd2'; g.beginPath(); g.moveTo(-s * .55, s * .2); g.quadraticCurveTo(-s * .2, s * (.02 - fl * .08), s * .3, s * .04); g.lineTo(s * .35, s * .16); g.quadraticCurveTo(-s * .1, s * .3, -s * .55, s * .3); g.fill();
      g.restore();
    },
  },
  { // V · knowledge becomes action — on top of the tower, reaching for the golden moon
    still(g, W, H) { const M = Math.min(W, H); vgrad(g, W, H, [[0, '#0a1630'], [.6, '#123050'], [1, '#0b1a30']]);
      for (let i = 0; i < 40; i++) { const x = hash(i, 91) * W, y = hash(i, 92) * H * .8, r = M * (.1 + hash(i, 93) * .2); glow(g, x, y, r, '60,110,150', .08); }
      g.save(); g.shadowColor = 'rgba(255,220,130,.7)'; g.shadowBlur = M * .1; g.fillStyle = '#e8d48a'; g.beginPath(); g.arc(W * .5, H * .3, M * .27, 0, TAU); g.fill(); g.restore();
      moonTex(g, W * .5, H * .3, M * .27, '#ead88e', '150,120,50', 3); grain(g, W, H, 15, .05); },
    live(g, W, H, t, S) {
      const M = Math.min(W, H); twinkle(g, t, W, H, 60, 101, [0, 0, 1, 1], '255,245,210');
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .5, H * .3, M * (.42 + .03 * Math.sin(t * .8)), '255,220,140', .25); g.restore();
      const n = 16, top = H * .6, bh = (H - top) / n;
      for (let k = 0; k < n; k++) { const y = H - (k + 1) * bh, bw = M * (.3 + hash(k, 111) * .08) * (1 - k * .012), x = W * .5 - bw * .5 + Math.sin(k * 1.3) * M * .02;
        book(g, x, y, bw, bh * .96, ['#2a2018', '#3a2a1c', '#1f1a14', '#33261a'][k % 4], '#c9a86a', k + 120, true); }
      const h = .27 * H, her = S.sil || (S.sil = lit('wave', h, { sil: '#0c1424' }));
      if (her) { g.save(); g.shadowColor = 'rgba(255,210,120,.9)'; g.shadowBlur = M * .025; legs(g, W * .5, top - h * .33, h, 'stand', t); g.strokeStyle = '#0c1424';
        g.drawImage(her, W * .5 - her.width / 2, top - h * .33 - h + Math.sin(t * 1.4) * h * .005); g.restore(); }
      // books flying up around the tower, toward the moon
      for (let i = 0; i < 9; i++) { const p = (t * (.04 + hash(i, 121) * .03) + hash(i, 122)) % 1, a = hash(i, 123) * TAU + p * 3, rr = M * (.32 - p * .15);
        flyBook(g, W * .5 + Math.cos(a) * rr * 1.3, H * (.9 - p * .75) + Math.sin(a) * rr * .2, M * (.02 + hash(i, 124) * .015) * (1 - p * .4), t, i, '#f2e3c0', '#7a5a3a'); }
      g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 50; i++) { const p = (t * .05 + hash(i, 131)) % 1; g.fillStyle = `rgba(255,220,150,${Math.sin(p * Math.PI) * .8})`; g.fillRect(W * (.3 + hash(i, 132) * .4), H * (1 - p), 1.8, 1.8); } g.restore();
    },
  },
  { // VI · the open field — big painterly clouds, a quiet mind
    still(g, W, H, S) { vgrad(g, W, H, [[0, '#8fb6e0'], [.55, '#c9dcec'], [.66, '#e8eee8'], [.67, '#c3dc92'], [1, '#86b55e']]);
      const hz = .665 * H;
      for (let i = 0; i < 30; i++) { const x = hash(i, 141) * W, r = W * (.012 + hash(i, 142) * .02); g.fillStyle = `rgba(${70 + hash(i, 143) * 30},${110 + hash(i, 144) * 30},80,.8)`; g.beginPath(); g.ellipse(x, hz - r * .5, r, r * .7, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#b87a6a'; g.fillRect(W * .14, hz - H * .018, W * .05, H * .018); g.fillStyle = '#e0dcd8'; g.fillRect(W * .14, hz - H * .012, W * .05, H * .012);
      for (let i = 0; i < 2500; i++) { const x = hash(i, 151) * W, y = hz + Math.pow(hash(i, 152), 1.5) * (H - hz); g.strokeStyle = `rgba(${110 + hash(i, 153) * 60},${160 + hash(i, 154) * 50},${70 + hash(i, 155) * 30},.5)`; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i, 156) - .5) * 4, y - 3 - (y - hz) / H * 18); g.stroke(); }
      // the cumulus, three boil frames of dabs (huashu impressionist)
      S.clouds = [0, 1, 2].map(f => { const c = off(W, Math.round(H * .7)), q = c.getContext('2d'), M = Math.min(W, H);
        const lobes = [[.5, .32, .26], [.3, .42, .2], [.7, .4, .22], [.42, .18, .17], [.62, .2, .16], [.18, .55, .13], [.82, .55, .14], [.5, .52, .22]];
        for (let i = 0; i < 2600; i++) { const L = lobes[Math.floor(hash(i, 161 + f) * lobes.length)], a = hash(i, 162 + f) * TAU, d = Math.sqrt(hash(i, 163 + f)) * L[2], x = (L[0] + Math.cos(a) * d * .9) * W, y = (L[1] + Math.sin(a) * d * .8) * H;
          const shade = clamp((y / H - L[1] + L[2] * .5) / L[2]), col = shade > .72 ? `rgba(${200 + hash(i, 7) * 20},${185 + hash(i, 8) * 20},${215 + hash(i, 9) * 20},.5)` : `rgba(255,${238 + hash(i, 10) * 17},${232 + hash(i, 11) * 20},.55)`;
          q.fillStyle = col; q.save(); q.translate(x, y); q.rotate(-.5 + hash(i, 12) * .4); q.beginPath(); q.ellipse(0, 0, M * (.012 + hash(i, 13) * .018), M * (.006 + hash(i, 14) * .008), 0, 0, TAU); q.fill(); q.restore(); }
        return c; });
      grain(g, W, H, 16, .05);
    },
    live(g, W, H, t, S) {
      const dx = Math.sin(t * .05) * W * .03; g.drawImage(S.clouds[Math.floor(t * 4) % 3], dx, 0);
      const h = .2 * H, her = S.her || (S.her = lit('read', h, { lx: .3, ly: .2, shade: 'rgba(60,80,120,.2)' })), hz = .665 * H;
      if (her) g.drawImage(her, W * .56 - her.width / 2, H * .82 - h + Math.sin(t * 1.5) * h * .005);
      g.fillStyle = 'rgba(70,110,40,.35)'; g.beginPath(); g.ellipse(W * .56, H * .82, h * .4, h * .05, 0, 0, TAU); g.fill();
      for (let i = 0; i < 110; i++) { const x = hash(i, 171) * W, y = H * (.8 + hash(i, 172) * .2), len = H * (.03 + hash(i, 173) * .05), w = Math.sin(t * 1.6 + x / W * 5) * len * .3;
        g.strokeStyle = 'rgba(80,130,50,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x, y - len * .5, x + w, y - len); g.stroke();
        if (i % 2) { g.fillStyle = ['#e8584a', '#f2a0b8', '#a88ad8', '#ffffff', '#f6c2d2'][i % 5]; g.beginPath(); g.arc(x + w, y - len, H * (.005 + hash(i, 174) * .006), 0, TAU); g.fill(); } }
      for (let i = 0; i < 30; i++) { const p = (t * .04 + hash(i, 181)) % 1, x = (hash(i, 182) + p * .4) % 1 * W, y = H * (.4 + hash(i, 183) * .4) + Math.sin(t * 2 + i) * H * .02;
        g.fillStyle = `rgba(255,250,240,${Math.sin(p * Math.PI) * .8})`; g.save(); g.translate(x, y); g.rotate(t * 2 + i); g.fillRect(-2, -1, 4, 2); g.restore(); }
      void hz;
    },
  },
];

/* ---- three more paintings, added to the story ---- */
const wash = (g, W, H, base, spots, seed) => {          // watercolor sky: mottled blooms over a base
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const x = hash(i, seed) * W, y = hash(i, seed + 1) * H, r = Math.min(W, H) * (.05 + hash(i, seed + 2) * .14), c = spots[i % spots.length];
    const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, c); q.addColorStop(.7, c.replace(/[\d.]+\)$/, '0.02)')); q.addColorStop(1, c.replace(/[\d.]+\)$/, '0)')); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); } };
const puff = (g, x, y, w, h, col, edge, seed) => {      // a scalloped watercolor cloud
  g.fillStyle = col; g.beginPath();
  for (let k = 0; k < 9; k++) { const u = k / 8, px = x + (u - .5) * w, r = h * (.35 + .4 * Math.sin(u * Math.PI)) * (.8 + hash(k, seed) * .4); g.moveTo(px + r, y); g.arc(px, y, r, 0, TAU); }
  g.fill(); g.fillRect(x - w / 2, y, w, h * .25);
};
const crescent = (g, x, y, r, dx, dy, col) => { const c = off(Math.ceil(r * 2 + 4), Math.ceil(r * 2 + 4)), q = c.getContext('2d'); q.fillStyle = col; q.beginPath(); q.arc(r + 2, r + 2, r, 0, TAU); q.fill();
  q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.arc(r + 2 + dx, r + 2 + dy, r * .92, 0, TAU); q.fill(); g.drawImage(c, x - r - 2, y - r - 2); };
const star4 = (g, x, y, r, a) => { g.fillStyle = `rgba(255,240,200,${a})`; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r * .35, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r * .35, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };
const HANG = { // a little glass library hanging from the crescent moon
  still(g, W, H) { wash(g, W, H, '#1c2a5e', ['rgba(40,60,120,.35)', 'rgba(10,20,60,.35)', 'rgba(60,80,140,.25)'], 201);
    const M = Math.min(W, H); g.fillStyle = '#f2d9a8'; g.beginPath(); g.arc(W * .38, H * .05, M * .3, 0, TAU); g.arc(W * .46, -H * .06, M * .3, 0, TAU, true); g.fill('evenodd');
    const q = g.createRadialGradient(W * .3, H * .1, 0, W * .3, H * .1, M * .3); q.addColorStop(0, 'rgba(255,240,210,.3)'); q.addColorStop(1, 'rgba(200,150,90,.2)'); g.fillStyle = q; g.fill('evenodd');
    // paper edge
    g.strokeStyle = '#efe6d4'; g.lineWidth = M * .03; g.strokeRect(0, 0, W, H); grain(g, W, H, 21, .07); },
  live(g, W, H, t, S) {
    const M = Math.min(W, H);
    for (let i = 0; i < 16; i++) star4(g, hash(i, 211) * W, hash(i, 212) * H * .9, M * (.008 + hash(i, 213) * .012), .5 + .5 * Math.sin(t * 2 + i));
    const cl = (y, x, w, sp, ph) => puff(g, ((x + t * sp + ph) % 1.6 - .3) * W, y * H, w * W, M * .08, 'rgba(240,222,190,.9)', 'rgba(150,140,180,.5)', ph * 10 | 0);
    cl(.42, .0, .34, .006, 0); cl(.6, .7, .3, .005, .3);
    const px = W * .5, py = H * .16, ang = Math.sin(t * .6) * .035;
    g.save(); g.translate(px, py); g.rotate(ang);
    g.strokeStyle = '#b8894a'; g.lineWidth = M * .006; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, H * .3); g.stroke();
    ['#4a6a8a', '#a84a3e', '#4a6a8a', '#a84a3e', '#6a7a8a'].forEach((c, k) => { const bw = M * .075, bh = M * .03, y = H * (.04 + k * .05), rot = Math.sin(t * 1.3 + k) * .08;
      g.save(); g.translate(0, y); g.rotate(rot); book(g, -bw / 2, -bh / 2, bw, bh, c, '#efe3c8', k + 220, true); g.restore(); });
    const hy = H * .36, hw = M * .4, hh = H * .26;   // the glass room
    g.fillStyle = '#3a4e6a'; g.beginPath(); g.moveTo(-hw * .55, hy); g.lineTo(0, hy - hh * .25); g.lineTo(hw * .55, hy); g.fill();
    const fl = .9 + .1 * Math.sin(t * 7);
    g.fillStyle = `rgba(255,${200 + 20 * fl | 0},140,.95)`; g.fillRect(-hw / 2, hy, hw, hh);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { g.fillStyle = ['#8a4a3a', '#5a6a3a', '#3a5a7a', '#9a7a4a'][(k + r) % 4]; g.fillRect(-hw * .42 + k * hw * .06, hy + hh * (.18 + r * .19), hw * .04, hh * .14); }
    g.strokeStyle = '#6a5030'; g.lineWidth = M * .006; g.strokeRect(-hw / 2, hy, hw, hh); [-1 / 6, 1 / 6].forEach(u => { g.beginPath(); g.moveTo(u * hw, hy); g.lineTo(u * hw, hy + hh); g.stroke(); });
    g.fillStyle = '#6a5030'; g.fillRect(-hw * .58, hy + hh, hw * 1.16, M * .02);
    g.save(); g.globalCompositeOperation = 'screen'; glow(g, hw * .62, hy + hh * .35, M * .08 * fl, '255,200,120', .8); glow(g, 0, hy + hh * .3, M * .25, '255,190,110', .3); g.restore();
    g.fillStyle = '#ffd890'; g.fillRect(hw * .6, hy + hh * .28, M * .02, M * .03);
    // trailing plant
    g.strokeStyle = '#5a7a3a'; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-hw * .42 + k * 6, hy + hh); for (let j = 0; j < 8; j++) { const yy = hy + hh + j * M * .02; g.lineTo(-hw * .42 + k * 6 + Math.sin(t * 1.5 + j + k) * 4, yy); } g.stroke(); }
    const h = hh * .62, her = S.her || (S.her = lit('read', h, { lx: .5, ly: .3, shade: 'rgba(60,30,20,.25)', warm: 'rgba(255,190,120,.3)' }));
    legs(g, hw * .1, hy + hh, h, 'dangle', t, .8);
    if (her) g.drawImage(her, hw * .1 - her.width / 2, hy + hh - h + M * .004);
    g.restore();
  },
};
const CABIN = { // a cabin on the cliff, reading until the valley lights come on
  still(g, W, H, S) { const M = Math.min(W, H);
    vgrad(g, W, H, [[0, '#3f5aa8'], [.35, '#7a8fcf'], [.52, '#e9b9a0'], [.6, '#f3d2ae'], [1, '#6a7fb8']]);
    for (let i = 0; i < 18; i++) { const y = H * (.12 + hash(i, 231) * .4), x = hash(i, 232) * W; g.fillStyle = `rgba(${y / H > .4 ? '250,220,200' : '220,225,250'},.25)`; g.beginPath(); g.ellipse(x, y, W * (.05 + hash(i, 233) * .1), H * .012, 0, 0, TAU); g.fill(); }
    [[.56, '#7d8fc8', .05], [.62, '#5f74b4', .06], [.7, '#4b5f9e', .07], [.8, '#3c4f8a', .06]].forEach(([y, c, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) g.lineTo(x, H * (y - a * fbm(x / W * 4 + k * 3, k) * 1.5)); g.lineTo(W, H); g.fill();
      g.fillStyle = 'rgba(230,220,240,.15)'; g.fillRect(0, H * (y + .01), W, H * .02); });
    // cliff and grass
    g.fillStyle = '#5f7a4a'; g.beginPath(); g.moveTo(0, H * .5); g.quadraticCurveTo(W * .22, H * .52, W * .52, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#8a8478'; g.beginPath(); g.moveTo(W * .3, H * .72); g.quadraticCurveTo(W * .42, H * .8, W * .52, H); g.lineTo(W * .36, H); g.fill();
    for (let i = 0; i < 900; i++) { const u = hash(i, 241), v = hash(i, 242), x = u * W * .5, y = H * (.55 + v * .45); if (y < H * .52 + (x / W) * H * .35 + x * x / W / W * H * .6) continue;
      g.strokeStyle = `rgba(${90 + hash(i, 243) * 60},${130 + hash(i, 244) * 50},70,.6)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 6); g.stroke(); }
    const pine = (x, y, h) => { g.fillStyle = '#24402e'; for (let k = 0; k < 5; k++) { const w = h * (.32 - k * .05), yy = y - k * h * .18; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - h * .3); g.lineTo(x + w, yy); g.fill(); } };
    [[.04, .5, .2], [.12, .48, .16], [.6, .86, .2], [.68, .9, .16], [.9, .95, .2], [.5, .75, .14]].forEach(([x, y, h]) => pine(x * W, y * H, h * H));
    grain(g, W, H, 22, .07); },
  live(g, W, H, t, S) { const M = Math.min(W, H);
    twinkle(g, t, W, H, 30, 251, [0, 0, 1, .35]);
    crescent(g, W * .86, H * .07, M * .045, M * .025, -M * .02, '#fff4d8');
    for (let i = 0; i < 40; i++) { const a = .4 + .6 * Math.pow(.5 + .5 * Math.sin(t * 2 + i * 3), 2); g.fillStyle = `rgba(255,210,120,${a})`; g.fillRect(W * (.55 + hash(i, 261) * .4), H * (.73 + hash(i, 262) * .08), 1.8, 1.8); }
    // cabin on stilts
    const bx = W * .05, by = H * .44, bw = W * .4, fl = .9 + .1 * Math.sin(t * 6);
    g.strokeStyle = '#3a3a44'; g.lineWidth = M * .01; [[.35, .2], [.8, .3]].forEach(([u, l]) => { g.beginPath(); g.moveTo(bx + bw * u, by); g.lineTo(bx + bw * u, by + H * l); g.stroke(); });
    g.fillStyle = '#ffe2a8'; g.globalAlpha = fl; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - H * .2); g.lineTo(bx + bw * .5, by - H * .32); g.lineTo(bx + bw * .5, by); g.fill(); g.globalAlpha = 1;
    g.save(); g.globalCompositeOperation = 'screen'; glow(g, bx + bw * .28, by - H * .12, M * .25, '255,200,120', .35 * fl); g.restore();
    g.strokeStyle = '#3c3c46'; g.lineWidth = M * .008; g.beginPath(); g.moveTo(bx - W * .02, by - H * .19); g.lineTo(bx + bw * .52, by - H * .34); g.stroke(); g.beginPath(); g.moveTo(bx + bw * .5, by); g.lineTo(bx + bw * .5, by - H * .32); g.moveTo(bx + bw * .25, by); g.lineTo(bx + bw * .25, by - H * .25); g.stroke();
    g.fillStyle = '#4a4650'; g.fillRect(bx, by, bw, H * .015);
    const h = H * .15, her = S.her || (S.her = lit('read', h, { lx: .2, ly: .3, shade: 'rgba(40,50,110,.4)', warm: 'rgba(255,190,140,.25)' }));
    if (her) g.drawImage(her, bx + bw * .7 - her.width / 2, by - h * .78);
    g.save(); g.globalCompositeOperation = 'screen'; glow(g, bx + bw * .58, by - H * .02, M * .05 * fl, '255,200,110', .9); g.restore();
    g.strokeStyle = '#3c3c46'; g.lineWidth = M * .004; g.beginPath(); g.moveTo(bx + bw * .5, by - H * .05); g.lineTo(bx + bw * 1.02, by - H * .05); for (let k = 0; k <= 10; k++) { g.moveTo(bx + bw * (.5 + k * .052), by - H * .05); g.lineTo(bx + bw * (.5 + k * .052), by); } g.stroke();
    g.fillStyle = '#4a7a3a'; g.beginPath(); g.ellipse(bx + bw * .55, by - H * .085 + Math.sin(t * 1.4) * 2, M * .025, M * .03, 0, 0, TAU); g.fill();
    for (let i = 0; i < 40; i++) { const x = W * (.02 + hash(i, 271) * .42), y = H * (.8 + hash(i, 272) * .2), sw = Math.sin(t * 1.5 + i) * 3; g.fillStyle = hash(i, 273) > .5 ? '#a88ad8' : '#fbf4e8'; g.beginPath(); g.arc(x + sw, y, M * (.006 + hash(i, 274) * .006), 0, TAU); g.fill(); }
    for (let i = 0; i < 14; i++) { const p = (t * .05 + hash(i, 281)) % 1; glow(g, W * (.1 + hash(i, 282) * .8) + Math.sin(t + i) * 10, H * (.9 - p * .4), M * .012, '240,255,170', Math.sin(p * Math.PI) * .8); }
  },
};
const HUG = { // impasto close-up: holding the books she has loved
  still(g, W, H, S) { const M = Math.min(W, H), src = off(W, H), q = src.getContext('2d');
    vgrad(q, W, H, [[0, '#e8dcc0'], [1, '#c9b48e']]); q.fillStyle = '#7f9bb0'; q.fillRect(W * .78, 0, W * .22, H); q.fillStyle = '#5f7a90'; q.fillRect(W * .8, H * .1, W * .03, H * .9);
    q.fillStyle = '#9a8a6a'; q.fillRect(W * .08, H * .06, W * .14, H * .18); q.fillStyle = '#c49a8a'; q.fillRect(W * .1, H * .08, W * .1, H * .14); q.fillStyle = '#8a9a6a'; q.fillRect(W * .25, H * .03, W * .1, H * .12);
    q.fillStyle = '#5a3a2a'; q.fillRect(0, H * .62, W * .22, H * .05); q.fillStyle = 'rgba(200,220,220,.6)'; q.fillRect(W * .05, H * .45, W * .06, H * .17);
    for (let i = 0; i < 60; i++) { q.fillStyle = '#fbf6ea'; q.beginPath(); q.arc(W * (.03 + hash(i, 291) * .12), H * (.32 + hash(i, 292) * .15), M * .008, 0, TAU); q.fill(); }
    q.fillStyle = '#7a2a24'; q.fillRect(0, H * .9, W, H * .1);
    S.paint = [0, 1, 2].map(f => { const c = off(W, H), cg = c.getContext('2d'); cg.drawImage(src, 0, 0);
      strokes(cg, src, W, H, { cell: Math.max(6, M / 70), len: M / 30, width: M / 140, seed: 3 + f, angle: (x, y) => -.3 + fbm(x / W * 3, y / H * 3) * 1.4, outline: .15, outlineMix: .3, jitterCol: 22 }); grain(cg, W, H, 23 + f, .06); return c; }); },
  live(g, W, H, t, S) { const M = Math.min(W, H);
    g.drawImage(S.paint[Math.floor(t * 4) % 3], 0, 0);
    const h = H * 1.15, br = Math.sin(t * 1.2) * H * .006, her = S.her || (S.her = lit('read', h, { lx: .5, ly: .3, shade: 'rgba(80,50,30,.25)', warm: 'rgba(255,220,170,.2)' }));
    if (her) g.drawImage(her, W * .5 - her.width / 2, H * .02 + br);
    // the stack she holds, spines toward us with gold tooling
    const cols = ['#7a2420', '#2f4a3a', '#c8b07a', '#2e3e66', '#8a3a24', '#3a5040', '#d0bc8a', '#5a2a22'];
    const bw = Math.min(W * .42, h * .3), x0 = W * .5 - bw * .5, n = cols.length, bh = H * .065; let y = H * .52 + br;
    for (let k = 0; k < n; k++) { const off2 = (hash(k, 301) - .5) * bw * .12, w2 = bw * (.92 + hash(k, 302) * .12);
      book(g, x0 + off2, y, w2, bh * .95, cols[k], '#efe2c2', k + 310, true);
      g.fillStyle = 'rgba(230,190,110,.75)'; for (let d = 0; d < 3; d++) star4(g, x0 + off2 + w2 * (.25 + d * .18), y + bh * .48, bh * .22, .8);
      y += bh; }
    for (let i = 0; i < 18; i++) { const p = (t * .04 + hash(i, 321)) % 1; g.fillStyle = `rgba(255,240,200,${Math.sin(p * Math.PI) * .6})`; g.fillRect(W * hash(i, 322), H * (1 - p), 2, 2); }
  },
};

SCENES.splice(5, 0, HANG, CABIN); SCENES.push(HUG);

export function mountMindStory(host, { base = './', budget = 420000 } = {}) {
  for (const [k, s] of Object.entries(SRC)) if (!IMG[k]) { const im = new Image(); im.decoding = 'async'; im.src = base + s; IMG[k] = im; }
  const cv = off(10, 10); cv.className = 'vcv'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d'), layer = off(10, 10), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = 0, prev = -1, tChange = 0, raf = 0, last = -1, visible = true, area = 0, cache = [];
  const t0 = performance.now() - 3000;
  const size = () => { const r = host.getBoundingClientRect(); area = r.width * r.height; const s = Math.min(1.5, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(240, Math.round(r.height * s)); cv.width = layer.width = W; cv.height = layer.height = H; cache = []; last = -1; };
  const paint = (g, j, t) => {
    const C = cache[j] || (cache[j] = { still: null }); if (!C.still) { C.still = off(W, H); SCENES[j].still(C.still.getContext('2d'), W, H, C); }
    g.drawImage(C.still, 0, 0); SCENES[j].live(g, W, H, t, C);
  };
  const draw = t => {
    paint(ctx, cur, t);
    const p = prev < 0 ? 1 : clamp((t - tChange) / 1.1);
    if (p < 1) { const g2 = layer.getContext('2d'); g2.clearRect(0, 0, W, H); paint(g2, prev, t); ctx.globalAlpha = 1 - ss(0, 1, p); ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1; } else prev = -1;
  };
  const frame = now => { raf = requestAnimationFrame(frame); if (!visible || document.hidden) return; const step = Math.floor((now - t0) / 1000 * 12); if (step === last) return; last = step; draw(step / 12); };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) { size(); if (reduce) draw(6); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  // sprites arrive after the first frames: drop the cached lit copies so they get made
  Object.values(IMG).forEach(im => im.addEventListener('load', () => cache.forEach(C => { if (C) { C.her = null; C.sil = null; } }), { once: true }));
  if (reduce) setTimeout(() => draw(6), 400); else raf = requestAnimationFrame(frame);
  return {
    canvas: cv, style: "Minh's reading life · nine living paintings",
    chapter(j) { j = clamp(j, 0, SCENES.length - 1); if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = Math.floor((performance.now() - t0) / 1000 * 12) / 12; if (reduce) draw(6); },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}
export const MIND_CHAPTERS = SCENES.length;
// for exporting the story as a film: paint chapter j at time t into any 2D context
export function paintMindFrame(g, W, H, j, t, cache) {
  const C = cache[j] || (cache[j] = {}); if (!C.still) { C.still = off(W, H); SCENES[j].still(C.still.getContext('2d'), W, H, C); }
  g.drawImage(C.still, 0, 0); SCENES[j].live(g, W, H, t, C);
}
export const mindSpritesReady = () => Promise.all(Object.entries(SRC).map(([k, s]) => IMG[k] && IMG[k].complete ? 1 : new Promise(r => { const im = new Image(); im.onload = r; im.onerror = r; im.src = './' + s; IMG[k] = im; })));
