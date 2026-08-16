# reesewang.dev — personal site

Source for **https://eseer-rw.github.io/**. Plain HTML/CSS/JS — no framework, no build
step, no `npm install`. Push to `main` and GitHub Pages redeploys.

```
index.html                 all the content lives here
assets/css/styles.css      palette + layout (every colour is a token at the top)
assets/js/main.js          theme toggle, scroll reveal, drifting leaves, lightbox
assets/img/*.svg           artwork — the gallery tiles are still placeholders
```

## editing it

Content is plain HTML in `index.html`, in the order it appears on the page:
hero → about → work → journey → toolbox → pictures → contact. Edit the text directly;
there's no templating layer in the way.

To add a project, copy an `<article class="card">` block in `#projects` and change the
title, description, tags, and link. The `card__art--a` / `--b` / `--c` class picks which
of the three illustrations sits at the top — they're just different times of day.

To add a role or degree, copy an `<li>` in the `.timeline` list. Newest first.

## still to do

- **Photos.** The six tiles in `#gallery` are placeholder SVGs. Drop real JPGs into
  `assets/img/`, point each `src` at them, and rewrite the captions. Square-ish and
  ~1200px wide is plenty — the grid crops to 1:1.
- **Portrait.** `assets/img/portrait.svg` in the about section, same idea.
- **Resume PDF.** The resume button currently scrolls to *the path so far*, which carries
  the same information. To offer a download instead, put the file at `assets/resume.pdf`
  and change that button's `href` back to `assets/resume.pdf" download`.

## the palette

All colour lives in `:root` at the top of `styles.css`, with a matching
`[data-theme="night"]` block for the evening version. Change `--sage`, `--blush`, and
`--paper` and the whole site follows — buttons, hills, moon, and drifting leaves
included.

The site opens in whichever theme matches the visitor's OS setting, and the lantern
button in the nav overrides it (remembered in `localStorage`).

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

Fonts (Cormorant Garamond + Nunito Sans) load from Google Fonts as a progressive
enhancement. If they're blocked or offline, the local serif/sans fallback stack takes
over and the layout doesn't shift. To go fully self-hosted, delete the `<link>` tags in
`<head>` and drop the `.woff2` files in `assets/fonts/`.

## local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```
