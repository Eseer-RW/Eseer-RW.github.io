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

  /* the scene has to follow the day/evening toggle, the way the old SVG did
     through CSS variables. canvas cannot read those, so the palette lives here. */
  var DAY = {
    sky:   ["#6f9a72", "#a8c893", "#dcebbe", "#f2f4d4"],
    bloom: ["rgba(255,253,226,.95)", "rgba(250,250,205,.55)", "rgba(226,240,180,.22)", "rgba(226,240,180,0)"],
    ray:   ["rgba(255,255,224,.16)", "rgba(255,255,224,.05)", "rgba(255,255,224,0)"],
    bands: [
      { y: .13, h: .10, fill: "#a6c491", lit: "#c9dcb0", shade: "#93b481", size: .008, step: .075, r: .042 },
      { y: .06, h: .17, fill: "#6b9459", lit: "#9dc17c", shade: "#537c47", size: .012, step: .115, r: .062 },
      { y: .00, h: .26, fill: "#335c30", lit: "#5f9247", shade: "#22421f", size: .016, step: .16,  r: .085 }
    ],
    haze:  ["rgba(238,245,214,0)", "rgba(238,245,214,.18)"],
    water: ["#7ba873", "#4d7c5c", "#2a5344", "#1d3f37"],
    mirror:["rgba(30,62,34,.62)", "rgba(34,68,40,.24)", "rgba(34,68,40,0)"],
    path:  ["rgba(255,253,214,.55)", "rgba(255,253,214,.14)", "rgba(255,253,214,0)"],
    refl:  ["rgba(40,74,50,", "rgba(150,190,140,"],
    ripple:"rgba(236,247,214,",
    pad:   ["rgba(46,82,60,", "rgba(150,190,140,.25)"],
    lotus: ["rgba(247,205,214,.95)", "rgba(238,170,190,.95)", "rgba(250,236,190,.95)"],
    bank:  "#41603a", bankLit: "#618a4c", bankEdge: "#2d4529", reed: "#2b4526",
    deep:  "#14261a", deepLit: "#33502f",
    dapple:["rgba(255,255,220,.3)", "rgba(255,255,220,0)"],
    mote:  "rgba(255,253,224,"
  };

  var NIGHT = {
    sky:   ["#0d1713", "#17271f", "#24382b", "#334a36"],
    bloom: ["rgba(228,238,208,.8)", "rgba(200,220,175,.32)", "rgba(150,185,145,.12)", "rgba(150,185,145,0)"],
    ray:   ["rgba(214,232,190,.07)", "rgba(214,232,190,.025)", "rgba(214,232,190,0)"],
    bands: [
      { y: .13, h: .10, fill: "#425c49", lit: "#61805f", shade: "#37503f", size: .008, step: .075, r: .042 },
      { y: .06, h: .17, fill: "#2b4131", lit: "#476644", shade: "#213424", size: .012, step: .115, r: .062 },
      { y: .00, h: .26, fill: "#16281c", lit: "#2f4b2e", shade: "#0e1a12", size: .016, step: .16,  r: .085 }
    ],
    haze:  ["rgba(150,180,150,0)", "rgba(150,180,150,.11)"],
    water: ["#31514540", "#1e3831", "#132723", "#0c1a17"],
    mirror:["rgba(8,20,13,.6)", "rgba(10,24,16,.24)", "rgba(10,24,16,0)"],
    path:  ["rgba(226,236,205,.4)", "rgba(226,236,205,.1)", "rgba(226,236,205,0)"],
    refl:  ["rgba(10,24,16,", "rgba(110,145,112,"],
    ripple:"rgba(214,232,190,",
    pad:   ["rgba(14,30,20,", "rgba(90,130,95,.22)"],
    lotus: ["rgba(206,158,172,.88)", "rgba(184,128,148,.88)", "rgba(214,198,152,.9)"],
    bank:  "#1d3021", bankLit: "#2e4a2c", bankEdge: "#132015", reed: "#132218",
    deep:  "#08110b", deepLit: "#1d3220",
    dapple:["rgba(214,232,190,.16)", "rgba(214,232,190,0)"],
    mote:  "rgba(226,240,200,"
  };

  var root = document.documentElement;
  function palette() {
    return root.getAttribute("data-theme") === "night" ? NIGHT : DAY;
  }

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
    var c = sctx;
    var P = palette();
    var treeBase = H * 0.615;   /* where the trunks meet the ground */

    /* NB: resize() set the dpr transform — do not reset it here, or the
       scene draws in CSS pixels into a device-pixel buffer and only fills
       the top-left corner on any display where dpr > 1. */
    c.clearRect(0, 0, W, H);

    /* --- sky: bright behind the canopy, deepening upward --- */
    var sky = c.createLinearGradient(0, 0, 0, treeBase);
    sky.addColorStop(0, P.sky[0]);
    sky.addColorStop(0.45, P.sky[1]);
    sky.addColorStop(0.8, P.sky[2]);
    sky.addColorStop(1, P.sky[3]);
    c.fillStyle = sky;
    c.fillRect(0, 0, W, treeBase);

    /* --- the sun, sitting just above the far treeline --- */
    var sunX = W * 0.66, sunY = H * 0.2;
    var bloom = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.34);
    bloom.addColorStop(0, P.bloom[0]);
    bloom.addColorStop(0.18, P.bloom[1]);
    bloom.addColorStop(0.5, P.bloom[2]);
    bloom.addColorStop(1, P.bloom[3]);
    c.fillStyle = bloom;
    c.fillRect(0, 0, W, treeBase + H * 0.1);

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
      ray.addColorStop(0, P.ray[0]);
      ray.addColorStop(0.6, P.ray[1]);
      ray.addColorStop(1, P.ray[2]);
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


    /* --- the ground ---------------------------------------------------------
       laid down before the trees so the trunks stand on it rather than being
       buried by it. the water is painted over its lower half further down. */
    var shoreY = H * 0.70;

    /* one shoreline, reused to clip the water, cut the ground, and place reeds */
    var shoreStep = Math.max(8, W / 90);
    var shore = [];
    for (var sx = -20; sx <= W + 20 + shoreStep; sx += shoreStep) {
      shore.push({
        x: sx,
        y: shoreY
             + Math.sin(sx * 0.0062) * H * 0.020
             + Math.sin(sx * 0.021 + 1.3) * H * 0.009
             + Math.sin(sx * 0.058 + 2.6) * H * 0.003
      });
    }
    function traceShore(c2) {
      c2.moveTo(shore[0].x, shore[0].y);
      for (var i = 1; i < shore.length; i++) c2.lineTo(shore[i].x, shore[i].y);
    }
    function shoreAt(x) {
      var i = Math.max(0, Math.min(shore.length - 1, Math.round((x + 20) / shoreStep)));
      return shore[i].y;
    }

    var groundTop = treeBase - H * 0.15;
    c.fillStyle = P.bank;
    c.beginPath();
    c.moveTo(-20, groundTop);
    for (var gx0 = -20; gx0 <= W + 20; gx0 += W * 0.04) {
      c.lineTo(gx0, groundTop + Math.sin(gx0 * 0.0055) * H * 0.032
                              + Math.sin(gx0 * 0.019 + 2) * H * 0.013);
    }
    c.lineTo(W + 20, H + 10);
    c.lineTo(-20, H + 10);
    c.closePath();
    c.fill();

    /* sunlit crown of the bank falling into shadow at the water */
    c.save();
    c.clip();
    var bankGrad = c.createLinearGradient(0, groundTop + H * 0.06, 0, shoreY + H * 0.01);
    bankGrad.addColorStop(0, P.bankLit);
    bankGrad.addColorStop(0.5, P.bank);
    bankGrad.addColorStop(1, P.bankEdge);
    c.fillStyle = bankGrad;
    c.fillRect(-20, groundTop - H * 0.04, W + 40, H * 0.3);
    /* grass texture, so it is not a flat slab */
    for (var tg = 0; tg < 260; tg++) {
      var tx0 = rand() * W;
      var ty0 = groundTop + rand() * (shoreY - groundTop) * 1.05;
      var th0 = H * (0.004 + rand() * 0.012);
      c.strokeStyle = rand() > 0.6 ? P.bankLit : P.bankEdge;
      c.lineWidth = Math.max(0.8, H * 0.0014);
      c.beginPath();
      c.moveTo(tx0, ty0);
      c.quadraticCurveTo(tx0 + th0 * 0.3, ty0 - th0 * 0.6, tx0 + (rand() - 0.5) * th0, ty0 - th0);
      c.stroke();
    }
    c.restore();

    /* low shrubs along the crown of the bank, so its edge is not a straight
       line wherever a tree does not happen to cover it */
    for (var sh = -1; sh < 24; sh++) {
      var sx2 = (sh / 23) * W + (rand() - 0.5) * W * 0.035;
      var sy2 = groundTop + Math.sin(sx2 * 0.0055) * H * 0.032
                          + Math.sin(sx2 * 0.019 + 2) * H * 0.013 + H * 0.006;
      cluster(c, sx2, sy2, W * (0.024 + rand() * 0.016),
              Math.round(W * 0.03), W * 0.0105,
              P.bands[2].fill, rand, P.bands[2].lit, P.bands[2].shade);
    }

    /* --- receding treelines: pale and hazy far, dark and detailed near --- */
    var bands = P.bands;
    var mirrors = [];

    for (var b = 0; b < bands.length; b++) {
      var bd = bands[b];
      var baseY = treeBase;

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
        var shape = [];
        for (var m2 = 0; m2 < lobes; m2++) {
          var mr = cr * (0.4 + rand() * 0.42);
          var mx2 = tx + (rand() - 0.5) * cr * 1.15;
          var my2 = ty + (rand() - 0.5) * cr * 0.8;
          shape.push({ x: mx2, y: my2, r: mr });
          c.moveTo(mx2 + mr, my2);
          c.arc(mx2, my2, mr, 0, Math.PI * 2);
        }
        c.fill();
        mirrors.push({ x: tx, ty: ty, cr: cr, base: baseY,
                       lobes: shape, fill: bd.fill, shade: bd.shade });

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
    var haze = c.createLinearGradient(0, treeBase - H * 0.34, 0, treeBase);
    haze.addColorStop(0, P.haze[0]);
    haze.addColorStop(1, P.haze[1]);
    c.fillStyle = haze;
    c.fillRect(0, treeBase - H * 0.34, W, H * 0.34);

    /* --- the lake, filling everything below the shoreline --- */
    c.save();
    c.beginPath();
    traceShore(c);
    c.lineTo(W + 20, H + 10);
    c.lineTo(-20, H + 10);
    c.closePath();
    c.clip();

    var water = c.createLinearGradient(0, shoreY, 0, H);
    water.addColorStop(0, P.water[0]);
    water.addColorStop(0.3, P.water[1]);
    water.addColorStop(0.75, P.water[2]);
    water.addColorStop(1, P.water[3]);
    c.fillStyle = water;
    c.fillRect(-20, shoreY - H * 0.06, W + 40, H);

    /* --- reflections: the actual trees, mirrored, not random smears ---------
       drawn into their own buffer about the waterline, faded out with a
       destination-out gradient, then blitted back in horizontal slices with a
       sideways offset so the surface reads as moving water. */
    var reflH = H - shoreY + H * 0.02;
    var rc = document.createElement("canvas");
    rc.width = Math.max(1, Math.round(W * dpr));
    rc.height = Math.max(1, Math.round(reflH * dpr));
    var rx = rc.getContext("2d");
    rx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* mirror world-space y about the shoreline into this buffer */
    rx.save();
    rx.translate(0, shoreY);
    rx.scale(1, -1);

    rx.fillStyle = P.bankEdge;
    rx.fillRect(-20, shoreY - H * 0.02, W + 40, H * 0.02);

    for (var rt = 0; rt < mirrors.length; rt++) {
      var mt = mirrors[rt];
      rx.fillStyle = mt.fill;
      rx.beginPath();
      for (var ml = 0; ml < mt.lobes.length; ml++) {
        var lo = mt.lobes[ml];
        rx.moveTo(lo.x + lo.r, lo.y);
        rx.arc(lo.x, lo.y, lo.r, 0, Math.PI * 2);
      }
      rx.fill();
      rx.strokeStyle = mt.shade;
      rx.lineWidth = Math.max(1.2, mt.cr * 0.085);
      rx.beginPath();
      rx.moveTo(mt.x, mt.base);
      rx.lineTo(mt.x, mt.ty + mt.cr * 0.5);
      rx.stroke();
    }
    rx.restore();

    /* fade the reflection out with depth */
    rx.globalCompositeOperation = "destination-out";
    var fade = rx.createLinearGradient(0, 0, 0, reflH);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.35, "rgba(0,0,0,.45)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    rx.fillStyle = fade;
    rx.fillRect(0, 0, W, reflH);
    rx.globalCompositeOperation = "source-over";

    /* blit it back, slice by slice, wobbling sideways with depth */
    c.globalAlpha = 0.58;
    var slice = 3;
    for (var sy = 0; sy < reflH; sy += slice) {
      var st = sy / reflH;
      var amp = H * 0.002 + st * H * 0.014;
      var off = Math.sin(sy * 0.09 + 0.7) * amp + Math.sin(sy * 0.031) * amp * 0.5;
      c.drawImage(rc,
        0, Math.round(sy * dpr), rc.width, Math.ceil(slice * dpr),
        off, shoreY + sy, W, slice + 0.5);
    }
    c.globalAlpha = 1;

    /* the sun's path down the water */
    var path = c.createLinearGradient(0, shoreY, 0, H);
    path.addColorStop(0, P.path[0]);
    path.addColorStop(0.45, P.path[1]);
    path.addColorStop(1, P.path[2]);
    /* drawn as thin columns with a cosine falloff, so the glitter path has no
       hard vertical edges */
    var pw = W * 0.15, cols = 30;
    for (var pc = 0; pc < cols; pc++) {
      var fx = pc / (cols - 1);
      c.globalAlpha = Math.pow(Math.cos((fx - 0.5) * Math.PI), 2);
      c.fillStyle = path;
      c.fillRect(sunX - pw / 2 + fx * pw, shoreY - H * 0.02, pw / cols + 1, H);
    }
    c.globalAlpha = 1;

    /* ripple highlights, tighter near the shore */
    for (var rp = 0; rp < 120; rp++) {
      var t = Math.pow(rand(), 1.8);
      var ry = shoreY + (H - shoreY) * t;
      var rlen = W * (0.008 + rand() * 0.05) * (0.35 + t * 1.2);
      c.fillStyle = P.ripple + (0.05 + rand() * 0.26 * (1 - t * 0.7)) + ")";
      c.beginPath();
      c.ellipse(rand() * W, ry, rlen, Math.max(0.6, (H - shoreY) * 0.004 * (0.3 + t)),
                0, 0, Math.PI * 2);
      c.fill();
    }

    /* lily pads, and two lotus flowers for the one warm note */
    for (var lp = 0; lp < 16; lp++) {
      var t2 = 0.2 + Math.pow(rand(), 0.8) * 0.8;
      var px = rand() * W;
      var py = shoreY + (H - shoreY) * t2;
      var pr = (H - shoreY) * 0.04 * (0.4 + t2 * 1.4);
      c.fillStyle = P.pad[0] + (0.5 + rand() * 0.35) + ")";
      c.beginPath();
      c.ellipse(px, py, pr, pr * 0.42, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = P.pad[1];
      c.beginPath();
      c.ellipse(px - pr * 0.15, py - pr * 0.1, pr * 0.6, pr * 0.24, 0, 0, Math.PI * 2);
      c.fill();
    }
    [[W * 0.22, 0.62], [W * 0.81, 0.8]].forEach(function (f) {
      var fy = shoreY + (H - shoreY) * f[1];
      var fr = (H - shoreY) * 0.05;
      for (var pt = 0; pt < 7; pt++) {
        c.fillStyle = pt % 2 ? P.lotus[0] : P.lotus[1];
        leaf(c, f[0], fy, fr, fr * 0.34, (pt / 7) * Math.PI * 2 - Math.PI / 2);
      }
      c.fillStyle = P.lotus[2];
      c.beginPath();
      c.arc(f[0], fy, fr * 0.16, 0, Math.PI * 2);
      c.fill();
    });

    c.restore();   /* done with the water clip */

    /* grass and reeds along the water's edge */
    for (var gx = -10; gx < W + 10; gx += W * 0.012) {
      var gy = shoreAt(gx);
      var gh = H * (0.012 + rand() * 0.03);
      var lean = (rand() - 0.5) * gh * 0.7;
      c.strokeStyle = rand() > 0.7 ? P.bankLit : P.reed;
      c.lineWidth = Math.max(1, H * 0.0018);
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(gx, gy + H * 0.004);
      c.quadraticCurveTo(gx + lean * 0.4, gy - gh * 0.6, gx + lean, gy - gh);
      c.stroke();
    }
    for (var rd = 0; rd < 9; rd++) {
      var dx2 = (rd / 9) * W + (rand() - 0.5) * W * 0.06;
      cluster(c, dx2, shoreAt(dx2) - H * 0.03, W * 0.022,
              Math.round(W * 0.02), W * 0.009, P.reed, rand, P.bankLit);
    }

    /* --- the overhanging branch: the nearest thing in frame, so the darkest --- */
    var deep = P.deep, deepLit = P.deepLit;

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
      g.addColorStop(0, P.dapple[0]);
      g.addColorStop(1, P.dapple[1]);
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
      ctx.fillStyle = palette().mote + a + ")";
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

  /* the lantern toggle swaps data-theme; repaint the scene to match */
  if (typeof MutationObserver === "function") {
    new MutationObserver(function () {
      if (!W || !H) return;
      paint();
      if (reduceMotion) blit();
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  resize();
  if (!reduceMotion) requestAnimationFrame(frame);
})();
