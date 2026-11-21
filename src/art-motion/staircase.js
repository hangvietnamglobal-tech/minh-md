/* The staircase — the scale 20 → 1000 as a living painting (huashu-art-motion technique, MIT).
   Seventeen floating stone steps rise out of a glowing meadow toward a beam of light; an aurora
   curtain moves in painterly strokes, stars twinkle, gold dust drifts along the stair. Steps from
   200 (Courage, the threshold, glowing orange) up carry gold light on their edge; the steps below
   are cold stone. Minh is a small silhouette standing on the step she chose today; her cat watches
   from the meadow. Choosing a step makes her climb (or come down) to it, step by step.
   The night palette is the user's own reference (an explicit exception to huashu's blue-purple rule). */
import { TAU, clamp, lerp, ss, rng, hash, noise } from './core.js';

const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const N = 17;                                    // EN.scale order: 0 = Enlightenment (top) … 16 = Shame (bottom)
const THRESH = 8;                                // index of 200 · Courage
const stepOf = idx => N - 1 - idx;               // 0 = bottom step

export function mountStair(host, { base = './', onPick, onHover, paused } = {}) {
  const cv = off(10, 10), main = cv.getContext('2d'), auCv = off(10, 10), auG = auCv.getContext('2d'); let g = main, auT = -1; cv.className = 'stair-cv'; host.appendChild(cv);
  const sky = off(10, 10), meadow = off(10, 10);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1, raf = 0, visible = true, hover = -1, steps = [], sil = null, rim = null;
  let pos = 0, target = pos, walkT = 0, first = true, landT = -9, walking = false, mx = 0, my = 0, pmx = 0, pmy = 0;          // her position in steps (float)
  const t0 = performance.now();
  // her silhouette: her own picture, filled dark with a warm rim
  const im = new Image(); im.onload = () => {            // her sprite is cut at the thigh: paint it as a silhouette and give her legs
    const mk = (col, st) => { const s = off(220, 470), sg = s.getContext('2d'); sg.drawImage(im, 0, 0, 220, 330);
      sg.fillStyle = '#000'; sg.beginPath(); sg.moveTo(78, 318); sg.lineTo(142, 318);
      sg.lineTo(132 + st * 22, 462); sg.lineTo(116 + st * 22, 466); sg.lineTo(110, 352); sg.lineTo(104 - st * 22, 466); sg.lineTo(88 - st * 22, 462); sg.closePath(); sg.fill();
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, 220, 470); return s; };
    sil = [mk('#0a0d1a', 0), mk('#0a0d1a', 1)]; rim = [mk('#ffd08a', 0), mk('#ffd08a', 1)]; };
  im.src = base + 'poses/stand.webp';

  // the stair path: from the meadow (bottom right) curving up toward the beam (top centre-left)
  const P = u => { const x = lerp(.70, .44, ss(0, 1, u)) + Math.sin(u * 3.2) * .07, y = lerp(.86, .13, Math.pow(u, .92)); return [x * W, y * H]; };
  const wOf = u => lerp(.30, .035, Math.pow(u, .7)) * Math.min(W, H * 1.3);

  const size = () => { const r = host.getBoundingClientRect(); D = Math.min(1.5, devicePixelRatio || 1); W = Math.max(320, r.width * D | 0); H = Math.max(320, r.height * D | 0);
    for (const c of [cv, sky, meadow]) { c.width = W; c.height = H; } auCv.width = W >> 1; auCv.height = H >> 1; auT = -1; paintSky(); paintMeadow(); };
  function paintSky() {                            // the still part of the night: gradient, haze at the horizon
    const s = sky.getContext('2d'), q = s.createLinearGradient(0, 0, 0, H);
    q.addColorStop(0, '#030a3a'); q.addColorStop(.45, '#0a1a6a'); q.addColorStop(.78, '#2a3a8a'); q.addColorStop(.86, '#5a5ab0'); q.addColorStop(1, '#141a40');
    s.fillStyle = q; s.fillRect(0, 0, W, H);
  }
  function paintMeadow() {                         // a glowing flower field (pointillist dots), drawn once; twinkle is added live
    const m = meadow.getContext('2d'), r = rng(11), hz = H * .84; m.clearRect(0, 0, W, H);
    const q = m.createLinearGradient(0, hz, 0, H); q.addColorStop(0, 'rgba(40,60,90,0)'); q.addColorStop(.25, '#14301e'); q.addColorStop(1, '#0a1a10'); m.fillStyle = q; m.fillRect(0, hz - 10 * D, W, H - hz + 10 * D);
    const cols = ['#ff4f9a', '#ff8a3a', '#ffd84a', '#7af46a', '#4ad8ff', '#c87aff', '#ff5a5a', '#fff2a8'];
    for (let i = 0; i < W * H / 260; i++) { const v = Math.pow(r(), 1.6), y = hz + v * (H - hz), x = r() * W, rr = (.6 + v * 3.2) * D;
      m.fillStyle = cols[(r() * cols.length) | 0]; m.globalAlpha = .45 + r() * .5; m.beginPath(); m.arc(x, y, rr, 0, TAU); m.fill();
      if (r() < .25) { m.strokeStyle = '#2f6a3a'; m.globalAlpha = .5; m.lineWidth = D; m.beginPath(); m.moveTo(x, y + rr); m.lineTo(x + (r() - .5) * 4 * D, y + rr + 10 * D * (1 + v)); m.stroke(); } }
    m.globalAlpha = 1;
  }
  const aurora = t => {                            // painterly curtains: three ribbons of thin strokes, waving like cloth
    g.save(); g.globalCompositeOperation = 'screen';
    for (let band = 0; band < 3; band++) {
      const off0 = band * 1.7, top = band === 1 ? '255,120,220' : '90,140,255';
      for (let i = 0; i < 150; i++) {
        const u = i / 150, x = (u * 1.3 - .15 + band * .06) * W + Math.sin(t * .5 + u * 6 + off0) * 30 * D;
        const base = (.66 - .44 * u + Math.sin(u * 5 + t * .7 + off0) * .07 + noise(u * 3 + band, t * .15) * .1 - band * .05) * H;
        const len = (.18 + .22 * noise(u * 7 + 3 + band, t * .3)) * H;
        const a = (.05 + .09 * Math.pow(.5 + .5 * Math.sin(u * 22 - t * 2.2 + off0), 2)) * (band === 0 ? 1.2 : .8);   // light running along the curtain
        const q = g.createLinearGradient(x, base, x, base - len); q.addColorStop(0, `rgba(120,255,190,${a * 1.7})`); q.addColorStop(.55, `rgba(70,210,170,${a})`); q.addColorStop(1, `rgba(${top},0)`);
        g.strokeStyle = q; g.lineWidth = (2 + 3 * hash(i, 4 + band)) * D; g.beginPath(); g.moveTo(x, base);
        g.quadraticCurveTo(x + Math.sin(t * 1.1 + u * 9) * 14 * D, base - len * .5, x + Math.sin(t * .8 + u * 11 + band) * 22 * D, base - len); g.stroke();
      }
    }
    g.restore();
  };
  const shoot = t => {                             // a shooting star every few seconds
    const per = 5.5, n = Math.floor(t / per), f = (t - n * per) / 1.1; if (f > 1) return;
    const sx = (.15 + hash(n, 31) * .7) * W, sy = (.04 + hash(n, 32) * .25) * H, L = .22 * W, dx = -.8, dy = .45;
    const hx = sx + dx * L * f, hy = sy + dy * L * f, a = Math.sin(f * Math.PI);
    const q = g.createLinearGradient(hx, hy, hx - dx * L * .4, hy - dy * L * .4); q.addColorStop(0, `rgba(255,255,240,${a})`); q.addColorStop(1, 'rgba(255,255,240,0)');
    g.save(); g.strokeStyle = q; g.lineWidth = 2 * D; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - dx * L * .4, hy - dy * L * .4); g.stroke(); g.restore();
  };
  const fireflies = t => {                          // fireflies drifting up from the meadow and around the stair
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 46; i++) { const p = (t * (.03 + hash(i, 41) * .04) + hash(i, 42)) % 1, x = (hash(i, 43) + Math.sin(t * .7 + i) * .03) * W, y = H * (.95 - p * .55) + Math.sin(t * 1.3 + i * 2) * 10 * D;
      const a = Math.sin(p * Math.PI) * Math.pow(.5 + .5 * Math.sin(t * 3 + i * 5), 2), r = (5 + hash(i, 44) * 7) * D;
      const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(230,255,150,${a})`); q.addColorStop(1, 'rgba(230,255,150,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.restore();
  };
  const sway = t => {                               // tall flowers in the foreground bending in the wind
    const hz = H * .84;
    for (let i = 0; i < 70; i++) { const x = hash(i, 51) * W, y = hz + (.35 + .65 * hash(i, 52)) * (H - hz), h = (24 + hash(i, 53) * 46) * D, wind = Math.sin(t * 1.4 + x / W * 6) * .5 + Math.sin(t * 3.1 + i) * .12;
      const tx = x + wind * h * .5, ty = y - h;
      g.strokeStyle = 'rgba(40,90,50,.8)'; g.lineWidth = 1.2 * D; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x, y - h * .5, tx, ty); g.stroke();
      const c = ['255,90,160', '255,200,80', '140,255,150', '120,200,255', '210,140,255'][i % 5], gl = .6 + .4 * Math.sin(t * 2 + i), r = (3 + hash(i, 54) * 3) * D;
      g.fillStyle = `rgba(${c},${.18 * gl})`; g.beginPath(); g.arc(tx, ty, r * 3, 0, TAU); g.fill(); g.fillStyle = `rgba(${c},${.75 + .25 * gl})`; g.beginPath(); g.arc(tx, ty, r, 0, TAU); g.fill(); }
  };
  const mist = t => {                               // slow mist drifting along the horizon
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) { const x = ((hash(i, 61) + t * .006 * (1 + i % 3)) % 1.4 - .2) * W, y = H * (.8 + hash(i, 62) * .07), rx = (.18 + hash(i, 63) * .15) * W, ry = .03 * H;
      const q = g.createRadialGradient(x, y, 0, x, y, rx); q.addColorStop(0, 'rgba(150,150,230,.13)'); q.addColorStop(1, 'rgba(150,150,230,0)'); g.fillStyle = q; g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore(); }
    g.restore();
  };
  const stars = t => { const r = rng(3); for (let i = 0; i < 520; i++) { const x = r() * W, y = r() * H * .82, s = r(), tw = .35 + .65 * (.5 + .5 * Math.sin(t * (1 + s * 3) + i)); g.fillStyle = `rgba(${s > .8 ? '180,220,255' : '255,250,235'},${tw * (.4 + s * .6)})`; g.fillRect(x, y, (s > .93 ? 2.4 : 1.2) * D, (s > .93 ? 2.4 : 1.2) * D); } };
  const beam = t => { const [bx] = P(1), q = g.createLinearGradient(0, 0, 0, H * .7), w = .07 * W * (1 + .08 * Math.sin(t * .9));
    g.save(); g.globalCompositeOperation = 'screen'; q.addColorStop(0, 'rgba(140,240,255,.55)'); q.addColorStop(.6, 'rgba(80,160,255,.12)'); q.addColorStop(1, 'rgba(80,160,255,0)'); g.fillStyle = q;
    g.beginPath(); g.moveTo(bx - w * .5, 0); g.lineTo(bx + w * .5, 0); g.lineTo(bx + w * 1.6, H * .7); g.lineTo(bx - w * 1.6, H * .7); g.fill();
    for (let i = 0; i < 6; i++) { const o = Math.sin(t * .35 + i * 1.9) * .9, a = .05 + .05 * Math.sin(t * .8 + i); const rq = g.createLinearGradient(0, 0, 0, H * .7); rq.addColorStop(0, `rgba(200,250,255,${a})`); rq.addColorStop(1, 'rgba(200,250,255,0)'); g.strokeStyle = rq; g.lineWidth = (6 + i * 3) * D; g.beginPath(); g.moveTo(bx + o * w * .4, 0); g.lineTo(bx + o * w * 1.5, H * .7); g.stroke(); }
    for (let i = 0; i < 40; i++) { const p = (t * (.05 + hash(i, 71) * .05) + hash(i, 72)) % 1, y = H * .7 * (1 - p), sp = lerp(1.6, .5, 1 - y / (H * .7)), x = bx + (hash(i, 73) - .5) * 2 * w * sp;
      g.fillStyle = `rgba(220,250,255,${Math.sin(p * Math.PI) * .8})`; g.fillRect(x, y, 1.6 * D, 1.6 * D); }
    g.restore(); };
  const moon = t => { const x = (W > H ? .8 : .78) * W, y = (W > H ? .2 : .1) * H + Math.sin(t * .3) * 4 * D, r = .035 * Math.min(W, H) * 1.4; g.save(); g.shadowColor = 'rgba(255,240,200,.8)'; g.shadowBlur = (26 + 12 * Math.sin(t * .9)) * D; g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); g.fillStyle = '#071044'; g.beginPath(); g.arc(x + r * .38, y - r * .28, r * .92, 0, TAU); g.fill(); };

  function drawSteps(t) {
    steps = [];
    for (let k = 0; k < N; k++) {
      const u = k / (N - 1), [x, y] = P(u), w = wOf(u), th = w * .11, d = w * .16, idx = N - 1 - k, lit = idx <= THRESH, gate = idx === THRESH, act = Math.round(pos) === k;
      const bob = Math.sin(t * .8 + k * .9) * 5 * D * (1 - u * .4), wave = Math.pow(.5 + .5 * Math.sin(t * 2.2 - k * .55), 6);
      const top = [[x - w / 2, y + bob], [x + w / 2, y + bob], [x + w / 2 - d, y - d * .55 + bob], [x - w / 2 - d, y - d * .55 + bob]];
      if (lit) { const q0 = g.createRadialGradient(x, y + th * 2, 0, x, y + th * 2, w * .6); q0.addColorStop(0, `rgba(255,200,120,${.12 + .1 * wave})`); q0.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = q0; g.fillRect(x - w * .6, y + th * 2 - w * .6, w * 1.2, w * 1.2); }
      // body
      g.fillStyle = lit ? '#2a3550' : '#1a2238'; g.beginPath(); g.moveTo(x - w / 2, y + bob); g.lineTo(x + w / 2, y + bob); g.lineTo(x + w / 2, y + th + bob); g.lineTo(x - w / 2, y + th + bob); g.fill();
      // top surface
      const glow = gate ? '255,130,60' : lit ? '255,214,120' : '150,170,210', on = hover === k || act ? 1 : 0;
      const q = g.createLinearGradient(0, y - d * .55 + bob, 0, y + bob); q.addColorStop(0, lit ? '#4a5878' : '#2c3652'); q.addColorStop(1, `rgba(${glow},${lit ? .85 : .35 + on * .3})`);
      g.fillStyle = q; g.beginPath(); top.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
      // light on the front edge
      g.save(); g.globalCompositeOperation = 'screen'; g.strokeStyle = `rgba(${glow},${Math.min(1, (lit ? .6 + .4 * wave : .2 + .15 * wave) + on * .25 + (gate ? .2 * Math.sin(t * 3) : 0))})`; g.lineWidth = (lit ? 2.4 : 1.4) * D * (1 - u * .5); g.shadowColor = `rgba(${glow},.9)`; g.shadowBlur = (lit ? 10 + 14 * wave : 4) * D;
      g.beginPath(); g.moveTo(x - w / 2, y + bob); g.lineTo(x + w / 2, y + bob); g.stroke(); g.restore();
      steps.push({ k, idx, poly: [[x - w / 2 - d, y - d * .55 + bob - 18 * D], [x + w / 2, y - d * .55 + bob - 18 * D], [x + w / 2, y + th + bob], [x - w / 2, y + th + bob]], x, y: y + bob, w, u });
    }
  }
  function label(t) {
    const k = hover >= 0 ? hover : Math.round(pos), s = steps[k]; if (!s) return;
    const L = SCALE[s.idx]; if (!L) return;
    g.save(); g.font = `${13 * D}px ui-monospace, monospace`; g.textAlign = 'left'; g.fillStyle = s.idx === THRESH ? '#ff9a5a' : s.idx < THRESH ? '#ffe2a0' : '#a8b8e0';
    const txt = `${L[0]} · ${L[1]}`, rx = s.x + s.w / 2 + 14 * D;
    if (rx + g.measureText(txt).width > W - 8 * D) { g.textAlign = 'right'; g.fillText(txt, s.x - s.w / 2 - 14 * D, s.y + 4 * D); } else g.fillText(txt, rx, s.y + 4 * D); g.restore();
  }
  function dust(t) {
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 160; i++) { const u = (hash(i, 1) + t * .015 * (.5 + hash(i, 2))) % 1, [x, y] = P(u), w = wOf(u), ox = (hash(i, 3) - .5) * w * 1.1, oy = -Math.abs(Math.sin(t * .6 + i)) * 26 * D;
      const a = (.3 + .7 * (.5 + .5 * Math.sin(t * 4 + i * 1.7))) * (u > (N - 1 - THRESH) / (N - 1) - .02 ? 1 : .35);
      g.fillStyle = `rgba(255,220,140,${a})`; g.fillRect(x + ox, y + oy, 1.8 * D, 1.8 * D); }
    for (let i = 0; i < 70; i++) { const p = (t * .03 + hash(i, 7)) % 1, x = hash(i, 8) * W, y = p * H * .8; g.fillStyle = `rgba(255,230,170,${(1 - p) * .6})`; g.fillRect(x, y, 1.4 * D, 1.4 * D); }   // gold falling from the aurora
    g.restore();
  }
  function meadowLive(t) {
    g.drawImage(meadow, 0, 0);
    g.save(); g.globalCompositeOperation = 'screen'; const hz = H * .84;
    for (let i = 0; i < 90; i++) { const v = Math.pow(hash(i, 5), 1.4), x = hash(i, 6) * W, y = hz + v * (H - hz), p = Math.pow(.5 + .5 * Math.sin(t * 2 + i * 1.3), 4), r = (6 + v * 26) * D;
      const q = g.createRadialGradient(x, y, 0, x, y, r); const c = ['255,120,180', '120,255,160', '255,220,100', '120,210,255'][i % 4]; q.addColorStop(0, `rgba(${c},${.55 * p})`); q.addColorStop(1, `rgba(${c},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.restore();
  }
  function cat(t) {                                 // her cat, a silhouette in the flowers, looking up at the stair
    const [x0, y0] = P(0), x = x0 - .2 * W, y = y0 + .07 * H, s = .05 * H, tail = Math.sin(t * 1.6) * .6 + Math.sin(t * 4.1) * .15;
    const look = clamp((pos / (N - 1)) * .5, 0, .5), tw = (t % 4.3) < .18 ? .12 : 0, blink = (t % 3.7) < .14;
    g.save(); g.translate(x, y); g.fillStyle = '#05070e';
    g.beginPath(); g.ellipse(0, -s * .45, s * .3, s * .45 * (1 + .02 * Math.sin(t * 2)), 0, 0, TAU); g.fill();
    g.save(); g.translate(0, -s * 1.02); g.rotate(-look * .4); g.beginPath(); g.arc(0, 0, s * .22, 0, TAU); g.fill();
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * s * .18, -s * .1); g.lineTo(k * s * (.2 + (k > 0 ? tw : 0)), -s * .36); g.lineTo(k * s * .04, -s * .18); g.fill(); });
    if (!blink) { g.fillStyle = '#c8ff8a'; g.shadowColor = '#c8ff8a'; g.shadowBlur = 6 * D; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(k * s * .08 + s * .03, -s * .02, s * .035, s * .025, 0, 0, TAU); g.fill(); }); }
    g.restore(); g.fillStyle = '#05070e';
    g.strokeStyle = '#05070e'; g.lineWidth = s * .09; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * .2, -s * .1); g.quadraticCurveTo(s * .6, -s * .1 + tail * s * .2, s * .5 + tail * s * .3, -s * .55); g.stroke();
    g.restore();
  }
  function her(t) {
    if (!sil) return;
    const k = clamp(pos, 0, N - 1), k0 = Math.floor(k), f = k - k0, a = steps[k0], b = steps[Math.min(N - 1, k0 + 1)]; if (!a) return;
    const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f) - Math.sin(f * Math.PI) * 14 * D - (a.w * .16) * .3, u = lerp(a.u, b.u, f);
    const h = lerp(.13, .045, Math.pow(u, .8)) * H * (1 + .012 * Math.sin(t * 1.8)), w = h * 220 / 470, sway = Math.sin(t * 1.2) * .02 + (walking ? Math.sin(t * 14) * .04 : 0);
    const fr = walking ? (Math.floor(t * 7) % 2) : 0;
    const lt = t - landT; if (lt < 1.4) {               // she arrived: a ring of light and sparks on the step
      g.save(); g.globalCompositeOperation = 'screen'; const R = a.w * (.2 + lt * .5), al = 1 - lt / 1.4;
      g.strokeStyle = `rgba(255,220,150,${al})`; g.lineWidth = 2 * D; g.beginPath(); g.ellipse(x, y, R, R * .22, 0, 0, TAU); g.stroke();
      for (let i = 0; i < 22; i++) { const an = i / 22 * TAU, rr = lt * (40 + hash(i, 81) * 50) * D; g.fillStyle = `rgba(255,230,160,${al})`; g.fillRect(x + Math.cos(an) * rr, y - Math.abs(Math.sin(an)) * rr * 1.4 - lt * 20 * D, 2 * D, 2 * D); }
      g.restore(); }
    g.save(); g.translate(x, y); g.rotate(sway);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 0, w * .35, h * .03, 0, 0, TAU); g.fill();
    g.save(); g.shadowColor = 'rgba(255,200,120,.9)'; g.shadowBlur = 16 * D; g.drawImage(rim[fr], -w / 2 - 1.6 * D, -h - 1.2 * D, w, h); g.restore();   // warm rim from the beam
    g.drawImage(sil[fr], -w / 2, -h, w, h);
    g.restore();
  }
  const frame = now => {
    raf = requestAnimationFrame(frame); if (!visible || document.hidden || (paused && paused())) { walkT = now; return; }
    const t = (now - t0) / 1000;
    if (Math.abs(target - pos) > .001) { const dir = Math.sign(target - pos); pos += dir * Math.min(Math.abs(target - pos), (now - walkT) / 1000 * 3.2); walkT = now; walking = true; }
    else { if (walking) landT = t; walking = false; walkT = now; }
    pmx = lerp(pmx, mx, .05); pmy = lerp(pmy, my, .05);
    const layer = (k, fn) => { g.save(); g.translate(-pmx * k * D, -pmy * k * .5 * D); fn(); g.restore(); };
    g.drawImage(sky, 0, 0);
    layer(4, () => { stars(t); shoot(t); moon(t); }); if (t - auT > 1 / 15 || auT < 0) { auT = t; g = auG; auG.clearRect(0, 0, auCv.width, auCv.height); auG.save(); auG.scale(.5, .5); aurora(t); auG.restore(); g = main; }   // the curtain repaints at 15 fps, half size (huashu 'boil')
    layer(8, () => { g.save(); g.globalCompositeOperation = 'screen'; g.drawImage(auCv, 0, 0, W, H); g.restore(); }); layer(12, () => beam(t));
    mist(t); meadowLive(t); layer(16, () => { drawSteps(t); dust(t); her(t); label(t); }); layer(26, () => { cat(t); fireflies(t); sway(t); });
  };
  const pick = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * D + pmx * 16 * D, y = (e.clientY - r.top) * D + pmy * 8 * D;
    for (let i = steps.length - 1; i >= 0; i--) { const p = steps[i].poly; if (x >= Math.min(p[0][0], p[3][0]) && x <= p[1][0] && y >= p[0][1] && y <= p[2][1]) return i; } return -1; };
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); if (!reduce) { mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; } const k = pick(e); if (k !== hover) { hover = k; cv.style.cursor = k >= 0 ? 'pointer' : ''; onHover && onHover(k >= 0 ? steps[k].idx : -1); } });
  cv.addEventListener('pointerleave', () => { hover = -1; onHover && onHover(-1); });
  cv.addEventListener('click', e => { const k = pick(e); if (k >= 0) { set(steps[k].idx); onPick && onPick(steps[k].idx); } });
  function set(idx, instant) { target = stepOf(idx); if ((instant && !first) || reduce) pos = target; first = false; walkT = performance.now(); }
  size(); const ro = new ResizeObserver(size), io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); ro.observe(host); io.observe(host);
  raf = requestAnimationFrame(frame);
  return { set, stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); } };
}
let SCALE = [];
export const setScale = s => { SCALE = s; };
