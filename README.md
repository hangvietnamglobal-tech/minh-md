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

### today — the daily page

Seven daily things for the week, mood tonight, sleep last night, and two year-long trackers.
Saved in the browser (`localStorage`, key `minhmd.v1`) on that device only.

---

Believe. Behave. Become. — m.
