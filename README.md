# personal site — ghibli-core

A quiet, hand-drawn personal website: hero valley, about, projects, timeline,
toolbox, photo gallery, and contact. Plain HTML/CSS/JS — no framework, no build
step, no npm install. Open `index.html` and it works.

```
index.html                 all the content lives here
assets/css/styles.css      palette + layout (every colour is a token at the top)
assets/js/main.js          theme toggle, scroll reveal, drifting leaves, lightbox
assets/img/*.svg           placeholder artwork — swap for your own photos
assets/resume.pdf          placeholder — drop your real resume here
```

## making it yours

Every spot that needs your details is marked `<!-- EDIT ME -->` in `index.html`.
In order:

| what | where |
| --- | --- |
| page title, description, social preview | `<head>` |
| initials in the nav | `.mark` |
| name, one-line bio, hero buttons | `.hero__card` |
| LinkedIn / GitHub / email URLs | hero **and** contact section (both places) |
| portrait photo | `.portrait__frame img` |
| bio paragraphs and chips | `#about` |
| projects | `#projects` — copy an `<article class="card">` per project, delete the rest |
| roles and degrees | `#journey` — one `<li>` per entry, newest first |
| skills | `#toolbox` |
| photos and captions | `#gallery` |
| footer name | `.footer__meta` |

Photos: drop JPGs into `assets/img/` and point the `src` at them. Keep the
`alt` text descriptive, and keep them square-ish — the gallery crops to 1:1.
Around 1200px wide is plenty; anything larger just slows the page down.

Resume: replace `assets/resume.pdf` with your own file, same name, and both
resume links keep working.

## the palette

All colour lives in `:root` at the top of `styles.css`, with a matching
`[data-theme="night"]` block for the evening version. Change `--sage`,
`--blush`, and `--paper` and the whole site follows — buttons, hills, moon,
and drifting leaves included.

The site opens in whichever theme matches the visitor's OS setting, and the
lantern button in the nav overrides it (remembered in `localStorage`).

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

Fonts (Cormorant Garamond + Nunito Sans) load from Google Fonts as a
progressive enhancement. If they're blocked or offline, the local serif/sans
fallback stack takes over and the layout doesn't shift. To go fully
self-hosted, delete the `<link>` tags in `<head>` and drop the font files in
`assets/fonts/`.

## publishing it

**GitHub Pages** — push to your default branch, then Settings → Pages → Source:
_Deploy from a branch_, branch `main`, folder `/ (root)`. Live in a minute at
`https://<user>.github.io/<repo>/`.

**Netlify / Vercel / Cloudflare Pages** — drag the folder in, or connect the
repo. No build command; publish directory is the repo root.

**Custom domain** — add a `CNAME` file containing your domain, then point a
`CNAME` DNS record at your host.

## local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` directly works too, though a local server is closer to how
it will actually be served.
