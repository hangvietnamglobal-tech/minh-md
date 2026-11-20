/* Living paintings for the area pages.
   mountPainting(host, key) puts a <canvas> in host and keeps it painting while it is on screen.
   Each scene re-paints at its own low fps (8–12) — the "boiling" brushwork of hand animation —
   so it costs little and stops entirely when the page is closed or scrolled away. */
import { SCENES, STYLE } from './scenes.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let live = null;
const T0 = {};                                 // each painting keeps its own clock across re-renders

export function mountPainting(host, key) {
  stopPainting();
  const scene = SCENES[key]; if (!scene || !host) return;
  const cv = document.createElement('canvas'); cv.className = 'paint'; cv.setAttribute('aria-hidden', 'true');
  host.prepend(cv);
  const base = document.createElement('canvas'), ctx = cv.getContext('2d');
  let W = 0, H = 0, visible = true, raf = 0, last = -1;
  const t0 = T0[key] ??= performance.now() - 4000;   // start a few seconds in, so blooms and branches are already grown
  const size = () => {
    const r = host.getBoundingClientRect(), s = Math.min(1, Math.sqrt(380000 / Math.max(1, r.width * r.height)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(200, Math.round(r.height * s));
    cv.width = base.width = W; cv.height = base.height = H; last = -1;
  };
  const frame = now => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000, step = Math.floor(t * scene.fps);
    if (step === last) return; last = step;
    const tq = step / scene.fps;
    base.getContext('2d').reset?.(); ctx.reset?.();
    scene.draw(ctx, base, tq, W, H);
  };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - (live?.area || 0)) > 2000) { live.area = r.width * r.height; size(); if (reduce) scene.draw(ctx, base, 6, W, H); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) scene.draw(ctx, base, 6, W, H); else raf = requestAnimationFrame(frame);
  live = { stop: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); }, area: 0 };
  return STYLE[key];
}
export function stopPainting() { if (live) { live.stop(); live = null; } }
export { STYLE };
