# MINH.md

> a living manifesto. notes-to-self, mostly.
> read every morning. ticked every night.

**MINH.md** is Tuệ Minh's *My Life Book 2027* told as a scroll-driven animated film — eleven areas of life,
eleven colour-blocked rooms, one red dot. Inspired by [HUMAN.md](https://www.human-md.ai/).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

## Put it online (GitHub Pages)

1. Create an empty repository on GitHub, for example `minh-md`.
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "MINH.md"
   git branch -M main
   git remote add origin https://github.com/<your-name>/minh-md.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Every push to `main` rebuilds the site (`.github/workflows/deploy.yml`).
   The address will be `https://<your-name>.github.io/minh-md/`.

## How it is built

| File | What it holds |
|---|---|
| `src/content.js` | **Every word on screen.** Areas, beats (the four sentences per room), tarot cards, the six qualities, the 17-level scale, daily habits, mood and sleep keys. Edit here to change the story. |
| `src/app.js` | The film. One GSAP master timeline scrubbed by scroll (Lenis), the conductor (watch mode and one-step-per-flick), the story layer (gags, ceramic chorus, speech bubbles, transitions), the paper-doll puppet, the index, the `.md` reader and the **today** page. |
| `src/art.js` | SVG art: drawn props, gradients and the plant. |
| `src/style.css` | Layout, palette (`--ink`, `--paper`, `--accent` …), typography (Bricolage Grotesque, Instrument Serif, Cutive Mono). |
| `public/poses/` | The character, one image per pose (`yoga`, `read`, `heart` …). Add a missing pose with the same name and it appears; until then the default image is used. |
| `public/props/`, `public/story/` | Rendered ceramic objects (Blender) and gag objects. |
| `public/tarot/` | The eleven tarot cards. |
| `public/audio/score.mp3` | The score (sound button). |

### The ideas borrowed from HUMAN.md

- **Scroll is the playhead.** The page is one timeline; scrolling scrubs it.
- **Rests and a wall.** Scrolling stops at every sentence until it is read.
- **The conductor.** On desktop each wheel gesture plays exactly one step at a human pace,
  with slow motion on key moments. *watch* reads the whole film by itself:
  hold = 0.8 s + 0.3 s per word + 0.75 s breath, never more than 15 s.
- **One sentence, one picture.** Every line is acted out literally.
- **The red dot is a character** — the logo's period hops through every scene.

### Area pages — vision, purpose, strategy, goals and habits

Click any life area (in the index, or the **open Health ↗** pill while you stand in a room) — or go straight to
`#/health`, `#/money`, `#/love` … Each page shows the area's vision, purpose, strategy and 2027 goals,
and the **habits that get me there**: tick each day, watch the weekly target bar, the streak, a 12-week strip,
and a ring with this week's score. Habits are defined in `src/content.js` as `[name, times per week]`.
← / → move between areas, Esc closes.

### today — the daily page

Seven daily things for the week, mood tonight, sleep last night, and two year-long trackers.
Saved in the browser (`localStorage`, key `minhmd.v1`) on that device only.

---

Believe. Behave. Become. — m.

## Living paintings (art-motion)

Each area page header is a living painting, a canvas that repaints itself at 5–12 fps with "boiling" brushwork, one art style per area:
Health (flow strokes), Mind (pointillism), Emotions (watercolour), Character (mosaic), Spirit (impressionist dabs), Connection (cut paper),
Money (gold-leaf mosaic), Career (cubist facets), Life Quality (infinity dots), Energy (Bauhaus colour study), Love (ink & blossom).

- `src/art-motion/core.js` is an ES-module port of the painting toolkit from
  [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) (MIT, see `src/art-motion/LICENSE-huashu-art-motion`).
- `src/art-motion/scenes.js` holds the eleven original compositions. `index.js` mounts and pauses them (off-screen, hidden tab, page closed), and with reduced motion it draws a single still frame.

### Vision as a story

On every area page the vision is told as a story. It is pinned while you scroll, with one chapter per vision line. Words rise out of a mask one by one, and the key phrases (marked `*like this*` in `content.js`) get a painted highlighter sweep. The living painting beside the text makes a slow camera move for each chapter. The type timing follows huashu-art-motion's TY rules: a slow entrance (~0.45s) and a fast exit (~0.18s).
