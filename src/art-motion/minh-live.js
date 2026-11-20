/* Minh, alive: her own character art rigged with Iki (https://github.com/zeikar/iki, MIT) —
   the picture was cut into layers and auto-rigged by Iki's import-illustration skill, so at rest it is the
   picture itself, pixel for pixel. Here the open Iki runtime plays it: she blinks (sometimes twice),
   breathes, her eyes follow the pointer and her head follows her eyes, her hair sways on springs,
   and a tap makes her smile and nod. Paused when off-screen; one still pose for reduced motion. */
import { IkiPlayer, IkiMotion } from "@ikijs/engine";
import { loadIkiModel } from "@ikijs/format";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let MODEL = null;                                       // the .iki JSON is fetched once and shared
const getModel = url => MODEL ??= fetch(url).then(r => { if (!r.ok) throw new Error("iki " + r.status); return r.text(); });

// keep the head inside the turn the rig was fitted for (the hair behind the face is made up past it)
const LIMIT = { ParamAngleX: 10, ParamAngleY: 8, ParamAngleZ: 5 };
const VIEW = [1100, 953];                               // the bust framing, model px (top 953 rows of the 1100×1444 canvas)

export function mountMinh(host, { url = "./iki/minh.iki", under = "./iki/minh-under.webp", view = "bust", onReady } = {}) {
  // a box at the framing's exact aspect; behind the live canvas, a still of her back hair and body, so the thin
  // seams a rigged turn opens at layer edges show hair, not the page
  const box = document.createElement("div"); box.className = "minh-box"; box.style.backgroundImage = `url(${under})`;
  const cv = document.createElement("canvas"); cv.className = "minh-live"; cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Minh, animated");
  box.appendChild(cv); host.appendChild(box);
  const fitBox = () => { const r = host.getBoundingClientRect(), k = VIEW[0] / VIEW[1]; let h = r.height, w = h * k; if (w > r.width) { w = r.width; h = w / k; } box.style.width = w + "px"; box.style.height = h + "px"; };
  let player, motion, raf = 0, visible = true, alive = true, smileT = 0;
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(2, Math.round(r.width * d)); cv.height = Math.max(2, Math.round(r.height * d)); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  const ro = new ResizeObserver(() => { fitBox(); size(); });
  const look = e => { if (!motion) return; const r = cv.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) / (r.width * .6), y = -(e.clientY - (r.top + r.height * .32)) / (r.height * .6);
    motion.setGazeTarget(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))); };
  const away = () => motion && motion.clearGazeTarget();
  const tap = () => { if (!motion) return; motion.playExpression("smile"); motion.playMotion("Nod", 0); smileT = performance.now() + 2600; };
  getModel(url).then(async json => {
    if (!alive) return;
    const model = loadIkiModel(json);
    player = new IkiPlayer(cv);
    fitBox(); size(); await player.load(model);
    if (!alive) return player.destroy();
    const W = model.canvas.width, H = model.canvas.height;
    // bust framing: the head and shoulders, a little room above the hair
    if (view === "bust") player.setView({ x: 0, y: H / 2 - VIEW[1] / 2, width: VIEW[0], height: VIEW[1] });
    if (reduce) { player.start(); return; }
    motion = new IkiMotion(model, id => player.getParameter(id), (id, v) => player.setParameter(id, v));
    player.start();
    const tick = now => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      motion.update(now);
      for (const [id, m] of Object.entries(LIMIT)) { const v = player.getParameter(id); if (Math.abs(v) > m) player.setParameter(id, Math.sign(v) * m); }
      if (smileT && now > smileT) { motion.stopExpression(); smileT = 0; }
    };
    raf = requestAnimationFrame(tick);
    addEventListener("pointermove", look, { passive: true }); document.addEventListener("pointerleave", away);
    cv.addEventListener("click", tap);
    onReady && onReady();
  }).catch(err => { console.warn("Minh live:", err); cv.remove(); });
  fitBox(); io.observe(cv); ro.observe(host);
  return { canvas: cv, smile: tap, stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener("pointermove", look); document.removeEventListener("pointerleave", away); if (player) { player.stop(); player.destroy(); } box.remove(); } };
}
