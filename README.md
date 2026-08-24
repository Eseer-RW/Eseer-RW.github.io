# reesewang.dev — personal site

Source for **https://eseer-rw.github.io/**. Plain HTML/CSS/JS — no framework, no build
step, no `npm install`. Push to `main` and GitHub Pages redeploys.

Two versions of the same content share this repo:

```
index.html                 daylight version (ghibli-core, cream + sage)
  assets/css/styles.css      palette + layout, day/evening themes
  assets/js/main.js          theme toggle, reveals, drifting leaves, lightbox

futuristic.html            canopy version (nocturnal, bioluminescent green)
  assets/css/futuristic.css  single dark palette, luminous rules
  assets/js/futuristic.js    canvas-painted night scene, reveals, lightbox

assets/img/*.svg           artwork — the gallery tiles are still placeholders
```

`index.html` is what `https://eseer-rw.github.io/` serves. To make the canopy
version the front door instead, swap the two filenames. They cross-link from
the footer, so both stay reachable either way.

## editing it

Content is plain HTML in `index.html`, in the order it appears on the page:
hero → about → work → journey → toolbox → pictures → contact. Edit the text directly;
there's no templating layer in the way.

To add a project, copy an `<article class="card">` block in `#projects` and change the
title, description, tags, and link. The `card__art--a` / `--b` / `--c` class picks which
of the three illustrations sits at the top — they're just different times of day.

To add a role or degree, copy an `<li>` in the `.timeline` list. Newest first.

## still to do — the writing is yours

Every bit of prose I did not take straight off the resume is left as a visible
placeholder. Search either HTML file for `class="todo"` — there are 15 in each:

| where | what it wants |
| --- | --- |
| `#about` | two or three paragraphs in your own voice |
| `#about` blockquote | a line you like |
| portrait caption | one short caption |
| each project card | a sentence or two of prose (the numbers are already in from the resume) |
| `#projects`, `#gallery` headers | one line introducing each section |
| `#contact` | a sentence inviting people to write |
| gallery captions ×6 | one caption per photo |

Replace the whole `<p class="todo">…</p>` element with a normal `<p>`. Until you
do, they render as dashed "your words" boxes — deliberately hard to miss, and
publicly visible, so this is the thing to finish first.

## still to do — pictures

- **Photos.** The six tiles in `#gallery` are placeholder SVGs — `gallery-*.svg` on the
  daylight version, `neon-*.svg` on the canopy one. Drop real JPGs into `assets/img/`,
  point each `src` at them. Square-ish and ~1200px wide is plenty — the grid crops to
  1:1. Both pages need updating.
- **Portrait.** `portrait.svg` and `portrait-neon.svg`, same idea.
- **Content lives in two files.** Edits to the bio, projects, or timeline need making in
  both `index.html` and `futuristic.html` until you settle on one.
- **Resume PDF.** The resume button scrolls to *the path so far*, which carries the same
  information. To offer a download instead, put a file at `assets/resume.pdf` and point
  that button at it — but note the PDF you have contains your phone number and home
  address, and publishing it puts both on the open web.

## the palettes

**Daylight** — all colour lives in `:root` at the top of `styles.css`, with a matching
`[data-theme="night"]` block for the evening version. Change `--sage`, `--blush`, and
`--paper` and the whole site follows — buttons, hills, moon, and drifting leaves
included.

The daylight site opens in whichever theme matches the visitor's OS setting, and the
lantern button in the nav overrides it (remembered in `localStorage`).

**Canopy** — `futuristic.css` commits to a single nocturnal palette, so there's no
toggle. Its tokens are `--void` (ground), `--bio` (the bioluminescent accent),
`--lantern` (warm amber), and `--blossom`, which appears exactly once, on the pink
tree in the hero and the quote rule. The hero scene is painted on `<canvas>` from a
fixed seed, so the skyline is identical on every load.

## what's built in

- Day / evening themes, with the hero valley repainted for each
- Drifting pollen and leaves on `<canvas>`, paused when the tab is hidden
- Scroll-reveal animations and a vine-coloured reading progress bar
- Scroll-spy nav highlighting the section you're in
- Click-to-enlarge photo viewer using a native `<dialog>`
- Fully responsive, with a collapsing mobile menu
- Respects `prefers-reduced-motion` (no drift, no reveals, no smooth scroll)
- Keyboard accessible: skip link, visible focus rings, real buttons
- Prints cleanly

Fonts (Cormorant Garamond + Nunito Sans on the daylight version; Sora, Commissioner
and JetBrains Mono on the canopy one) load from Google Fonts as a progressive
enhancement. If they're blocked or offline, the local serif/sans fallback stack takes
over and the layout doesn't shift. To go fully self-hosted, delete the `<link>` tags in
`<head>` and drop the `.woff2` files in `assets/fonts/`.

## local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
