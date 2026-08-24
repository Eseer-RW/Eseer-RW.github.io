/* =========================================================================
   futuristic-green — canopy scene + page behaviour. no dependencies.
   the hero is painted on canvas rather than hand-authored as SVG paths.
   ========================================================================= */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- seeded randomness */
  /* a fixed seed keeps the skyline identical across resizes and reloads */

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ------------------------------------------------------- the hero scene */

  var canopy = document.getElementById("canopy");

  if (canopy && canopy.getContext) {
    var ctx = canopy.getContext("2d");
    var scene = document.createElement("canvas");   // static layers, drawn once
    var sctx = scene.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var motes = [];
    var running = true;

    var BIO = "108, 242, 192";
    var LANTERN = "247, 199, 119";
    var BLOSSOM = "255, 157, 190";

    /* --- a single tree: trunk plus a cluster of canopy blobs --- */
    function tree(c, x, groundY, height, spread, fill, rand, rim) {
      c.fillStyle = fill;
      var trunkW = Math.max(2, height * 0.035);
      c.fillRect(x - trunkW / 2, groundY - height * 0.55, trunkW, height * 0.55);

      var top = groundY - height;
      var blobs = 7 + Math.floor(rand() * 5);
      c.beginPath();
      for (var i = 0; i < blobs; i++) {
        var bx = x + (rand() - 0.5) * spread;
        var by = top + rand() * height * 0.45;
        var br = spread * (0.22 + rand() * 0.26);
        c.moveTo(bx + br, by);
        c.arc(bx, by, br, 0, Math.PI * 2);
      }
      /* stroke first, then fill: only the outer rim survives, so the canopy
         catches a little light instead of reading as a flat silhouette */
      if (rim) { c.strokeStyle = rim; c.lineWidth = 1.4; c.stroke(); }
      c.fillStyle = fill;
      c.fill();
    }

    /* --- a soft radial glow --- */
    function glow(c, x, y, r, rgb, alpha) {
      var g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(" + rgb + "," + alpha + ")");
      g.addColorStop(0.4, "rgba(" + rgb + "," + alpha * 0.28 + ")");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    function paintScene() {
      var rand = rng(20260819);
      var horizon = H * 0.66;          // where the plaza begins
      var c = sctx;

      /* NB: resize() set the dpr transform — do not reset it here, or the
         scene draws in CSS pixels into a device-pixel buffer and only fills
         the top-left corner on any display where dpr > 1. */
      c.clearRect(0, 0, W, H);

      /* sky */
      var sky = c.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#04100e");
      sky.addColorStop(0.5, "#0a231f");
      sky.addColorStop(1, "#13392f");
      c.fillStyle = sky;
      c.fillRect(0, 0, W, horizon);

      /* stars */
      for (var s = 0; s < 150; s++) {
        var sx = rand() * W, sy = rand() * horizon * 0.65;
        var a = 0.15 + rand() * 0.55;
        c.fillStyle = "rgba(221, 240, 231," + a + ")";
        c.fillRect(sx, sy, 1.2, 1.2);
      }

      /* haze above the treeline */
      glow(c, W * 0.5, horizon, W * 0.75, BIO, 0.16);

      /* --- city blocks along the horizon --- */
      for (var b = 0; b < 26; b++) {
        var bw = W * (0.022 + rand() * 0.045);
        var bx2 = (b / 26) * W * 1.04 - W * 0.02 + (rand() - 0.5) * W * 0.025;
        var bh = H * (0.05 + rand() * 0.19);
        c.fillStyle = "#081c19";
        c.fillRect(bx2, horizon - bh, bw, bh);
        /* lit windows */
        var cols = Math.max(1, Math.floor(bw / 9));
        var rows = Math.max(1, Math.floor(bh / 12));
        for (var wx = 0; wx < cols; wx++) {
          for (var wy = 0; wy < rows; wy++) {
            if (rand() > 0.55) continue;
            var warm = rand() > 0.45;
            c.fillStyle = "rgba(" + (warm ? LANTERN : BIO) + "," + (0.35 + rand() * 0.5) + ")";
            c.fillRect(bx2 + 3 + wx * 9, horizon - bh + 4 + wy * 12, 3, 4);
          }
        }
      }

      /* --- the distant spire --- */
      var spireX = W * 0.845;
      var spireTop = horizon - H * 0.62;
      var spireW = Math.max(26, W * 0.028);

      c.fillStyle = "#0a201d";
      c.beginPath();
      c.moveTo(spireX - spireW * 0.42, spireTop);
      c.lineTo(spireX + spireW * 0.42, spireTop);
      c.lineTo(spireX + spireW, horizon);
      c.lineTo(spireX - spireW, horizon);
      c.closePath();
      c.fill();

      /* vertical light strips up the spire */
      for (var st = 0; st < 5; st++) {
        var t = (st + 0.5) / 5;
        var lx = spireX + (t - 0.5) * spireW * 1.5;
        var lg = c.createLinearGradient(0, spireTop, 0, horizon);
        lg.addColorStop(0, "rgba(" + BIO + ",0)");
        lg.addColorStop(0.5, "rgba(" + BIO + ",0.5)");
        lg.addColorStop(1, "rgba(" + BIO + ",0.15)");
        c.fillStyle = lg;
        c.fillRect(lx - 0.8, spireTop, 1.6, horizon - spireTop);
      }
      glow(c, spireX, spireTop + H * 0.06, W * 0.18, BIO, 0.32);

      /* --- canopy layers, far to near --- */
      var layers = [
        { fill: "#0a221d", h: 0.20, spread: 0.075, count: 11, y: 0.02, rim: "rgba(" + BIO + ",0.13)" },
        { fill: "#071a17", h: 0.26, spread: 0.10,  count: 8,  y: 0.06, rim: "rgba(" + BIO + ",0.10)" },
        { fill: "#040f0d", h: 0.34, spread: 0.13,  count: 6,  y: 0.12, rim: "rgba(" + BIO + ",0.08)" }
      ];

      for (var L = 0; L < layers.length; L++) {
        var lay = layers[L];
        for (var i2 = 0; i2 < lay.count; i2++) {
          var tx = (i2 / (lay.count - 1)) * W * 1.2 - W * 0.1 + (rand() - 0.5) * W * 0.05;
          var th = H * lay.h * (0.8 + rand() * 0.4);
          /* leave the spire a clear line of sight */
          if (Math.abs(tx - spireX) < W * 0.075) th *= 0.42;
          tree(c, tx, horizon + H * lay.y, th, W * lay.spread, lay.fill, rand, lay.rim);
        }
      }

      /* one blossom tree, the single warm-pink note in the whole page */
      var bxp = W * 0.17;
      glow(c, bxp, horizon - H * 0.15, W * 0.11, BLOSSOM, 0.2);
      tree(c, bxp, horizon + H * 0.03, H * 0.26, W * 0.085,
           "rgba(" + BLOSSOM + ",0.42)", rand);

      /* --- street lamps --- */
      var lamps = [];
      for (var lp = 0; lp < 5; lp++) {
        var lxp = W * (0.07 + lp * 0.215) + (rand() - 0.5) * W * 0.05;
        var lyp = horizon - H * (0.02 + rand() * 0.04);
        lamps.push({ x: lxp, y: lyp });
        glow(c, lxp, lyp, W * 0.07, LANTERN, 0.42);
      }

      /* --- wet plaza --- */
      var ground = c.createLinearGradient(0, horizon, 0, H);
      ground.addColorStop(0, "#10302a");
      ground.addColorStop(0.3, "#091d18");
      ground.addColorStop(0.7, "#05120f");
      ground.addColorStop(1, "#04100e");
      c.fillStyle = ground;
      c.fillRect(0, horizon, W, H - horizon);

      /* reflections: vertical smears under every light source */
      function reflect(x, rgb, alpha, width) {
        var rg = c.createLinearGradient(0, horizon, 0, H);
        rg.addColorStop(0, "rgba(" + rgb + "," + alpha + ")");
        rg.addColorStop(0.25, "rgba(" + rgb + "," + alpha * 0.35 + ")");
        rg.addColorStop(0.6, "rgba(" + rgb + ",0)");
        rg.addColorStop(1, "rgba(" + rgb + ",0)");
        c.fillStyle = rg;
        c.fillRect(x - width / 2, horizon, width, H - horizon);
      }
      reflect(spireX, BIO, 0.42, W * 0.045);
      reflect(bxp, BLOSSOM, 0.2, W * 0.055);
      for (var lr = 0; lr < lamps.length; lr++) {
        reflect(lamps[lr].x, LANTERN, 0.18 + (lr % 3) * 0.06, W * (0.02 + (lr % 2) * 0.018));
      }

      /* ripple lines across the wet stone */
      c.strokeStyle = "rgba(" + BIO + ",0.06)";
      c.lineWidth = 1;
      for (var rp = 0; rp < 14; rp++) {
        var ry = horizon + (H - horizon) * (rp / 14) * (rp / 14);
        c.beginPath();
        c.moveTo(0, ry);
        c.lineTo(W, ry);
        c.stroke();
      }

    }

    function seedMotes() {
      var count = Math.round(Math.min(W / 26, 54));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.7 + Math.random() * 1.9,
          rise: 0.12 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          sway: 0.3 + Math.random() * 1.2,
          warm: Math.random() < 0.35,
          pulse: 0.006 + Math.random() * 0.014
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canopy.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (!W || !H) return;

      canopy.width = scene.width = Math.round(W * dpr);
      canopy.height = scene.height = Math.round(H * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      paintScene();
      seedMotes();
      if (reduceMotion) blit();
    }

    function blit() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canopy.width, canopy.height);
      ctx.drawImage(scene, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame() {
      if (!running) return;
      blit();
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.phase += m.pulse;
        m.x += Math.sin(m.phase) * m.sway * 0.3;
        m.y -= m.rise;                                  /* spores drift upward */
        if (m.y + m.r < 0) { m.y = H + 8; m.x = Math.random() * W; }

        var a = 0.25 + Math.abs(Math.sin(m.phase)) * 0.5;
        var rgb = m.warm ? LANTERN : BIO;
        ctx.fillStyle = "rgba(" + rgb + "," + a + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(" + rgb + "," + a * 0.12 + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { running = false; }
      else if (!running && !reduceMotion) { running = true; requestAnimationFrame(frame); }
    });

    resize();
    window.addEventListener("load", resize);
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(function () { resize(); }).observe(canopy.parentNode);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ mobile nav */

  var nav = document.getElementById("nav");
  var burger = document.getElementById("menu-toggle");

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.querySelectorAll(".nav__links a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ------------------------------------------- scroll progress + stuck nav */

  var vine = document.getElementById("vine-progress");
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    vine.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* --------------------------------------------------- reveal on scroll-in */

  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + "ms";
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------- which section am i in */

  var navLinks = Array.prototype.slice.call(nav.querySelectorAll(".nav__links a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------- photo viewer */

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCap = document.getElementById("lightbox-cap");
  var supportsDialog = typeof lightbox.showModal === "function";

  document.querySelectorAll(".shot").forEach(function (shot) {
    shot.addEventListener("click", function () {
      var img = shot.querySelector("img");
      var fig = shot.closest("figure");
      var cap = fig && fig.querySelector("figcaption");
      if (!img || !supportsDialog) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxCap.textContent = cap ? cap.textContent : "";
      lightbox.showModal();
    });
  });

  if (supportsDialog) {
    lightbox.querySelector(".lightbox__close").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("close", function () { lightboxImg.src = ""; });
  }

  /* --------------------------------------------------------- email popover */
  /* a mailto: link is useless to anyone without a desktop mail client set up,
     so the address is shown in a small dialog you can copy from instead. */

  var mailbox = document.getElementById("mailbox");
  var mailButtons = document.querySelectorAll("[data-mail]");
  var canDialog = mailbox && typeof mailbox.showModal === "function";

  if (canDialog) {
    var mailAddr = document.getElementById("mailbox-addr");
    var mailCopy = document.getElementById("mailbox-copy");

    var resetCopy = function () { mailCopy.textContent = "copy"; };

    mailButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        resetCopy();
        mailbox.showModal();
        mailAddr.focus();
        mailAddr.select();
      });
    });

    mailCopy.addEventListener("click", function () {
      var done = function () {
        mailCopy.textContent = "copied";
        setTimeout(resetCopy, 1800);
      };
      var fallback = function () {
        mailAddr.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* nothing else to try */ }
      };
      mailAddr.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mailAddr.value).then(done, fallback);
      } else {
        fallback();
      }
    });

    mailbox.querySelector(".mailbox__close")
           .addEventListener("click", function () { mailbox.close(); });
    mailbox.addEventListener("click", function (e) {
      if (e.target === mailbox) mailbox.close();
    });
  } else {
    /* no <dialog> support: fall back to the mail app */
    mailButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.location.href = "mailto:" + btn.getAttribute("data-mail");
      });
    });
  }

  /* --------------------------------------------------------------- the year */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
