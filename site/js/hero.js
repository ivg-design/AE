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

  // Fixed on-screen sprite size — small enough to stay behind the text, large
  // enough not to look like noise. Source art is 256px, drawn at ~40px = crisp.
  const SPRITE = 44;
  const OPACITY = 0.5;       // faint so the headline stays readable
  const MOUSE_RADIUS = 150;  // px of cursor influence
  const MOUSE_FORCE = 26;    // push strength
  const DRIFT = 0.18;        // base wander speed
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
      rot: rnd(-0.25, 0.25), rotV: rnd(-0.002, 0.002),
      alpha: rnd(0.7, 1) * OPACITY,
      s: SPRITE * rnd(0.82, 1.12)   // slight size variety, still bounded
    };
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    const half = SPRITE;
    for (let i = 0; i < sprites.length; i++) {
      const p = sprites[i];

      // occasional re-aim so the wander feels organic
      if (Math.random() < 0.004) {
        const a = rnd(0, Math.PI * 2), spd = rnd(0.5, 1) * DRIFT;
        p.dvx = Math.cos(a) * spd; p.dvy = Math.sin(a) * spd;
      }
      p.vx += (p.dvx - p.vx) * 0.02;
      p.vy += (p.dvy - p.vy) * 0.02;

      // cursor repulsion
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / MOUSE_RADIUS) * MOUSE_FORCE / d;
          p.vx += dx * f; p.vy += dy * f;
        }
      }

      p.vx *= DAMP; p.vy *= DAMP;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.rotV;

      // wrap around the full hero so icons cover the whole width
      if (p.x < -half) p.x = W + half;
      else if (p.x > W + half) p.x = -half;
      if (p.y < -half) p.y = H + half;
      else if (p.y > H + half) p.y = -half;

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
    // Density scales with hero area but stays bounded so it never crowds the text.
    const count = Math.max(14, Math.min(30, Math.round((W * H) / 46000)));
    for (let i = 0; i < count; i++) {
      sprites.push(makeSprite(imgs[i % imgs.length]));
    }
    if (reduce) { step(); cancelAnimationFrame(raf); raf = null; return; } // draw one static frame
    step();

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    hero.addEventListener('pointerleave', () => { mouse.active = false; mouse.x = mouse.y = -9999; });
    window.addEventListener('resize', () => { resize(); });
  }

  // Load icon images from the catalog, then kick off.
  fetch('data/scripts.json')
    .then((r) => r.json())
    .then((scripts) => {
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
    })
    .catch(() => {});
})();
