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

memo.html                  the AI implications research memorandum, set as a
  assets/css/memo.css        reading page; assets/memo.pdf is rendered from it

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

## still to do

- **A playlist section.** Waiting on the playlist URL.

Every other placeholder is filled — there are no `class="todo"` boxes left in
either page.

- **Content lives in two files.** Edits to the bio, projects, or timeline need making in
  both `index.html` and `futuristic.html` until you settle on one.
- **Resume PDF.** The resume button scrolls to *the path so far*, which carries the same
  information. To offer a download instead, put a file at `assets/resume.pdf` and point
  that button at it — but note the PDF you have contains your phone number and home
  address, and publishing it puts both on the open web.

## the palettes

**Daylight** — early morning: a low sun behind the trees, mist holding the light,
foliage yellow-green where it is lit and cool where it is not. Page colour lives in
`:root` at the top of `styles.css`, with a matching `[data-theme="night"]` block for
the evening version.

The hero scene is painted on `<canvas>`, which cannot read CSS variables, so its
palette lives in `assets/js/valley.js` as the `DAY` and `NIGHT` objects — sky, sun
bloom, light rays, the three treeline bands, mist, water, reflections, bank and
reeds. Edit those to retime the scene; the card illustrations and gallery
placeholders are tuned to match and live in `styles.css` (`--art-*`) and
`assets/img/`.

The site always opens in daylight, whatever the visitor's OS dark-mode setting is —
the light forest is the design, and a system preference should not swap it for a
different artwork. The lantern button in the nav switches to the evening version, and
that choice is remembered in `localStorage`.

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
- Email button opens a small copyable popover instead of a `mailto:` link, since
  `mailto:` does nothing for a visitor with no desktop mail client configured
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
