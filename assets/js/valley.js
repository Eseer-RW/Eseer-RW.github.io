/* =========================================================================
   the daylight hero, painted on canvas.
   layered foliage with real leaf shapes, light through the canopy, a still
   pond, and an overhanging branch framing the top — atmospheric perspective
   does the depth: far layers are pale and hazy, near layers dark and sharp.
   ========================================================================= */

(function () {
  "use strict";

  var canvas = document.getElementById("valley");
  if (!canvas || !canvas.getContext) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  var scene = document.createElement("canvas");
  var sctx = scene.getContext("2d");
  var W = 0, H = 0, dpr = 1, running = true, motes = [];

  /* fixed seed: the same forest every load */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ---------------------------------------------------------- leaf shapes */

  /* a single pointed leaf, drawn as two mirrored curves */
  function leaf(c, x, y, len, wide, angle) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.45, -wide, len, 0);
    c.quadraticCurveTo(len * 0.45, wide, 0, 0);
    c.closePath();
    c.fill();
    c.restore();
  }

  /* a mass of leaves around a point — the unit every canopy is built from */
  function cluster(c, x, y, radius, count, size, fill, rand, lit, shade) {
    for (var i = 0; i < count; i++) {
      var a = rand() * Math.PI * 2;
      var d = 0.45 * radius + Math.pow(rand(), 0.5) * radius * 0.62;  /* bias to the edge */
      var lx = x + Math.cos(a) * d;
      var ly = y + Math.sin(a) * d * 0.8;
      var s = size * (0.6 + rand() * 0.85);
      /* the sun is up and to the right: that side catches light, the other falls into shade */
      var toward = (lx - x) / radius - (ly - y) / radius;
      var tone = fill;
      if (lit && toward > 0.25 && rand() < 0.55) tone = lit;
      else if (shade && toward < -0.3 && rand() < 0.4) tone = shade;
      c.fillStyle = tone;
      leaf(c, lx, ly, s, s * 0.4, rand() * Math.PI * 2);
    }
  }

  /* ------------------------------------------------------------ the scene */

  function paint() {
    var rand = rng(19940721);
    var horizon = H * 0.68;
    var c = sctx;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);

    /* --- sky: bright behind the canopy, deepening upward --- */
    var sky = c.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#6f9a72");
    sky.addColorStop(0.45, "#a8c893");
    sky.addColorStop(0.8, "#dcebbe");
    sky.addColorStop(1, "#f2f4d4");
    c.fillStyle = sky;
    c.fillRect(0, 0, W, horizon);

    /* --- the sun, sitting just above the far treeline --- */
    var sunX = W * 0.66, sunY = H * 0.2;
    var bloom = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.34);
    bloom.addColorStop(0, "rgba(255, 253, 226, .95)");
    bloom.addColorStop(0.18, "rgba(250, 250, 205, .4)");
    bloom.addColorStop(0.5, "rgba(226, 240, 180, .14)");
    bloom.addColorStop(1, "rgba(226, 240, 180, 0)");
    c.fillStyle = bloom;
    c.fillRect(0, 0, W, horizon + H * 0.1);

    /* --- light shafts through the canopy --- */
    c.save();
    c.globalCompositeOperation = "lighter";
    for (var r = 0; r < 7; r++) {
      var spread = (r - 3) * 0.14 + (rand() - 0.5) * 0.05;
      var w = W * (0.03 + rand() * 0.05);
      c.save();
      c.translate(sunX, sunY);
      c.rotate(spread);
      var ray = c.createLinearGradient(0, 0, 0, H * 0.9);
      ray.addColorStop(0, "rgba(255, 255, 224, .16)");
      ray.addColorStop(0.6, "rgba(255, 255, 224, .05)");
      ray.addColorStop(1, "rgba(255, 255, 224, 0)");
      c.fillStyle = ray;
      c.beginPath();
      c.moveTo(-w * 0.18, 0);
      c.lineTo(w * 0.18, 0);
      c.lineTo(w * 1.5, H * 0.9);
      c.lineTo(-w * 1.5, H * 0.9);
      c.closePath();
      c.fill();
      c.restore();
    }
    c.restore();

    /* --- receding treelines: pale and hazy far, dark and detailed near --- */
    var bands = [
      { y: 0.13, h: 0.10, fill: "#a6c491", lit: "#c9dcb0", shade: "#93b481",
        size: 0.008,  step: 0.075, r: 0.042 },
      { y: 0.06, h: 0.17, fill: "#6b9459", lit: "#9dc17c", shade: "#537c47",
        size: 0.012,  step: 0.115, r: 0.062 },
      { y: 0.00, h: 0.26, fill: "#335c30", lit: "#5f9247", shade: "#22421f",
        size: 0.016,  step: 0.16,  r: 0.085 }
    ];

    for (var b = 0; b < bands.length; b++) {
      var bd = bands[b];
      var baseY = horizon + H * 0.03;

      for (var x = -W * 0.06; x < W * 1.06; x += W * bd.step) {
        var tx = x + (rand() - 0.5) * W * 0.045;
        var th = H * bd.h * (0.72 + rand() * 0.56);
        var ty = baseY - th;
        var cr = W * bd.r * (0.8 + rand() * 0.45);

        /* trunk, just enough to read as a tree */
        c.strokeStyle = bd.shade;
        c.lineWidth = Math.max(1.2, cr * 0.085);
        c.beginPath();
        c.moveTo(tx, baseY);
        c.quadraticCurveTo(tx + (rand() - 0.5) * cr * 0.1, ty + cr * 0.9,
                           tx + (rand() - 0.5) * cr * 0.35, ty + cr * 0.35);
        c.stroke();

        /* canopy built from a few offset lobes, so no two trees share a shape */
        var lobes = 3 + Math.floor(rand() * 3);
        c.fillStyle = bd.fill;
        c.beginPath();
        for (var m2 = 0; m2 < lobes; m2++) {
          var mr = cr * (0.4 + rand() * 0.42);
          var mx2 = tx + (rand() - 0.5) * cr * 1.15;
          var my2 = ty + (rand() - 0.5) * cr * 0.8;
          c.moveTo(mx2 + mr, my2);
          c.arc(mx2, my2, mr, 0, Math.PI * 2);
        }
        c.fill();

        /* a shaded underside before the leaves go on */
        c.fillStyle = bd.shade;
        c.beginPath();
        c.ellipse(tx - cr * 0.2, ty + cr * 0.45, cr * 0.62, cr * 0.3, 0, 0, Math.PI * 2);
        c.fill();

        /* leaves around the edge, so the silhouette stays crisp */
        cluster(c, tx, ty, cr * 1.05, Math.round(cr * 0.75), W * bd.size,
                bd.fill, rand, bd.lit, bd.shade);
      }
    }

    /* haze between the layers — this is what sells the distance */
    var haze = c.createLinearGradient(0, horizon - H * 0.3, 0, horizon);
    haze.addColorStop(0, "rgba(238, 245, 214, 0)");
    haze.addColorStop(1, "rgba(238, 245, 214, .26)");
    c.fillStyle = haze;
    c.fillRect(0, horizon - H * 0.3, W, H * 0.3);

    /* --- the pond --- */
    var water = c.createLinearGradient(0, horizon, 0, H);
    water.addColorStop(0, "#7ba873");
    water.addColorStop(0.3, "#4d7c5c");
    water.addColorStop(0.75, "#2a5344");
    water.addColorStop(1, "#1d3f37");
    c.fillStyle = water;
    c.fillRect(0, horizon, W, H - horizon);

    /* the treeline's own reflection, hugging the shore */
    var mirror = c.createLinearGradient(0, horizon, 0, horizon + (H - horizon) * 0.45);
    mirror.addColorStop(0, "rgba(30, 62, 34, .62)");
    mirror.addColorStop(0.4, "rgba(34, 68, 40, .24)");
    mirror.addColorStop(1, "rgba(34, 68, 40, 0)");
    c.fillStyle = mirror;
    c.fillRect(0, horizon, W, (H - horizon) * 0.45);

    /* the sun's path down the water */
    var path = c.createLinearGradient(0, horizon, 0, H);
    path.addColorStop(0, "rgba(255, 253, 214, .55)");
    path.addColorStop(0.45, "rgba(255, 253, 214, .14)");
    path.addColorStop(1, "rgba(255, 253, 214, 0)");
    c.fillStyle = path;
    c.fillRect(sunX - W * 0.055, horizon, W * 0.11, H - horizon);

    /* inverted canopy, smeared downward — a reflection, not a mirror */
    for (var rf = 0; rf < 30; rf++) {
      var rx = rand() * W;
      var rw = W * (0.03 + rand() * 0.09);
      var rh = (H - horizon) * (0.25 + rand() * 0.55);
      var dark = rand() > 0.45;
      var rg2 = c.createLinearGradient(0, horizon, 0, horizon + rh);
      rg2.addColorStop(0, dark ? "rgba(40, 74, 50, .5)" : "rgba(150, 190, 140, .32)");
      rg2.addColorStop(0.5, dark ? "rgba(40, 74, 50, .16)" : "rgba(150, 190, 140, .1)");
      rg2.addColorStop(1, "rgba(40, 74, 50, 0)");
      c.fillStyle = rg2;
      c.fillRect(rx, horizon, rw, rh);
    }

    /* ripple highlights, tighter near the horizon */
    for (var rp = 0; rp < 110; rp++) {
      var t = Math.pow(rand(), 1.8);
      var ry = horizon + (H - horizon) * t;
      var rlen = W * (0.008 + rand() * 0.05) * (0.35 + t * 1.2);
      c.fillStyle = "rgba(236, 247, 214," + (0.05 + rand() * 0.26 * (1 - t * 0.7)) + ")";
      c.beginPath();
      c.ellipse(rand() * W, ry, rlen, Math.max(0.6, (H - horizon) * 0.004 * (0.3 + t)),
                0, 0, Math.PI * 2);
      c.fill();
    }

    /* lily pads, and two lotus flowers for the one warm note */
    for (var lp = 0; lp < 16; lp++) {
      var t2 = 0.25 + Math.pow(rand(), 0.8) * 0.75;
      var px = rand() * W;
      var py = horizon + (H - horizon) * t2;
      var pr = (H - horizon) * 0.035 * (0.4 + t2 * 1.4);
      c.fillStyle = "rgba(46, 82, 60," + (0.5 + rand() * 0.35) + ")";
      c.beginPath();
      c.ellipse(px, py, pr, pr * 0.42, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(150, 190, 140,.25)";
      c.beginPath();
      c.ellipse(px - pr * 0.15, py - pr * 0.1, pr * 0.6, pr * 0.24, 0, 0, Math.PI * 2);
      c.fill();
    }
    [[W * 0.22, 0.72], [W * 0.81, 0.86]].forEach(function (f) {
      var fy = horizon + (H - horizon) * f[1];
      var fr = (H - horizon) * 0.045;
      for (var pt = 0; pt < 7; pt++) {
        c.fillStyle = pt % 2 ? "rgba(247, 205, 214,.95)" : "rgba(238, 170, 190,.95)";
        leaf(c, f[0], fy, fr, fr * 0.34, (pt / 7) * Math.PI * 2 - Math.PI / 2);
      }
      c.fillStyle = "rgba(250, 236, 190,.95)";
      c.beginPath();
      c.arc(f[0], fy, fr * 0.16, 0, Math.PI * 2);
      c.fill();
    });

    /* --- the overhanging branch: the nearest thing in frame, so the darkest --- */
    var deep = "#14261a", deepLit = "#33502f";

    c.strokeStyle = deep;
    c.lineCap = "round";
    c.lineWidth = H * 0.035;
    c.beginPath();
    c.moveTo(-W * 0.05, -H * 0.02);
    c.bezierCurveTo(W * 0.25, H * 0.14, W * 0.55, H * 0.02, W * 1.05, H * 0.24);
    c.stroke();

    /* smaller limbs dropping off the main branch */
    var limbs = [0.18, 0.34, 0.52, 0.72, 0.88];
    for (var lb = 0; lb < limbs.length; lb++) {
      var t3 = limbs[lb];
      var bxp = W * (t3 * 1.1 - 0.05);
      var byp = H * (0.02 + Math.sin(t3 * 2.6) * 0.09 + t3 * 0.12);
      c.lineWidth = H * 0.012;
      c.beginPath();
      c.moveTo(bxp, byp);
      c.quadraticCurveTo(bxp + W * 0.03, byp + H * 0.09, bxp - W * 0.02, byp + H * 0.16);
      c.stroke();
      cluster(c, bxp, byp + H * 0.12, W * 0.075, Math.round(W * 0.075), W * 0.019,
              deep, rand, deepLit);
    }

    /* leaf mass hugging the branch itself */
    for (var cl = 0; cl < 16; cl++) {
      var ct = cl / 15;
      var cx2 = W * (ct * 1.1 - 0.05);
      var cy2 = H * (0.01 + Math.sin(ct * 2.6) * 0.09 + ct * 0.12);
      cluster(c, cx2, cy2, W * 0.055, Math.round(W * 0.06), W * 0.017, deep, rand, deepLit);
    }

    /* corner foliage, bottom-left, to close the frame */
    cluster(c, -W * 0.02, H * 1.0, W * 0.13, Math.round(W * 0.1), W * 0.021, deep, rand, deepLit);
    cluster(c, W * 1.02, H * 0.98, W * 0.11, Math.round(W * 0.09), W * 0.02, deep, rand, deepLit);

    /* --- dappled light, cast through everything --- */
    c.save();
    c.globalCompositeOperation = "lighter";
    for (var dp = 0; dp < 40; dp++) {
      var dx = rand() * W, dy = rand() * H * 0.95;
      var dr = W * (0.004 + rand() * 0.016);
      var g = c.createRadialGradient(dx, dy, 0, dx, dy, dr);
      g.addColorStop(0, "rgba(255, 255, 220,.3)");
      g.addColorStop(1, "rgba(255, 255, 220, 0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(dx, dy, dr, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  /* ------------------------------------------------------ floating pollen */

  function seedMotes() {
    var count = Math.round(Math.min(W / 30, 40));
    motes = [];
    for (var i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.9 + Math.random() * 2.2,
        rise: 0.06 + Math.random() * 0.28,
        phase: Math.random() * Math.PI * 2,
        sway: 0.3 + Math.random() * 1.1,
        pulse: 0.005 + Math.random() * 0.012
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (!W || !H) return;
    canvas.width = scene.width = Math.round(W * dpr);
    canvas.height = scene.height = Math.round(H * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
    seedMotes();
    if (reduceMotion) blit();
  }

  function blit() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      m.y -= m.rise;
      if (m.y + m.r < 0) { m.y = H + 8; m.x = Math.random() * W; }
      var a = 0.2 + Math.abs(Math.sin(m.phase)) * 0.45;
      ctx.fillStyle = "rgba(255, 253, 224," + a + ")";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  var t;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(resize, 200); });
  window.addEventListener("load", resize);
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(function () { resize(); }).observe(canvas.parentNode);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; }
    else if (!running && !reduceMotion) { running = true; requestAnimationFrame(frame); }
  });

  resize();
  if (!reduceMotion) requestAnimationFrame(frame);
})();
