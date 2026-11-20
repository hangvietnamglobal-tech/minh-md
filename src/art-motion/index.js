/* Living paintings for the area pages.
   mountPainting(host, key) puts a <canvas> in host and keeps it painting while it is on screen.
   Each scene re-paints at its own low fps (5–12), like the boiling brushwork of hand animation,
   so it costs little and stops entirely when the page is closed or scrolled away.
   Several paintings can live at once (header + vision story); stopPainting() stops them all. */
import { SCENES, STYLE } from './scenes.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const live = new Set();
const T0 = {};                                 // each painting keeps its own clock across re-renders

export function mountPainting(host, key, { budget = 380000, cls = 'paint' } = {}) {
  const scene = SCENES[key]; if (!scene || !host) return null;
  const cv = document.createElement('canvas'); cv.className = cls; cv.setAttribute('aria-hidden', 'true');
  host.prepend(cv);
  const base = document.createElement('canvas'), ctx = cv.getContext('2d');
  let W = 0, H = 0, visible = true, raf = 0, last = -1, area = 0;
  const t0 = T0[key] ??= performance.now() - 4000;   // start a few seconds in, so blooms and branches are already grown
  const size = () => {
    const r = host.getBoundingClientRect(); area = r.width * r.height;
    const s = Math.min(1, Math.sqrt(budget / Math.max(1, area)));
    W = Math.max(320, Math.round(r.width * s)); H = Math.max(200, Math.round(r.height * s));
    cv.width = base.width = W; cv.height = base.height = H; last = -1;
  };
  const still = () => scene.draw(ctx, base, 6, W, H);
  const frame = now => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000, step = Math.floor(t * scene.fps);
    if (step === last) return; last = step;
    base.getContext('2d').reset?.(); ctx.reset?.();
    scene.draw(ctx, base, step / scene.fps, W, H);
  };
  size();
  const ro = new ResizeObserver(() => { const r = host.getBoundingClientRect(); if (Math.abs(r.width * r.height - area) > 2000) { size(); if (reduce) still(); } });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  ro.observe(host); io.observe(host);
  if (reduce) still(); else raf = requestAnimationFrame(frame);
  const h = { canvas: cv, style: STYLE[key], stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); cv.remove(); live.delete(h); } };
  live.add(h);
  return h;
}
export function stopPainting() { [...live].forEach(h => h.stop()); }
export { STYLE };
