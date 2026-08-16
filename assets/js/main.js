/* =========================================================================
   ghibli-core personal site — no dependencies, no build step.
   everything degrades gracefully if js is off: content is all in the html.
   ========================================================================= */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------ theme (day/night) */

  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var night = theme === "night";
    toggle.setAttribute("aria-pressed", String(night));
    var label = night ? "Switch to daytime theme" : "Switch to evening theme";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", night ? "#1e2620" : "#fbf7ee");
  }

  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) { /* private mode */ }
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "night" : "day"));

  toggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "night" ? "day" : "night";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
  });

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

  /* ------------------------------------- scroll: vine progress + stuck nav */

  var vine = document.getElementById("vine-progress");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    vine.style.width = pct + "%";
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* -------------------------------------------------- reveal on scroll-in */

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

  /* -------------------------------------------------- which section am i in */

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
      var cap = shot.closest("figure") && shot.closest("figure").querySelector("figcaption");
      if (!img || !supportsDialog) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxCap.textContent = cap ? cap.textContent : "";
      lightbox.showModal();
    });
  });

  if (supportsDialog) {
    lightbox.querySelector(".lightbox__close").addEventListener("click", function () {
      lightbox.close();
    });
    // click the backdrop (anywhere outside the image column) to dismiss
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", function () { lightboxImg.src = ""; });
  }

  /* --------------------------------------------------------- drifting bits */
  /* soft pollen + the occasional leaf, sized to the window, paused off-screen */

  var canvas = document.getElementById("drift");

  if (!reduceMotion && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var motes = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.round(Math.min(window.innerWidth / 26, 46));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 1.1 + Math.random() * 2.6,
          drift: 0.12 + Math.random() * 0.42,
          fall: 0.1 + Math.random() * 0.34,
          phase: Math.random() * Math.PI * 2,
          sway: 0.4 + Math.random() * 1.1,
          leaf: Math.random() < 0.18,
          spin: (Math.random() - 0.5) * 0.02,
          angle: Math.random() * Math.PI
        });
      }
    }

    function palette() {
      return root.getAttribute("data-theme") === "night"
        ? { dot: "rgba(214, 232, 190, .34)", leaf: "rgba(161, 192, 136, .32)" }
        : { dot: "rgba(255, 252, 236, .75)", leaf: "rgba(139, 165, 115, .30)" };
    }

    function frame(time) {
      if (!running) return;
      var colors = palette();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.phase += 0.01;
        m.x += Math.sin(m.phase) * m.sway * 0.35 + m.drift * 0.25;
        m.y += m.fall;
        m.angle += m.spin;

        if (m.y - m.r > window.innerHeight) { m.y = -10; m.x = Math.random() * window.innerWidth; }
        if (m.x - m.r > window.innerWidth) { m.x = -10; }

        if (m.leaf) {
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(m.angle);
          ctx.fillStyle = colors.leaf;
          ctx.beginPath();
          ctx.ellipse(0, 0, m.r * 2.4, m.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = colors.dot;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    });

    resize();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------- the year */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
