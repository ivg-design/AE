/* Hero background: script icons drifting behind the headline, pushed away by the
   cursor. Fixed sprite size (crisp, never blurry), full-hero spread, behind text. */
(function () {
  'use strict';

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  // Fixed on-screen sprite size — large, floating script icons behind the text.
  // Source art is 256px+, drawn at ~112px = a clean downscale (crisp).
  const SPRITE = 112;
  const OPACITY = 0.45;      // faint so the headline stays readable
  const MOUSE_RADIUS = 170;  // px of cursor influence
  const MOUSE_FORCE = 6;     // gentle push — icons drift away, never bounce hard
  const MAX_SPEED = 2.8;     // hard cap so the cursor can never fling an icon
  const DRIFT = 0.5;         // base wander speed (now the real on-screen speed)
  const DAMP = 0.94;         // velocity damping toward drift

  const sprites = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let raf = null;

  function resize() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeSprite(img) {
    const angle = rnd(0, Math.PI * 2);
    const spd = rnd(0.5, 1) * DRIFT;
    return {
      img,
      x: rnd(0, W), y: rnd(0, H),
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      // gentle per-sprite drift target so motion never fully stops
      dvx: Math.cos(angle) * spd, dvy: Math.sin(angle) * spd,
      rot: rnd(-0.25, 0.25), rotV: rnd(-0.0038, 0.0038),
      alpha: rnd(0.7, 1) * OPACITY,
      s: SPRITE * rnd(0.82, 1.12)   // slight size variety, still bounded
    };
  }

  // Spread the icons over a jittered grid so every one is fully visible and
  // separated on load — no clumping or off-screen spawns.
  function layoutOnLoad() {
    const n = sprites.length;
    if (!n) return;
    const cols = Math.max(1, Math.round(Math.sqrt(n * (W / Math.max(1, H)))));
    const rows = Math.ceil(n / cols);
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
    // shuffle so icon order isn't an obvious grid
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
    }
    const cw = W / cols, ch = H / rows;
    for (let i = 0; i < n; i++) {
      const p = sprites[i];
      const cell = cells[i % cells.length];
      const pad = p.s / 2 + 4;                    // keep the whole icon on-screen
      p.x = Math.min(W - pad, Math.max(pad, cell[0] * cw + cw * rnd(0.25, 0.75)));
      p.y = Math.min(H - pad, Math.max(pad, cell[1] * ch + ch * rnd(0.25, 0.75)));
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // pairwise collision — icons nudge each other apart instead of overlapping
    for (let i = 0; i < sprites.length; i++) {
      const a = sprites[i];
      for (let j = i + 1; j < sprites.length; j++) {
        const b = sprites[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        const minD = (a.s + b.s) * 0.44;   // ~visible radius sum (art has transparent margins)
        if (d2 > 0.01 && d2 < minD * minD) {
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const push = ((minD - d) / minD) * 0.6;   // proportional to overlap, gentle
          a.vx -= nx * push; a.vy -= ny * push;
          b.vx += nx * push; b.vy += ny * push;
        }
      }
    }

    for (let i = 0; i < sprites.length; i++) {
      const p = sprites[i];

      // occasional re-aim so the wander feels organic
      if (Math.random() < 0.004) {
        const a = rnd(0, Math.PI * 2), spd = rnd(0.5, 1) * DRIFT;
        p.dvx = Math.cos(a) * spd; p.dvy = Math.sin(a) * spd;
      }

      // cursor repulsion — soft quadratic falloff so nothing snaps near the cursor
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const t = 1 - d / MOUSE_RADIUS;
          const f = t * t * MOUSE_FORCE / d;
          p.vx += dx * f; p.vy += dy * f;
        }
      }

      // damp only the DEVIATION from the drift target, so the base wander speed
      // is preserved (never damped to a crawl) while cursor/collision impulses decay
      p.vx = p.dvx + (p.vx - p.dvx) * DAMP;
      p.vy = p.dvy + (p.vy - p.dvy) * DAMP;
      // hard speed cap keeps every push gentle — cursor or collision alike
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > MAX_SPEED) { p.vx = p.vx / sp * MAX_SPEED; p.vy = p.vy / sp * MAX_SPEED; }
      p.x += p.vx; p.y += p.vy;
      p.rot += p.rotV;

      // when an icon goes fully off one edge, re-enter it from JUST OFF the
      // opposite edge and slide it inward — a smooth glide, never a pop, and
      // the enforced inward velocity means it never parks off-screen
      const m = p.s / 2;
      if (p.x < -m || p.x > W + m) {
        const fromLeft = p.x < -m, dir = fromLeft ? -1 : 1;
        p.x = fromLeft ? W + m : -m;
        p.vx = dir * Math.max(Math.abs(p.vx), 0.9);
        p.dvx = dir * Math.max(Math.abs(p.dvx), DRIFT * 0.7);
      }
      if (p.y < -m || p.y > H + m) {
        const fromTop = p.y < -m, dir = fromTop ? -1 : 1;
        p.y = fromTop ? H + m : -m;
        p.vy = dir * Math.max(Math.abs(p.vy), 0.9);
        p.dvy = dir * Math.max(Math.abs(p.dvy), DRIFT * 0.7);
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(p.img, -p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    }
    raf = requestAnimationFrame(step);
  }

  function start(imgs) {
    if (!imgs.length) return;
    resize();
    // Density scales with hero area — a fuller field, still bounded so it won't wall off the text.
    const count = Math.max(12, Math.min(24, Math.round((W * H) / 34000)));
    for (let i = 0; i < count; i++) {
      sprites.push(makeSprite(imgs[i % imgs.length]));
    }
    layoutOnLoad();   // guarantee all icons are visible and spread on load
    if (reduce) { step(); cancelAnimationFrame(raf); raf = null; return; } // draw one static frame
    step();

    // Track the cursor at the window level (with a mousemove fallback) so plain
    // hover always registers — some browsers/extensions suppress pointermove on
    // the target element, which made the effect only respond while dragging.
    function onMove(e) {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
        mouse.x = x; mouse.y = y; mouse.active = true;
      } else {
        mouse.active = false; mouse.x = mouse.y = -9999;
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', () => { resize(); });
  }

  // Load icon images from the catalog, then kick off. Prefer the inline
  // catalog (window.__SCRIPTS__) to skip a redundant fetch; fall back to JSON.
  function begin(scripts) {
    const srcs = scripts.filter((s) => s.icon).map((s) => s.icon);
    let pending = srcs.length;
    const imgs = [];
    if (!pending) return;
    srcs.forEach((src) => {
      const img = new Image();
      img.onload = () => { imgs.push(img); if (--pending === 0) start(imgs); };
      img.onerror = () => { if (--pending === 0) start(imgs); };
      img.src = src;
    });
  }
  if (Array.isArray(window.__SCRIPTS__)) {
    begin(window.__SCRIPTS__);
  } else {
    fetch('data/scripts.json').then((r) => r.json()).then(begin).catch(() => {});
  }
})();
