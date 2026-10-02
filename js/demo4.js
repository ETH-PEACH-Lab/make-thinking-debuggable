/* Demo 4 — VisDeCode: draw a pancake in Processing. Code-based vs visual-based decomposition,
   side by side, stepping in lockstep. 1 beat. Mirrors the paper's Fig. 2. */
(function () {
  const U = DemoUtil;

  // ---- the drawing: a (stack of) pancake(s) with optional butter and syrup
  function drawScene(cv, o) {
    const W = cv.width, H = cv.height, c = cv.getContext('2d');
    c.clearRect(0, 0, W, H); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    const cx = W / 2, rx = W * 0.32, ry = H * 0.11, thick = H * 0.075;
    const n = o.count || 0; const baseY = H * 0.62;
    for (let i = 0; i < n; i++) {
      const y = baseY - i * thick * 1.15;
      if (o.thickness) { c.fillStyle = '#c98a3a'; c.beginPath(); c.ellipse(cx, y + thick * 0.55, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.fillRect(cx - rx, y, rx * 2, thick * 0.55); }
      c.fillStyle = '#f3b664'; c.strokeStyle = '#c98a3a'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    if (n && o.syrup) {
      const y = baseY - (n - 1) * thick * 1.15;
      c.fillStyle = '#8b4a12';
      c.beginPath(); c.ellipse(cx, y - ry * 0.15, rx * 0.72, ry * 0.62, 0, 0, Math.PI * 2); c.fill();
      [[-0.45, 1.2], [0.1, 1.7], [0.5, 1.0]].forEach(([dx, len]) => { c.beginPath(); c.roundRect(cx + dx * rx - 5, y, 10, ry * len, 5); c.fill(); });
    }
    if (n && o.butter) {
      const y = baseY - (n - 1) * thick * 1.15;
      c.fillStyle = '#ffe066'; c.strokeStyle = '#e0b400'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(cx - 14, y - ry - 2, 28, 18, 3); c.fill(); c.stroke();
    }
  }
  const TARGET = { count: 4, thickness: true, butter: true, syrup: true };

  const VIS = [
    ['ellipse(w/2, h/2, 200, 70);', { count: 1 }],
    ['fill(200, 138, 58);\nellipse(w/2, h/2+10, 200, 70);\nrect(w/2-14, h/2-40, 28, 18);', { count: 1, thickness: true, butter: true }],
    ['fill(139, 74, 18);\nellipse(w/2, h/2-6, 144, 44);\nrect(…);  // drips', { count: 1, thickness: true, butter: true, syrup: true }],
    ['for (int i = 0; i < n; i++)\n  pancake(w/2, h/2 - i*24);', TARGET],
  ];
  const CODE = [
    ['int n = 4;\nfloat[] ys = new float[n];', { count: 0 }],
    ['for (int i = 0; i < n; i++)\n  ys[i] = h/2 - i*24;', { count: 0 }],
    ['void pancake(float x, float y) {\n  fill(…); ellipse(…); … // 8 lines\n}', { count: 0 }],
    ['for (int i = 0; i < n; i++)\n  pancake(w/2, ys[i]);', TARGET],
  ];

  function fillCol(col, steps) {
    col.querySelectorAll('.step').forEach(s => s.remove());
    steps.forEach(([code, scene], i) => {
      const st = U.el('div', 'step'); st.dataset.i = i;
      st.innerHTML = `<span class="n">${i + 1}</span><pre>${code.replace(/</g, '&lt;')}</pre><canvas width="420" height="280"></canvas>`;
      col.appendChild(st); drawScene(st.querySelector('canvas'), scene);
    });
  }
  const show = (col, upto) => col.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('on', i < upto));

  Deck.demo('demo4', {
    reset(ctx) {
      const s = ctx.section;
      ctx.left = s.querySelector('.col.code'); ctx.right = s.querySelector('.col.vis');
      drawScene(s.querySelector('.target'), TARGET); drawScene(s.querySelector('.hero .big'), TARGET);
      ctx.wrap = s.querySelector('.d4'); ctx.wrap.classList.remove('split');
      fillCol(ctx.left, CODE); fillCol(ctx.right, VIS);
      ctx.left.querySelectorAll('.step').forEach((st, i) => st.classList.toggle('same', i < 3));
      ctx.left.classList.add('cmp'); ctx.right.classList.add('cmp');
      show(ctx.left, 4); show(ctx.right, 4);
    },
    beats: [
      // 1 — the two decompositions, side by side (the big target is the resting state)
      (ctx) => { ctx.wrap.classList.add('split'); },
    ],
  });
})();
