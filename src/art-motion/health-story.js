// health-story.js — the Health vision as five living paintings, composed after Tuệ Minh's health mood board:
// discipline (the back, the ponytail), tree pose in a garden room with her cat, the pull-up bar above the city,
// balance by a still lake, and sunrise at eighty. Painted in code with the huashu toolkit + her own sprites.
import { TAU, clamp, lerp, ss, hash, fbm, grain, strokes } from './core.js';
import { off, lit, glow, vgrad, twinkle, loadPoses } from './mind-story.js';

const SK = '#e9b48f', SK_D = '#b97c5c', HR = '#2a1a12';
const cap = (g, x1, y1, x2, y2, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
// two-bone arm: shoulder → hand with a given bone length, elbow bending outward (side = ±1)
const elbow = (sx, sy, hx, hy, L, side) => { const dx = hx - sx, dy = hy - sy, d = Math.min(Math.hypot(dx, dy), L * 1.98), a = Math.atan2(dy, dx), b = Math.acos(clamp(d / (2 * L), -1, 1));
  const ang = a - side * b; return [sx + Math.cos(ang) * L, sy + Math.sin(ang) * L]; };

// her, seen from behind: short brown bob tied up, sports top with crossed straps — drawn, not a sprite (the sprites face us)
function backView(g, x, y, s, { hands, top = '#1d1d22', strap = '#8a7a62', rim = 'rgba(255,200,140,.0)', pants = null, t = 0, sil = null }) {
  const SKIN = sil || SK, SKIN_D = sil || SK_D, HAIR = sil || HR; if (sil) { top = strap = sil; if (pants) pants = sil; }
  const sh = [[x - .3 * s, y + .05 * s], [x + .3 * s, y + .05 * s]];
  g.save(); if (rim) { g.shadowColor = rim; g.shadowBlur = s * .06; }
  // arms behind the head first (upper arm, forearm)
  hands.forEach((h, i) => { const side = i ? 1 : -1, [ex, ey] = elbow(sh[i][0], sh[i][1], h[0], h[1], .33 * s, -side);
    cap(g, sh[i][0], sh[i][1], ex, ey, .12 * s, SKIN_D); cap(g, sh[i][0], sh[i][1], ex, ey, .09 * s, SKIN); cap(g, ex, ey, h[0], h[1], .085 * s, SKIN_D); cap(g, ex, ey, h[0], h[1], .06 * s, SKIN);
    const q2 = g.createRadialGradient(sh[i][0] - side * .02 * s, sh[i][1] - .02 * s, 0, sh[i][0], sh[i][1], .12 * s); q2.addColorStop(0, sil || '#f6cfae'); q2.addColorStop(1, SKIN_D); g.fillStyle = q2; g.beginPath(); g.ellipse(sh[i][0], sh[i][1] + .02 * s, .1 * s, .11 * s, side * .4, 0, TAU); g.fill(); });
  // torso: shoulders → lats → waist
  const q = g.createLinearGradient(x - .3 * s, 0, x + .3 * s, 0); q.addColorStop(0, SKIN_D); q.addColorStop(.25, SKIN); q.addColorStop(.6, sil || '#f3c6a3'); q.addColorStop(1, SKIN_D);
  g.fillStyle = q; g.beginPath(); g.moveTo(x - .1 * s, y - .04 * s); g.quadraticCurveTo(x - .3 * s, y - .02 * s, x - .33 * s, y + .1 * s); g.quadraticCurveTo(x - .3 * s, y + .34 * s, x - .15 * s, y + .62 * s); g.quadraticCurveTo(x - .17 * s, y + .72 * s, x - .19 * s, y + .78 * s);
  g.lineTo(x + .19 * s, y + .78 * s); g.quadraticCurveTo(x + .17 * s, y + .72 * s, x + .15 * s, y + .62 * s); g.quadraticCurveTo(x + .3 * s, y + .34 * s, x + .33 * s, y + .1 * s); g.quadraticCurveTo(x + .3 * s, y - .02 * s, x + .1 * s, y - .04 * s); g.fill();
  g.restore();
  if (!sil) {
  // muscle: spine and shoulder blades, soft
  g.strokeStyle = 'rgba(140,80,50,.35)'; g.lineWidth = s * .012; g.beginPath(); g.moveTo(x, y + .05 * s); g.lineTo(x, y + .75 * s); g.stroke();
  [-1, 1].forEach(k => { g.beginPath(); g.moveTo(x + k * .06 * s, y + .14 * s); g.quadraticCurveTo(x + k * .2 * s, y + .2 * s, x + k * .14 * s, y + .36 * s); g.stroke(); });
  // the top: band + crossed straps
  g.fillStyle = top; g.fillRect(x - .27 * s, y + .44 * s, .54 * s, .14 * s);
  [[-1, strap], [1, top]].forEach(([k, c]) => { g.strokeStyle = c; g.lineWidth = s * .035; g.beginPath(); g.moveTo(x + k * .2 * s, y + .02 * s); g.lineTo(x - k * .14 * s, y + .48 * s); g.stroke(); });
  }
  if (pants) { g.fillStyle = pants; g.beginPath(); g.moveTo(x - .17 * s, y + .7 * s); g.lineTo(x + .17 * s, y + .7 * s); g.quadraticCurveTo(x + .26 * s, y + .86 * s, x + .16 * s, y + .98 * s); g.lineTo(x - .16 * s, y + .98 * s); g.quadraticCurveTo(x - .26 * s, y + .86 * s, x - .17 * s, y + .7 * s); g.fill(); }
  // neck + head (all hair from behind), the bob gathered into a little tail
  g.fillStyle = SKIN_D; g.fillRect(x - .055 * s, y - .16 * s, .11 * s, .16 * s);
  const hq = g.createRadialGradient(x - .04 * s, y - .34 * s, 0, x, y - .27 * s, .16 * s); hq.addColorStop(0, sil || '#6a4630'); hq.addColorStop(1, HAIR); g.fillStyle = hq; g.beginPath(); g.ellipse(x, y - .27 * s, .13 * s, .15 * s, 0, 0, TAU); g.fill(); g.fillStyle = HAIR;
  g.beginPath(); g.moveTo(x - .13 * s, y - .25 * s); g.quadraticCurveTo(x - .15 * s, y - .08 * s, x - .08 * s, y - .1 * s); g.lineTo(x + .08 * s, y - .1 * s); g.quadraticCurveTo(x + .15 * s, y - .08 * s, x + .13 * s, y - .25 * s); g.fill();
  g.beginPath(); g.arc(x, y - .43 * s, .065 * s, 0, TAU); g.fill();   // the bun
  if (!sil) for (let k = 0; k < 7; k++) { g.strokeStyle = 'rgba(160,110,70,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + (k - 3) * .03 * s, y - .4 * s); g.quadraticCurveTo(x + (k - 3) * .04 * s, y - .25 * s, x + (k - 3) * .035 * s, y - .12 * s); g.stroke(); }
}

const SCENES = [
  { // I · discipline — tying her hair before training, rim light on a dark textured wall
    still(g, W, H) { vgrad(g, W, H, [[0, '#2c2c30'], [1, '#141416']]);
      for (let i = 0; i < 5000; i++) { const x = hash(i, 11) * W, y = hash(i, 12) * H, n = fbm(x / W * 5, y / H * 5); g.fillStyle = `rgba(${n > .5 ? '90,90,96' : '8,8,10'},${Math.abs(n - .5) * .5})`; g.fillRect(x, y, 3, 3); }
      grain(g, W, H, 13, .08); },
    live(g, W, H, t, S) { const M = Math.min(W, H);
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .5, H * .45, M * .55, '255,200,150', .12); g.restore();
      const h = H * .78, sil = S.sil || (S.sil = lit('wave', h, { sil: '#0e0d10' })), rim = S.rim || (S.rim = lit('wave', h, { sil: '#ffc890' }));
      if (sil) { const x = W * .5 - sil.width / 2, y = H * .24 + Math.sin(t * 1.4) * H * .004; g.save(); g.shadowColor = 'rgba(255,180,110,.8)'; g.shadowBlur = M * .05; g.drawImage(rim, x + M * .004, y - M * .003); g.restore(); g.drawImage(sil, x, y); }
      for (let i = 0; i < 70; i++) { const q = (t * .02 + hash(i, 21)) % 1; g.fillStyle = `rgba(255,240,220,${Math.sin(q * Math.PI) * .7})`; g.fillRect(hash(i, 22) * W, H * (1 - q), 1.6, 1.6); }
      const word = 'DISCIPLINE.', n = clamp(Math.floor((t % 9) * 3), 0, word.length);
      g.fillStyle = 'rgba(255,255,255,.92)'; g.font = `600 ${Math.round(M * .045)}px "Bricolage Grotesque", system-ui, sans-serif`; g.textAlign = 'center';
      g.save(); g.letterSpacing = `${Math.round(M * .03)}px`; g.fillText(word.slice(0, n), W * .5, H * .15); g.restore(); g.textAlign = 'left';
    },
  },
  { // II · tree pose in the garden room — curtains, wind chime, her cat stretching
    still(g, W, H, S) { const M = Math.min(W, H);
      g.fillStyle = '#d8c6a8'; g.fillRect(0, 0, W, H);
      // the glass gable and the garden behind it
      g.save(); g.beginPath(); g.moveTo(W * .5, H * .02); g.lineTo(W * .95, H * .55); g.lineTo(W * .95, H * .72); g.lineTo(W * .05, H * .72); g.lineTo(W * .05, H * .55); g.closePath(); g.clip();
      vgrad(g, W, H, [[0, '#e8eedc'], [.7, '#b9c9a0']]);
      for (let i = 0; i < 900; i++) { const x = hash(i, 31) * W, y = H * (.1 + hash(i, 32) * .65), r = M * (.008 + hash(i, 33) * .02); g.fillStyle = `rgba(${60 + hash(i, 34) * 50},${100 + hash(i, 35) * 50},${60 + hash(i, 36) * 30},.6)`; g.beginPath(); g.ellipse(x, y, r * 1.4, r, hash(i, 37) * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(220,120,110,.8)'; g.beginPath(); g.arc(W * (.1 + hash(i, 38) * .3), H * (.35 + hash(i, 39) * .3), M * .01, 0, TAU); g.fill(); }
      g.restore();
      g.strokeStyle = '#6a4a2e'; g.lineWidth = M * .01; g.beginPath(); g.moveTo(W * .05, H * .55); g.lineTo(W * .5, H * .02); g.lineTo(W * .95, H * .55); g.stroke(); [.33, .67].forEach(u => { g.beginPath(); g.moveTo(W * u, H * .72); g.lineTo(W * u, H * (.55 - Math.abs(u - .5) * 1.0 + .05)); g.stroke(); });
      // floor, rug
      g.fillStyle = "#a88a68"; g.fillRect(0, H * .72, W, H * .28);
      g.fillStyle = '#e6d8bf'; g.beginPath(); g.moveTo(W * .36, H * .76); g.lineTo(W * .64, H * .76); g.lineTo(W * .78, H); g.lineTo(W * .22, H); g.fill();
      g.strokeStyle = 'rgba(90,70,50,.6)'; g.lineWidth = 1.5; for (let r = 0; r < 6; r++) { const y = H * (.79 + r * .035), w = lerp(.28, .54, r / 6) * W; g.beginPath(); for (let k = 0; k <= 12; k++) g.lineTo(W * .5 - w / 2 + k * w / 12, y + (k % 2 ? -4 : 4)); g.stroke(); }
      // plants, candle table, mat, bottle, cushion
      const pot = (x, y, w) => { g.fillStyle = '#b89a6a'; g.fillRect(x - w / 2, y, w, w * .8); g.strokeStyle = '#7a5f3a'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x - w / 2, y + k * w * .16); g.lineTo(x + w / 2, y + k * w * .16); g.stroke(); } };
      g.fillStyle = '#6a4a30'; g.fillRect(W * .03, H * .58, W * .17, H * .03); g.fillRect(W * .05, H * .61, W * .13, H * .14);
      pot(W * .08, H * .78, W * .1); g.fillStyle = '#4a7040'; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(W * .08, H * .78); g.quadraticCurveTo(W * (.04 + k * .01), H * .65, W * (.02 + k * .018), H * (.56 + hash(k, 41) * .06)); g.lineTo(W * (.03 + k * .018), H * (.57 + hash(k, 41) * .06)); g.closePath(); g.fill(); }
      pot(W * .9, H * .66, W * .12);
      g.fillStyle = '#8aa088'; g.beginPath(); g.ellipse(W * .1, H * .9, W * .08, H * .03, -.2, 0, TAU); g.fill();
      g.fillStyle = 'rgba(230,240,230,.8)'; g.fillRect(W * .16, H * .86, W * .04, H * .1); g.fillStyle = '#c8a050'; g.fillRect(W * .16, H * .85, W * .04, H * .015);
      g.fillStyle = '#b86a3e'; g.beginPath(); g.ellipse(W * .88, H * .92, W * .1, H * .045, 0, 0, TAU); g.fill();
      grain(g, W, H, 14, .07); },
    live(g, W, H, t, S) { const M = Math.min(W, H);
      // curtains breathing in the draft
      [[-1, 0], [1, W]].forEach(([k, x0]) => { const w = Math.sin(t * .8 + k) * W * .015; g.fillStyle = 'rgba(236,226,206,.88)'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 - k * W * .3, 0);
        g.quadraticCurveTo(x0 - k * (W * .12 + w), H * .3, x0 - k * (W * .02 + w * .5), H * .62); g.lineTo(x0, H * .62); g.fill(); });
      // wind chime
      const cx = W * .72, cy = H * .32, sw = Math.sin(t * 1.7) * .08; g.save(); g.translate(cx, cy); g.rotate(sw); g.strokeStyle = '#7a5a30'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -H * .1); g.lineTo(0, 0); g.stroke();
      g.fillStyle = '#9a7040'; g.fillRect(-M * .04, 0, M * .08, M * .008); for (let k = 0; k < 4; k++) { g.save(); g.translate(-M * .03 + k * M * .02, M * .01); g.rotate(Math.sin(t * 3 + k) * .1); g.fillRect(-2, 0, 4, M * (.08 + k % 2 * .03)); g.restore(); } g.restore();
      // her, tree pose; the standing leg goes down to the rug
      const h = H * .55, sway = Math.sin(t * 1.1) * .015, her = S.her || (S.her = lit('yoga', h, { lx: .5, ly: .2, shade: 'rgba(90,60,30,.18)' }));
      g.save(); g.translate(W * .5, H * .93); g.rotate(sway);
      g.strokeStyle = '#4a3530'; g.lineWidth = h * .075; g.lineCap = 'round'; g.beginPath(); g.moveTo(-h * .06, -h * .32); g.lineTo(-h * .06, -h * .01); g.stroke(); g.fillStyle = '#f1c9a8'; g.beginPath(); g.ellipse(-h * .06, 0, h * .04, h * .015, 0, 0, TAU); g.fill();
      if (her) g.drawImage(her, -her.width / 2, -h * .3 - h); g.restore();
      // her cat, in a long stretch, tail up and swaying
      const kx = W * .8, ky = H * .86, k = M * .1, st = .5 + .5 * Math.sin(t * .9);
      g.fillStyle = '#2e2e34'; g.beginPath(); g.ellipse(kx, ky - k * (.35 + .1 * st), k * .55, k * .22, -.25 * st, 0, TAU); g.fill();
      g.beginPath(); g.arc(kx - k * .6, ky - k * .18, k * .17, 0, TAU); g.fill(); [-1, 1].forEach(e => { g.beginPath(); g.moveTo(kx - k * .6 + e * k * .1, ky - k * .3); g.lineTo(kx - k * .6 + e * k * .14, ky - k * .44); g.lineTo(kx - k * .6 + e * k * .02, ky - k * .33); g.fill(); });
      g.fillStyle = '#f4efe6'; g.beginPath(); g.ellipse(kx - k * .58, ky - k * .12, k * .08, k * .06, 0, 0, TAU); g.fill();
      g.strokeStyle = '#2e2e34'; g.lineWidth = k * .1; g.beginPath(); g.moveTo(kx - k * .45, ky - k * .2); g.lineTo(kx - k * .9, ky); g.moveTo(kx + k * .35, ky - k * .35); g.lineTo(kx + k * .4, ky); g.stroke();
      g.lineWidth = k * .08; g.beginPath(); g.moveTo(kx + k * .5, ky - k * .45); g.quadraticCurveTo(kx + k * .75, ky - k * 1.1, kx + k * (.55 + Math.sin(t * 2) * .15), ky - k * 1.3); g.stroke();
      // candle
      const fl = Math.sin(t * 11) * .2 + Math.sin(t * 4) * .1; g.fillStyle = '#e8c8a0'; g.fillRect(W * .12, H * .545, W * .035, H * .035);
      g.fillStyle = '#ffcf70'; g.beginPath(); g.ellipse(W * .1375, H * .535, M * .006, M * (.014 + fl * .004), 0, 0, TAU); g.fill(); g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .1375, H * .535, M * .06, '255,190,110', .6); g.restore();
      // komorebi flecks drifting over the floor
      g.save(); g.globalCompositeOperation = 'soft-light'; for (let i = 0; i < 20; i++) { const x = W * (.25 + hash(i, 51) * .5) + Math.sin(t * .5 + i) * 8, y = H * (.75 + hash(i, 52) * .2); glow(g, x, y, M * .04, '255,245,200', .5); } g.restore();
    },
  },
  { // III · pull-ups above the city — a teal morning in the gym, the body pulling itself up
    still(g, W, H) { const M = Math.min(W, H);
      vgrad(g, W, H, [[0, '#26343c'], [.5, '#5d7f88'], [1, '#1b2428']]);
      g.fillStyle = 'rgba(200,225,230,.55)'; g.fillRect(W * .18, H * .2, W * .64, H * .62);
      g.fillStyle = 'rgba(120,150,160,.7)'; for (let i = 0; i < 9; i++) { const x = W * (.2 + i * .07), h = H * (.1 + hash(i, 61) * .25); g.fillRect(x, H * .82 - h, W * .05, h); }
      g.strokeStyle = '#1e2a30'; g.lineWidth = M * .008; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(W * (.18 + k * .213), H * .2); g.lineTo(W * (.18 + k * .213), H * .82); g.stroke(); } [.2, .5, .82].forEach(y => { g.beginPath(); g.moveTo(W * .18, H * y); g.lineTo(W * .82, H * y); g.stroke(); });
      g.fillStyle = 'rgba(30,50,40,.6)'; for (let i = 0; i < 300; i++) { const x = W * (.8 + hash(i, 62) * .2), y = H * (.3 + hash(i, 63) * .5); g.beginPath(); g.ellipse(x, y, M * .015, M * .008, hash(i, 64) * 3, 0, TAU); g.fill(); }
      // the rack
      g.fillStyle = '#1a1f22'; [[.08, .06], [.86, .06]].forEach(([x, w]) => { g.fillRect(W * x, 0, W * w, H); g.fillStyle = '#2a3236'; for (let k = 0; k < 40; k++) { g.beginPath(); g.arc(W * (x + w / 2), H * (k * .025), M * .005, 0, TAU); g.fill(); } g.fillStyle = '#1a1f22'; });
      g.fillStyle = '#121618'; [[.05, .9, .1], [.12, .95, .07]].forEach(([x, y, r]) => { g.beginPath(); g.arc(W * x, H * y, M * r, 0, TAU); g.fill(); });
      for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(W * (.35 + k * .05), H * .93, M * .02, 0, TAU); g.fill(); }
      g.fillStyle = '#0f1214'; g.fillRect(W * .5, H * .88, W * .25, H * .02);
      grain(g, W, H, 15, .06); },
    live(g, W, H, t, S) { const M = Math.min(W, H);
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .5, H * .35, M * .6, '170,220,230', .18); for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(200,235,240,${.03 + .02 * Math.sin(t + i)})`; g.beginPath(); g.moveTo(W * (.3 + i * .1), 0); g.lineTo(W * (.36 + i * .1), 0); g.lineTo(W * (.2 + i * .1), H); g.lineTo(W * (.1 + i * .1), H); g.fill(); } g.restore();
      // the bar
      const by = H * .17; g.fillStyle = '#0c0f10'; g.fillRect(W * .08, by - M * .008, W * .84, M * .016);
      // pull cycle: hang → pull (chin over bar) → hold → lower
      const c = t % 3.2, p = c < 1 ? ss(0, 1, c) : c < 1.6 ? 1 : c < 2.6 ? 1 - ss(1.6, 2.6, c) : 0;
      const s = M * .36, x = W * .5, shY = by + s * (.62 - .42 * p);
      // legs: bent at the knee, crossed, swaying a touch
      const hy = shY + .9 * s, sw = Math.sin(t * 1.3) * .03 * s;
      g.save(); g.shadowColor = 'rgba(200,240,255,.75)'; g.shadowBlur = s * .06; g.strokeStyle = '#0f1112'; g.lineCap = 'round'; g.lineWidth = .14 * s; g.beginPath(); g.moveTo(x - .08 * s, hy); g.lineTo(x - .04 * s + sw, hy + .42 * s); g.lineTo(x + .06 * s + sw, hy + .72 * s); g.stroke();
      g.beginPath(); g.moveTo(x + .08 * s, hy); g.lineTo(x + .05 * s + sw, hy + .42 * s); g.lineTo(x - .04 * s + sw, hy + .7 * s); g.stroke();
      g.fillStyle = '#2a2e30'; [[x + .06 * s + sw, hy + .76 * s], [x - .04 * s + sw, hy + .74 * s]].forEach(([fx, fy]) => { g.beginPath(); g.ellipse(fx, fy, .055 * s, .08 * s, 0, 0, TAU); g.fill(); }); g.restore();
      backView(g, x, shY, s, { hands: [[x - .36 * s, by], [x + .36 * s, by]], pants: '#0f1112', rim: 'rgba(200,240,255,.75)', t, sil: '#0f1112' });
      g.fillStyle = '#0c0f10'; [-1, 1].forEach(k => { g.beginPath(); g.arc(x + k * .36 * s, by, .05 * s, 0, TAU); g.fill(); });
      // the count
      const reps = Math.floor(t / 3.2) % 12 + 1; g.fillStyle = 'rgba(230,245,250,.85)'; g.font = `600 ${Math.round(M * .05)}px "Bricolage Grotesque", system-ui, sans-serif`; g.fillText(String(reps).padStart(2, '0'), W * .7, H * .95);
      g.font = `${Math.round(M * .022)}px "Cutive Mono", monospace`; g.fillText('PULL-UPS', W * .7, H * .97 - M * .065);
    },
  },
  { // IV · balance — a still lake at dawn, a leaning tree and its reflection; she breathes on the shore
    still(g, W, H, S) { const M = Math.min(W, H), hz = H * .6;
      vgrad(g, W, H, [[0, '#c7d3cc'], [.55, '#dfe5dc'], [.6, '#a9b8ad'], [1, '#7e9086']]);
      [[.42, '#a7b6aa', .08], [.5, '#8c9e90', .07], [.56, '#6f8476', .05]].forEach(([y, c, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 4) g.lineTo(x, H * (y - a * fbm(x / W * 3 + k * 5, k))); g.lineTo(W, hz); g.fill(); });
      // the leaning tree, ink branches, and its mirror
      const tree = (sgn, alpha) => { g.save(); g.globalAlpha = alpha; g.translate(0, hz); g.scale(1, sgn); g.strokeStyle = '#2a2a24'; g.lineCap = 'round';
        const br = (x, y, a, l, w, d) => { if (d > 7 || l < 3) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + l * .1, (y + y2) / 2, x2, y2); g.stroke();
          br(x2, y2, a - .35 - hash(d, l | 0) * .3, l * .72, w * .68, d + 1); br(x2, y2, a + .3 + hash(d + 9, l | 0) * .3, l * .66, w * .65, d + 1); if (d > 3) { g.fillStyle = 'rgba(110,130,60,.5)'; g.beginPath(); g.arc(x2, y2, l * .3, 0, TAU); g.fill(); } };
        br(W * .68, 0, -2.2, M * .2, M * .03, 0); g.restore(); };
      tree(1, 1); tree(-1, .35);
      g.fillStyle = 'rgba(200,215,205,.4)'; g.fillRect(0, hz, W, H - hz);
      grain(g, W, H, 16, .05); },
    live(g, W, H, t, S) { const M = Math.min(W, H), hz = H * .6;
      for (let i = 0; i < 26; i++) { const y = hz + Math.pow(hash(i, 71), 1.5) * (H - hz), x = (hash(i, 72) + t * .01 * (1 + hash(i, 73))) % 1 * W; g.strokeStyle = `rgba(255,255,250,${.25 + .2 * Math.sin(t + i)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + W * .05 * (y - hz) / H * 2, y); g.stroke(); }
      for (let i = 0; i < 6; i++) { const x = ((hash(i, 74) + t * .008) % 1.3 - .15) * W, y = H * (.45 + hash(i, 75) * .1); g.fillStyle = 'rgba(240,244,240,.25)'; g.beginPath(); g.ellipse(x, y, W * .2, H * .02, 0, 0, TAU); g.fill(); }
      const word = 'BALANCE', a = ss(0, 2, t % 12) * (1 - ss(9, 11, t % 12)); g.fillStyle = `rgba(255,255,255,${.85 * a})`; g.font = `300 ${Math.round(M * .05)}px "Bricolage Grotesque", system-ui, sans-serif`; g.textAlign = 'center';
      g.save(); g.letterSpacing = `${Math.round(M * .025)}px`; g.fillText(word, W * .66, H * .3); g.restore(); g.textAlign = 'left';
      // her, cross-legged on a cushion at the water's edge, breathing (the circle grows and shrinks with her)
      const b = .5 + .5 * Math.sin(t * TAU / 8), h = H * .36, her = S.her || (S.her = lit('meditate', h, { lx: .7, ly: .2, shade: 'rgba(60,80,70,.25)' }));
      g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * .3, H * .66, M * (.18 + .08 * b), '255,250,230', .25); g.restore();
      g.fillStyle = '#e6e0d2'; g.beginPath(); g.ellipse(W * .3, H * .9, h * .32, h * .07, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a3530'; g.beginPath(); g.ellipse(W * .3, H * .86, h * .22, h * .07, 0, 0, TAU); g.fill();
      if (her) g.drawImage(her, W * .3 - her.width / 2, H * .87 - h * (1 + .006 * b));
      g.fillStyle = 'rgba(60,70,60,.6)'; g.font = `${Math.round(M * .022)}px "Cutive Mono", monospace`; g.textAlign = 'center'; g.fillText(b > .5 ? 'breathe in' : 'breathe out', W * .3, H * .97); g.textAlign = 'left';
    },
  },
  { // V · at eighty — sunrise over the mountains, silver hair, the cat asleep on the cushion
    still(g, W, H, S) { const M = Math.min(W, H);
      g.fillStyle = '#e9ddc8'; g.fillRect(0, 0, W, H);
      const wx0 = W * .16, wx1 = W * .84, wy0 = H * .04, wy1 = H * .68;
      g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
      vgrad(g, W, H, [[0, '#b8c4d8'], [.35, '#f0c8a8'], [.55, '#f6d8b8'], [1, '#3e4c4a']]);
      [[.4, '#a49cb8', .16], [.48, '#8a86a6', .12], [.58, '#55665c', .08]].forEach(([y, c, a], k) => { g.fillStyle = c; g.beginPath(); g.moveTo(wx0, wy1); for (let x = wx0; x <= wx1; x += 3) { const u = (x - wx0) / (wx1 - wx0); g.lineTo(x, H * (y - a * Math.max(0, 1 - Math.abs(u - (.35 + k * .2)) * 2.4) - .02 * fbm(u * 8, k))); } g.lineTo(wx1, wy1); g.fill(); });
      g.restore();
      g.strokeStyle = '#6a4a30'; g.lineWidth = M * .014; g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.beginPath(); g.moveTo(W * .5, wy0); g.lineTo(W * .5, wy1); g.moveTo(wx0, H * .2); g.lineTo(wx1, H * .2); g.stroke();
      g.fillStyle = '#b89a78'; g.fillRect(0, H * .7, W, H * .3);
      g.fillStyle = '#e8dcc4'; g.beginPath(); g.moveTo(W * .38, H * .74); g.lineTo(W * .62, H * .74); g.lineTo(W * .74, H); g.lineTo(W * .26, H); g.fill();
      [[.04, .1, '#c98a5a'], [.88, .14, '#6a8a6a']].forEach(([x, y, c]) => { g.fillStyle = '#f4ece0'; g.fillRect(W * x, H * y, W * .08, H * .12); g.fillStyle = c; g.beginPath(); g.arc(W * (x + .04), H * (y + .05), M * .025, 0, TAU); g.fill(); });
      g.fillStyle = '#7a5a3a'; g.fillRect(W * .02, H * .52, W * .13, H * .03); g.fillRect(W * .04, H * .55, W * .09, H * .17);
      g.fillStyle = '#e8c9a0'; g.beginPath(); g.moveTo(W * .05, H * .42); g.lineTo(W * .11, H * .42); g.lineTo(W * .13, H * .48); g.lineTo(W * .03, H * .48); g.fill(); g.fillStyle = '#b8866a'; g.fillRect(W * .07, H * .48, W * .02, H * .04);
      g.fillStyle = '#b86a3e'; g.beginPath(); g.ellipse(W * .86, H * .9, W * .11, H * .05, 0, 0, TAU); g.fill();
      grain(g, W, H, 17, .06); },
    live(g, W, H, t, S) { const M = Math.min(W, H);
      const sunY = H * (.42 - .05 * ss(0, 6, t % 30)); g.save(); g.beginPath(); g.rect(W * .16, H * .04, W * .68, H * .64); g.clip();
      g.globalCompositeOperation = 'screen'; glow(g, W * .62, sunY, M * .35, '255,210,150', .55); g.fillStyle = 'rgba(255,245,220,.9)'; g.beginPath(); g.arc(W * .62, sunY, M * .045, 0, TAU); g.fill(); g.restore();
      g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 5; i++) { const a = .05 + .04 * Math.sin(t * .6 + i); g.fillStyle = `rgba(255,220,170,${a})`; g.beginPath(); g.moveTo(W * (.6 + i * .03), H * .2); g.lineTo(W * (.64 + i * .03), H * .2); g.lineTo(W * (.3 + i * .1), H); g.lineTo(W * (.22 + i * .1), H); g.fill(); } g.restore();
      // her at eighty: silver bob, the same sweater, tea in hand, watching the sun come up
      const h = H * .5, sway = Math.sin(t * 1) * .012, her = S.her || (S.her = lit('old', h, { lx: .7, ly: .3, shade: 'rgba(120,80,50,.2)', warm: 'rgba(255,200,150,.25)' }));
      g.save(); g.translate(W * .5, H * .95); g.rotate(sway);
      g.strokeStyle = '#5a4038'; g.lineWidth = h * .08; g.lineCap = 'round'; g.beginPath(); g.moveTo(-h * .05, -h * .3); g.lineTo(-h * .05, -h * .01); g.stroke();
      g.beginPath(); g.moveTo(h * .05, -h * .3); g.lineTo(h * .05, -h * .01); g.stroke();
      if (her) g.drawImage(her, -her.width / 2, -h * .3 - h); g.restore();
      // the cat asleep on the cushion, breathing
      const kb = 1 + .03 * Math.sin(t * 1.5), kx = W * .86, ky = H * .87, k = M * .08; g.fillStyle = '#2e2e34'; g.beginPath(); g.ellipse(kx, ky, k * .7 * kb, k * .38 * kb, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(kx - k * .55, ky + k * .05, k * .22, 0, TAU); g.fill(); g.fillStyle = '#f4efe6'; g.beginPath(); g.ellipse(kx - k * .55, ky + k * .14, k * .1, k * .06, 0, 0, TAU); g.fill();
      if ((t % 4) < 2.2) { g.fillStyle = 'rgba(80,70,90,.6)'; g.font = `${Math.round(M * .025)}px "Cutive Mono", monospace`; g.fillText('z', kx - k * .3, ky - k * (.6 + (t % 4) * .2)); }
      // a steam curl from the tea on the side table
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; for (let k2 = 0; k2 < 2; k2++) { g.beginPath(); for (let j = 0; j < 10; j++) g.lineTo(W * (.11 + k2 * .015) + Math.sin(t * 2 + j * .6 + k2) * 4, H * (.5 - j * .008)); g.stroke(); }
      g.fillStyle = '#d9c4a8'; g.fillRect(W * .1, H * .5, W * .035, H * .025);
    },
  },
];

export function mountHealthStory(host, { base = './', budget = 420000 } = {}) {
  loadPoses(base);
  const cv = off(10, 10); cv.className = 'vcv'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d'), layer = off(10, 10), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = 0, prev = -1, tChange = 0, raf = 0, last = -1, visible = true, area = 0, cache = [];
  const t0 = performance.now() - 3000;
  const size = () => { const r = host.getBoundingClientRect(); area = r.width * r.height; const s = Math.min(1.5, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(240, Math.round(r.height * s)); cv.width = layer.width = W; cv.height = layer.height = H; cache = []; last = -1; };
  const paint = (g, j, t) => { const C = cache[j] || (cache[j] = {}); if (!C.still) { C.still = off(W, H); SCENES[j].still(C.still.getContext('2d'), W, H, C); } g.drawImage(C.still, 0, 0); SCENES[j].live(g, W, H, t, C); };
  const draw = t => { paint(ctx, cur, t); const p = prev < 0 ? 1 : clamp((t - tChange) / 1.1);
    if (p < 1) { const g2 = layer.getContext('2d'); g2.clearRect(0, 0, W, H); paint(g2, prev, t); ctx.globalAlpha = 1 - ss(0, 1, p); ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1; } else prev = -1; };
  const frame = now => { raf = requestAnimationFrame(frame); if (!visible || document.hidden) return; const step = Math.floor((now - t0) / 1000 * 12); if (step === last) return; last = step; draw(step / 12); };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) { size(); if (reduce) draw(6); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) setTimeout(() => draw(6), 400); else raf = requestAnimationFrame(frame);
  return {
    canvas: cv, style: 'Discipline · balance · eighty — five living paintings',
    chapter(j) { j = clamp(j, 0, SCENES.length - 1); if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = Math.floor((performance.now() - t0) / 1000 * 12) / 12; if (reduce) draw(6); },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}
export function paintHealthFrame(g, W, H, j, t, cache) { const C = cache[j] || (cache[j] = {}); if (!C.still) { C.still = off(W, H); SCENES[j].still(C.still.getContext('2d'), W, H, C); } g.drawImage(C.still, 0, 0); SCENES[j].live(g, W, H, t, C); }
