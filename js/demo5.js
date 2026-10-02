/* Demo 5 — Scratch: the puppy catches pancakes. A scripted, deterministic canvas game. 7 beats.
   Every animated state is a pure function of time, so instant mode just draws the final frame. */
(function () {
  const U = DemoUtil;
  const W = 720, H = 540, GROUND = 470, SPEED = 200, FALL = 160, CATCH_Y = 330, R = 70;
  const DESC1 = 'Design a game: the puppy moves left and right to catch falling pancakes.';
  const PLAN = ['when ← pressed, move puppy left', 'when → pressed, move puppy right', 'pancakes fall from the top', 'when puppy touches a pancake, catch it'];
  const PLAN5 = 'if puppy reaches the edge, keep it there';

  /* ---------- scripts ---------- */
  // keys: [t0, t1, dir]; drops: [t0, x]; x0: start x; clamp: keep inside the stage; head0: pancakes already on the head
  const SCRIPT_A = { dur: 7.6, x0: 360, head0: 0, clamp: false,
    keys: [[0.5, 1.3, 1], [2.85, 4.45, -1], [5.2, 6.35, 1]], drops: [[0.3, 520], [2.2, 200], [4.2, 430]] };
  const SCRIPT_B = { dur: 6.5, x0: 430, head0: 3, clamp: false,
    keys: [[0.3, 4.2, -1]], drops: [[0.5, 300], [2.0, 480], [3.4, 200]] };
  const SCRIPT_C = { dur: 7.2, x0: 360, head0: 0, clamp: true,
    keys: [[0.3, 4.4, -1]], drops: [[1.6, 60], [3.6, 90]] };

  function puppyX(s, t) {
    let x = s.x0, prev = 0;
    for (const [t0, t1, dir] of s.keys) {
      if (t <= t0) break;
      const dt = Math.min(t, t1) - t0; x += dir * SPEED * dt;
      if (s.clamp) x = Math.max(R + 6, Math.min(W - R - 6, x));
      prev = t1;
    }
    if (!s.clamp) return x;
    return Math.max(R + 6, Math.min(W - R - 6, x));
  }
  function keyDown(s, t) { for (const [t0, t1, dir] of s.keys) if (t >= t0 && t <= t1) return dir; return 0; }
  function simulate(s, t) {
    const px = puppyX(s, t); let head = s.head0; const air = [], ground = [];
    for (const [t0, x] of s.drops) {
      if (t < t0) continue;
      const tc = t0 + (CATCH_Y + 30) / FALL;                     // moment it passes the puppy's head height
      const caught = Math.abs(puppyX(s, tc) - x) < 70;   // ≈ half the sprite width
      if (caught) { if (t >= tc) head++; else air.push({ x, y: -30 + (t - t0) * FALL }); }
      else {
        const tl = t0 + (GROUND - 10 + 30) / FALL;
        if (t >= tl) ground.push({ x }); else air.push({ x, y: -30 + (t - t0) * FALL });
      }
    }
    return { px, head, air, ground, key: keyDown(s, t) };
  }

  /* ---------- drawing ---------- */
  function pancake(c, x, y, rx = 34, ry = 12) {
    c.fillStyle = '#c98a3a'; c.beginPath(); c.ellipse(x, y + 7, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3b664'; c.strokeStyle = '#c98a3a'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  // the puppy is a sprite (assets/puppy.png); caught pancakes stack on its head
  const IMG = new Image(); IMG.src = 'assets/puppy.png'; let imgReady = false; let last = null;
  IMG.onload = () => { imgReady = true; if (last) draw(last.cv, last.st); };
  const PW = 150, PH = 160;                         // drawn size
  function puppy(c, x, head, dir) {
    const y = GROUND + 4;
    if (imgReady) c.drawImage(IMG, x - PW / 2, y - PH, PW, PH);
    else { c.fillStyle = '#e8b57a'; c.beginPath(); c.arc(x, y - 80, 50, 0, Math.PI * 2); c.fill(); }
    const hx = x - 4, top = y - PH + 6;               // head top
    for (let i = 0; i < head; i++) pancake(c, hx, top - 6 - i * 12, 34, 11);
  }
  function draw(cv, st) {
    last = { cv, st };
    const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    c.fillStyle = '#cfeeff'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#9ad46e'; c.fillRect(0, GROUND, W, H - GROUND);
    c.fillStyle = '#7fc25a'; c.fillRect(0, GROUND, W, 6);
    st.ground.forEach(p => { c.fillStyle = '#e0a45f'; c.beginPath(); c.ellipse(p.x, GROUND + 6, 40, 8, 0, 0, Math.PI * 2); c.fill(); });
    st.air.forEach(p => pancake(c, p.x, p.y));
    puppy(c, st.px, st.head, st.key || 1);
  }
  function play(ctx, s, done) {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(s.dur, (now - t0) / 1000);
      const st = simulate(s, t); draw(ctx.cv, st); setKeys(ctx, st.key);
      if (t < s.dur) ctx._raf = requestAnimationFrame(step); else done && done();
    };
    ctx._raf = requestAnimationFrame(step);
  }
  function setKeys(ctx, dir) { ctx.keyL.classList.toggle('down', dir < 0); ctx.keyR.classList.toggle('down', dir > 0); }
  const finalState = (s) => simulate(s, s.dur);

  /* ---------- panel ---------- */
  function planLines(ctx, n, extra) {
    ctx.list.innerHTML = '';
    PLAN.concat(extra ? [PLAN5] : []).forEach((t, i) => {
      const ln = U.el('div', 'ln' + (extra && i === 4 ? ' new' : ''), `<span class="k">${i + 1}</span><span>${t}</span><span class="tick">✓</span>`);
      if (i < n) ln.classList.add('on'); ctx.list.appendChild(ln);
    });
    return Array.from(ctx.list.children);
  }
  function setMode(ctx, mode) {
    ctx.toggle.querySelectorAll('span').forEach(s => s.classList.toggle('on', s.dataset.m === mode));
    ctx.codeview.classList.toggle('on', mode === 'code');
    ctx.list.style.display = mode === 'code' ? 'none' : '';
  }
  const BLOCKS = [
    ['hat', 'when <span class="key">←</span> key pressed'],
    ['motion', 'change x by <span class="in">-10</span>'],
    ['control', 'if <span class="bool">x &lt; -220</span> then<div class="inner blk motion on">set x to <span class="in">-220</span></div>'],
  ];
  function codeBlocks(ctx, n) {
    ctx.blocks.innerHTML = '';
    BLOCKS.forEach(([cls, html], i) => { const b = U.el('div', `blk ${cls}` + (i < n ? ' on' : ''), html); ctx.blocks.appendChild(b); });
    ctx.mini.innerHTML = '';
    PLAN.concat([PLAN5]).forEach((t, i) => { const ln = U.el('div', 'ln on' + ((i === 0 && n >= 2) || (i === 4 && n >= 3) ? ' done' : ''), `<span>${t}</span><span class="tick">✓</span>`); ctx.mini.appendChild(ln); });
    return Array.from(ctx.blocks.children);
  }

  Deck.demo('demo5', {
    reset(ctx) {
      const s = ctx.section;
      ctx.q = s.querySelector('.task .q'); ctx.q.textContent = DESC1;   // the task is there from the start
      
      ctx.grid = s.querySelector('.grid'); ctx.grid.classList.add('on');   // the puppy stage is visible from the start
      ctx.list = s.querySelector('.planlist'); ctx.toggle = s.querySelector('.toggle');
      ctx.codeview = s.querySelector('.codeview'); ctx.blocks = s.querySelector('.blocks'); ctx.mini = s.querySelector('.mini');
      ctx.cv = s.querySelector('canvas'); ctx.check = s.querySelector('.bar .check'); ctx.check.classList.remove('pulse'); ctx.hint = s.querySelector('.stagebox .hint'); ctx.hint.classList.remove('on'); ctx.keys = s.querySelector('.keys'); ctx.keyL = s.querySelector('.keys .l'); ctx.keyR = s.querySelector('.keys .r');
      if (ctx._raf) cancelAnimationFrame(ctx._raf);
      ctx.keys.classList.remove('on'); setKeys(ctx, 0); setMode(ctx, 'plan'); planLines(ctx, 0);
      draw(ctx.cv, { px: 360, head: 0, air: [{ x: 520, y: 120 }], ground: [], key: 0 });
    },
    beats: [
      // 1 — AI fills in the plan on the left
      (ctx, instant) => {
        ctx.grid.classList.add('on');
        draw(ctx.cv, { px: 360, head: 0, air: [{ x: 520, y: 120 }], ground: [], key: 0 });
        if (instant) { planLines(ctx, 4); return; }
        const lines = planLines(ctx, 0);
        lines.forEach((ln, i) => ctx.later(() => ln.classList.add('on'), 400 + i * 350));
      },
      // 2 — keycaps; the puppy runs and catches three
      (ctx, instant) => {
        ctx.grid.classList.add('on'); planLines(ctx, 4); ctx.keys.classList.add('on');
        if (instant) { draw(ctx.cv, finalState(SCRIPT_A)); setKeys(ctx, 0); return; }
        ctx.later(() => play(ctx, SCRIPT_A), 300);
      },
      // 3 — Check → hint → ← held: the puppy walks off the screen
      (ctx, instant) => {
        ctx.grid.classList.add('on'); planLines(ctx, 4); ctx.keys.classList.add('on');
        if (instant) { draw(ctx.cv, finalState(SCRIPT_B)); setKeys(ctx, 0); ctx.hint.classList.add('on'); return; }
        draw(ctx.cv, finalState(SCRIPT_A));
        ctx.later(() => ctx.check.classList.add('pulse'), 300);
        ctx.later(() => ctx.check.classList.remove('pulse'), 550);
        ctx.later(() => ctx.hint.classList.add('on'), 1000);
        ctx.later(() => play(ctx, SCRIPT_B), 2200);
      },
      // 4 — the child adds one plan line; the puppy stops at the edge and keeps catching
      (ctx, instant) => {
        ctx.grid.classList.add('on'); ctx.keys.classList.add('on'); ctx.hint.classList.remove('on');
        if (instant) { planLines(ctx, 5, true); draw(ctx.cv, finalState(SCRIPT_C)); setKeys(ctx, 0); return; }
        const lines = planLines(ctx, 4, true);
        ctx.later(() => lines[4].classList.add('on'), 300);
        ctx.later(() => draw(ctx.cv, { px: 360, head: 0, air: [], ground: [], key: 0 }), 600);
        ctx.later(() => play(ctx, SCRIPT_C), 1200);
      },
      // 5 — Code mode: blocks assemble; plan lines tick off
      (ctx, instant) => {
        ctx.grid.classList.add('on'); ctx.keys.classList.add('on');
        planLines(ctx, 5, true); draw(ctx.cv, finalState(SCRIPT_C)); setKeys(ctx, 0); ctx.hint.classList.remove('on');
        if (instant) { setMode(ctx, 'code'); codeBlocks(ctx, 3); return; }
        ctx.later(() => { setMode(ctx, 'code'); codeBlocks(ctx, 0); }, 300);
        [1, 2, 3].forEach(k => ctx.later(() => codeBlocks(ctx, k), 900 + (k - 1) * 900));
      },
    ],
  });
})();
