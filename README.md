# reesewang.dev — personal site

Source for **https://eseer-rw.github.io/**. Plain HTML/CSS/JS — no framework, no build
step, no `npm install`. Push to `main` and GitHub Pages redeploys.

```
index.html                 the site
  assets/css/styles.css      palette + layout, day/evening themes
  assets/js/main.js          theme toggle, reveals, drifting leaves, lightbox
  assets/js/valley.js        the canvas-painted hero scene

memo.html                  the AI implications research memorandum, set as a
  assets/css/memo.css        reading page. assets/memo.pdf is Reese's own PDF —
                             do not regenerate it from the page

assets/img/reese.jpg       portrait
assets/img/card-[1-5].jpg  project card images
assets/img/photo-[1-8].jpg gallery photos
assets/img/*.svg           drawn artwork: the favicon, and unused placeholders
```

`index.html` is what `https://eseer-rw.github.io/` serves.

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

Fonts (Cormorant Garamond + Nunito Sans) load from Google Fonts as a progressive
enhancement. If they're blocked or offline, the local serif/sans fallback stack takes
over and the layout doesn't shift. To go fully self-hosted, delete the `<link>` tags in
`<head>` and drop the `.woff2` files in `assets/fonts/`.

## local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
