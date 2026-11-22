// photo-story.js — a vision story told with Tuệ Minh's own mood-board pictures: each chapter holds one or more images
// that slowly push in (Ken Burns) and dissolve into each other, under a living layer of light (dust, rays, mist,
// fireflies) and a boiling paper grain from the huashu toolkit, so the photos breathe like the painted chapters.
import { TAU, clamp, lerp, ss, hash, grain } from './core.js';

const off = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const glow = (g, x, y, r, col, a) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${col},${a})`); q.addColorStop(1, `rgba(${col},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); };

const FX = {
  ember(g, W, H, t) { const M = Math.min(W, H);
    const v = g.createRadialGradient(W / 2, H / 2, M * .25, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 70; i++) { const p = (t * (.02 + hash(i, 2) * .03) + hash(i, 3)) % 1, x = hash(i, 4) * W + Math.sin(t + i) * 10, y = H * (1 - p);
      glow(g, x, y, M * (.004 + hash(i, 5) * .008), '255,190,120', Math.sin(p * Math.PI) * .8); } g.restore(); },
  garden(g, W, H, t) { const M = Math.min(W, H); g.save(); g.globalCompositeOperation = 'screen';
    const sx = ((t * .06) % 1.6 - .3) * W; const q = g.createLinearGradient(sx - W * .2, 0, sx + W * .2, H); q.addColorStop(0, 'rgba(255,240,200,0)'); q.addColorStop(.5, 'rgba(255,240,200,.12)'); q.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) { const x = W * hash(i, 11) + Math.sin(t * .5 + i) * 12, y = H * hash(i, 12) + Math.cos(t * .4 + i) * 8; glow(g, x, y, M * (.02 + hash(i, 13) * .03), '255,245,210', .12 + .1 * Math.sin(t * 1.3 + i)); }
    g.restore(); },
  gym(g, W, H, t) { const M = Math.min(W, H); g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) { const a = .04 + .03 * Math.sin(t * .7 + i * 1.3); g.fillStyle = `rgba(190,235,245,${a})`; g.beginPath(); g.moveTo(W * (.25 + i * .12), 0); g.lineTo(W * (.32 + i * .12), 0); g.lineTo(W * (.12 + i * .12), H); g.lineTo(W * (.02 + i * .12), H); g.fill(); }
    for (let i = 0; i < 60; i++) { const p = (t * (.01 + hash(i, 21) * .02) + hash(i, 22)) % 1, x = W * hash(i, 23) + Math.sin(t * .6 + i) * 20, y = H * (.1 + p * .8); g.fillStyle = `rgba(220,245,255,${Math.sin(p * Math.PI) * .6})`; g.fillRect(x, y, M * .003, M * .003); }
    g.restore(); },
  mist(g, W, H, t) { g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 6; i++) { const x = ((hash(i, 31) + t * .01 * (1 + i % 3)) % 1.5 - .25) * W, y = H * (.35 + hash(i, 32) * .5), rx = W * (.25 + hash(i, 33) * .2);
      g.save(); g.translate(x, y); g.scale(1, .18); glow(g, 0, 0, rx, '235,245,240', .18); g.restore(); }
    for (let i = 0; i < 30; i++) { const a = Math.pow(.5 + .5 * Math.sin(t * 2 + i * 3), 4); glow(g, W * hash(i, 34), H * hash(i, 35), Math.min(W, H) * .01, '255,255,240', a * .7); }
    g.restore(); },
  aura(g, W, H, t) { const M = Math.min(W, H); g.save(); g.globalCompositeOperation = 'screen';
    ['255,80,220', '120,90,255', '80,200,255', '255,170,60'].forEach((c, i) => { const r = M * (.25 + i * .12) * (1 + .05 * Math.sin(t * 1.2 - i)); g.save(); g.translate(W / 2, H * .52); g.scale(.7, 1); glow(g, 0, 0, r, c, .12 + .06 * Math.sin(t * 1.2 - i)); g.restore(); });
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + t * .2, r = M * (.3 + .05 * Math.sin(t + i)); glow(g, W / 2 + Math.cos(a) * r * .7, H * .52 + Math.sin(a) * r, M * .01, '255,255,220', .5 + .5 * Math.sin(t * 3 + i)); }
    g.restore(); },
  stars(g, W, H, t) { const M = Math.min(W, H); g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 60; i++) { const a = Math.pow(.5 + .5 * Math.sin(t * (1 + hash(i, 61) * 2) + i * 2), 3); glow(g, W * hash(i, 62), H * hash(i, 63), M * (.004 + hash(i, 64) * .008), '230,230,255', a * .9); }
    glow(g, W * .66, H * .3, M * (.14 + .03 * Math.sin(t * 1.5)), '255,255,255', .25); g.restore(); },
  sun(g, W, H, t) { const M = Math.min(W, H); g.save(); g.globalCompositeOperation = 'screen';
    glow(g, W * .62, H * .3, M * (.45 + .04 * Math.sin(t * .6)), '255,205,150', .25);
    for (let i = 0; i < 6; i++) { const a = .04 + .035 * Math.sin(t * .5 + i); g.fillStyle = `rgba(255,220,170,${a})`; g.beginPath(); g.moveTo(W * (.6 + i * .02), H * .25); g.lineTo(W * (.63 + i * .02), H * .25); g.lineTo(W * (.25 + i * .12), H); g.lineTo(W * (.15 + i * .12), H); g.fill(); }
    for (let i = 0; i < 40; i++) { const p = (t * .03 + hash(i, 41)) % 1; g.fillStyle = `rgba(255,235,200,${Math.sin(p * Math.PI) * .7})`; g.fillRect(W * (.2 + hash(i, 42) * .6) + Math.sin(t + i) * 15, H * (.3 + hash(i, 43) * .6) - p * H * .1, 2, 2); }
    g.restore(); },
};

export function mountPhotoStory(host, { base = './', chapters, style = '', budget = 520000, hold = 5.5, xfade = 1.4 } = {}) {
  const imgs = chapters.map(c => c.imgs.map(([src, fx = .5, fy = .5]) => { const im = new Image(); im.decoding = 'async'; im.src = base + src; return { im, fx, fy }; }));
  const cv = off(10, 10); cv.className = 'vcv'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv);
  const ctx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, cur = 0, prev = -1, tChange = 0, raf = 0, visible = true, area = 0, grains = [];
  const t0 = performance.now();
  const size = () => { const r = host.getBoundingClientRect(); area = r.width * r.height; const s = Math.min(1.6, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(240, Math.round(r.height * s)); cv.width = W; cv.height = H;
    grains = [0, 1, 2].map(k => { const c = off(W, H); grain(c.getContext('2d'), W, H, 50 + k, .07); return c; }); };
  // one picture, cover-fitted and slowly pushing in toward its focal point
  const pic = (g, p, age) => { const { im, fx, fy } = p; if (!im.complete || !im.naturalWidth) return false;
    const k = reduce ? 0 : clamp(age / (hold + xfade * 2)), sc = Math.max(W / im.naturalWidth, H / im.naturalHeight) * lerp(1.04, 1.16, k);
    const w = im.naturalWidth * sc, h = im.naturalHeight * sc, x = clamp(W / 2 - fx * w + lerp(0, (.5 - fx) * W * .08, k), W - w, 0), y = clamp(H / 2 - fy * h, H - h, 0);
    g.drawImage(im, x, y, w, h); return true; };
  const chapterAt = (g, j, tc) => { const L = imgs[j], per = hold + xfade, n = L.length, i = Math.floor(tc / per) % n, age = tc % per;
    if (!pic(g, L[i], age + xfade)) { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, W, H); }
    if (n > 1 && age < xfade) { g.save(); g.globalAlpha = 1 - ss(0, 1, age / xfade); pic(g, L[(i - 1 + n) % n], age + per + xfade); g.restore(); }
    const fx = FX[chapters[j].fx]; if (fx) fx(g, W, H, tc + j * 7); };
  const draw = t => { const tc = t - tChange;
    chapterAt(ctx, cur, Math.max(0, tc));
    if (prev >= 0 && tc < 1.2) { const c2 = off(W, H); chapterAt(c2.getContext('2d'), prev, t); ctx.globalAlpha = 1 - ss(0, 1, tc / 1.2); ctx.drawImage(c2, 0, 0); ctx.globalAlpha = 1; } else prev = -1;
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(grains[Math.floor(t * 8) % 3], 0, 0); ctx.restore(); };   // the paper grain boils at 8 fps
  const frame = now => { raf = requestAnimationFrame(frame); if (!visible || document.hidden) return; draw(Math.max(0, (now - t0) / 1000)); };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) size(); });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) { const once = () => draw((performance.now() - t0) / 1000); imgs.flat().forEach(p => p.im.addEventListener('load', once)); setTimeout(once, 300); }
  else raf = requestAnimationFrame(frame);
  return {
    canvas: cv, style,
    chapter(j) { j = clamp(j, 0, chapters.length - 1); if (j === cur) return; prev = reduce ? -1 : cur; cur = j; tChange = (performance.now() - t0) / 1000; if (reduce) draw(tChange); },
    stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); },
  };
}

// the Health story, from Tuệ Minh's health mood board (her pictures, her choice)
export const HEALTH_PHOTOS = [
  { fx: 'ember', imgs: [['health/discipline.webp', .5, .42], ['health/ponytail.webp', .5, .4], ['health/mirror.webp', .55, .55]] },
  { fx: 'garden', imgs: [['health/yoga-garden.webp', .5, .3], ['health/strong.webp', .5, .45]] },
  { fx: 'gym', imgs: [['health/pullup.webp', .5, .2], ['health/back.webp', .5, .4]] },
  { fx: 'mist', imgs: [['health/balance.webp', .5, .5]] },
  { fx: 'sun', imgs: [['health/sunrise-80.webp', .5, .32]] },
];

// the Emotions story, from Tuệ Minh's emotion mood board
export const EMOTION_PHOTOS = [
  { fx: 'ember', imgs: [['emotions/what-we-are.webp', .6, .45]] },
  { fx: 'garden', imgs: [['emotions/calm-tea.webp', .5, .55]] },
  { fx: 'sun', imgs: [['emotions/pause-spiral.webp', .5, .75]] },
  { fx: 'aura', imgs: [['emotions/aura.webp', .5, .5]] },
  { fx: 'stars', imgs: [['emotions/trust-vision.webp', .6, .4]] },
];
