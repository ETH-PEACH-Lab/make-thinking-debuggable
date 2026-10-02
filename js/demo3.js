/* Demo 3 — SketchMind (web replica): handwritten digits, pen strokes bound to primitive operations,
   plan cards with handwritten thumbnails, a Check that suggests a small change to the input, and a replay of the learner's own plan on 3 2 4 1 — with a visible
   pen so the audience can follow what is being done. 14 beats. */
(function () {
  const U = DemoUtil;
  const NS = 'http://www.w3.org/2000/svg';
  const COL = { data: '#777', fm: '#e8862a', fl: '#8e5bd6', user: '#2b8a3e' };

  // hand-drawn digit paths in a 60×90 box
  const GLYPH = {
    1: 'M 18 22 L 34 8 L 33 84',
    2: 'M 12 26 C 14 6, 48 6, 46 28 C 44 46, 16 58, 12 82 L 52 80',
    3: 'M 14 14 C 30 4, 50 12, 44 30 C 40 42, 30 44, 26 44 C 40 44, 52 54, 46 72 C 38 88, 16 82, 12 72',
    4: 'M 40 8 L 12 58 L 54 58 M 40 8 L 41 84',
  };
  const START = [2, 3, 4, 1], CE = [3, 2, 4, 1];
  const VW = 1000, VH = 795;                                  // canvas viewBox
  const SC = 1.7, X0 = 110, DX = 185, Y0 = 150, Y1 = 440;
  const pos = (i, y = Y0) => ({ x: X0 + i * DX, y });
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* ---------- geometry: slide-space coordinates (1920×1080) ---------- */
  function rectOf(ctx, el) {
    const s = ctx.wrap.getBoundingClientRect(), r = el.getBoundingClientRect(), k = 1920 / ctx.section.getBoundingClientRect().width;
    return { x: (r.left - s.left) * k, y: (r.top - s.top) * k, w: r.width * k, h: r.height * k };
  }
  function canvasPt(ctx, x, y) {                              // svg user units → slide space
    const r = rectOf(ctx, ctx.canvas); const k = Math.min(r.w / VW, r.h / VH);
    return { x: r.x + (r.w - VW * k) / 2 + x * k, y: r.y + (r.h - VH * k) / 2 + y * k };
  }
  const center = (ctx, el) => { const r = rectOf(ctx, el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };

  /* ---------- cursor ---------- */
  function curTo(ctx, p, fast) {
    ctx.cursor.classList.toggle('fast', !!fast);
    ctx.cursor.style.setProperty('--tr', `translate(${p.x}px, ${p.y}px)`);
    ctx.cursor.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }
  const curToEl = (ctx, el, fast) => curTo(ctx, center(ctx, el), fast);
  function click(ctx) { ctx.cursor.classList.remove('click'); void ctx.cursor.offsetWidth; ctx.cursor.classList.add('click'); }
  function curPark(ctx) { curTo(ctx, { x: 1700, y: 980 }); }
  // follow an svg path while it is being drawn
  function curFollow(ctx, path, ms) {
    const len = path.getTotalLength(); const t0 = performance.now();
    ctx.cursor.classList.add('fast');
    const step = (t) => {
      const f = Math.min(1, (t - t0) / ms); const p = path.getPointAtLength(f * len); const q = canvasPt(ctx, p.x, p.y);
      // account for the digit group's own transform (path is inside a translated/scaled group)
      curTo(ctx, q, true);
      if (f < 1) ctx._raf = requestAnimationFrame(step);
    };
    ctx._raf = requestAnimationFrame(step);
  }

  /* ---------- frame-driven stroke drawing (no CSS transitions: same loop moves ink and pen) ---------- */
  // Draw `path` over `ms`. `toSlide(pt)` maps a point on the path to slide coordinates for the pen.
  function drawPath(ctx, path, ms, toSlide, done) {
    const len = path.getTotalLength();
    path.style.transition = 'none';
    path.setAttribute('stroke-dasharray', `${len} ${len}`); path.setAttribute('stroke-dashoffset', len);
    const t0 = performance.now(); ctx.cursor.classList.add('fast');
    const step = (t) => {
      const f = Math.min(1, (t - t0) / ms);
      path.setAttribute('stroke-dashoffset', len * (1 - f));
      const q = path.getPointAtLength(f * len); curTo(ctx, toSlide(q), true);
      if (f < 1) ctx._raf = requestAnimationFrame(step); else done && done();
    };
    ctx._raf = requestAnimationFrame(step);
  }

  /* ---------- digits ---------- */
  // a hand-drawn loop around a digit: a slightly wobbly ellipse that overshoots its start, like a pen circling
  function loopPath(cx, cy, rx, ry, seed) {
    const J = [3, -4, 2, 5, -3, 1, -5, 4, -2, 3, -1, 2, -4, 3, 1, -3, 2, -2, 4, -1, 2, -3];
    const n = 20, pts = [];
    for (let i = 0; i <= n + 2; i++) {                        // +2: overshoot past the start
      const a = -1.9 + (i / n) * Math.PI * 2; const j = J[(i + seed) % J.length];
      pts.push([cx + (rx + j) * Math.cos(a) + (i % 3) - 1, cy + (ry + j * 0.8) * Math.sin(a)]);
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; d += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`; }
    return d;
  }
  function makeDigit(ctx, v, i, y, rot) {
    const g = svgEl('g', { class: 'digit' }); g.dataset.v = v;
    const halo = svgEl('path', { class: 'halo', d: loopPath(30 * SC, 44 * SC, 40 * SC, 58 * SC, v) });
    const p = svgEl('path', { d: GLYPH[v], transform: `scale(${SC}) rotate(${rot} 30 45)` });
    g.appendChild(halo); g.appendChild(p);
    g.style.transform = `translate(${pos(i).x}px, ${y}px)`;
    ctx.svg.appendChild(g);
    const L = halo.getTotalLength(); halo.style.strokeDasharray = L; halo.style.setProperty('--len', L);
    return g;
  }
  function drawDigit(ctx, g, i, y, ms, done) {
    const p = g.querySelector('path:not(.halo)');
    drawPath(ctx, p, ms, q => canvasPt(ctx, pos(i).x + q.x * SC, y + q.y * SC), done);   // rotation ignored (small)
  }
  // system-drawn digit (quick, no pen)
  function sysDraw(g, ms = 500) {
    const p = g.querySelector('path:not(.halo)'); const len = p.getTotalLength(); p.setAttribute('stroke-dasharray', `${len} ${len}`); p.setAttribute('stroke-dashoffset', len);
    const t0 = performance.now(); const tick = (t) => { const f = Math.min(1, (t - t0) / ms); p.setAttribute('stroke-dashoffset', len * (1 - f)); if (f < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  }
  // replace the input row with 3 2 4 1 (system rewrites; old digits fade out)
  function swapInput(ctx, instant) {
    ctx.row.forEach(g => { if (instant) g.remove(); else { g.style.transition = 'opacity .3s'; g.style.opacity = '0'; setTimeout(() => g.remove(), 320); } });
    ctx.row = new Map(); ctx.row.y = Y0;
    CE.forEach((v, i) => { const g = makeDigit(ctx, v, i, Y0, (i % 2 ? -2 : 3)); ctx.row.set(v, g); if (!instant) sysDraw(g, 450); });
  }
  function place(ctx, row, order, instant) {
    order.forEach((v, i) => { const g = row.get(v); g.style.transition = instant ? 'none' : ''; g.style.transform = `translate(${pos(i).x}px, ${row.y}px)`; });
  }
  function setHalo(row, vals, cls = 'hi', color) {
    row.forEach((g, v) => { g.classList.toggle(cls, vals.includes(v)); if (color && vals.includes(v)) g.style.setProperty('--halo', color); });
  }

  /* ---------- ink strokes (cursor follows) ---------- */
  // draw one ink path over `ms`, the pen following; returns the element
  function ink(ctx, d, color, ms, at) {
    const p = svgEl('path', { class: 'ink', d, stroke: color });
    ctx.later(() => { ctx.svg.appendChild(p); drawPath(ctx, p, ms, q => canvasPt(ctx, q.x, q.y)); }, at);
    return p;
  }
  function stroke(ctx, fromI, toI, y, color, kind = 'line') {
    const x1 = pos(fromI).x - 10, x2 = pos(toI).x + 72 * SC; const yy = y + (kind === 'arrow' ? 60 : 78) * SC;
    const parts = [];                                            // [d, ms]
    if (kind === 'arrow') {
      // an arc above the digits, then the left head, then the right head — three separate strokes
      const cx1 = pos(fromI).x + 30 * SC, cx2 = pos(toI).x + 30 * SC, top = y - 26 * SC;
      const mx = (cx1 + cx2) / 2, my = top - 120;
      const J = [0, 3, -4, 2, 5, -3, 1, -5, 4, -2, 0];
      const pts = J.map((j, i) => { const t = i / (J.length - 1), u = 1 - t;
        const x = u * u * cx1 + 2 * u * t * mx + t * t * cx2, yv = u * u * top + 2 * u * t * my + t * t * top;
        return [x + (i % 2 ? 2 : -2), yv + j]; });
      let shaft = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; shaft += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`; }
      shaft += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
      const head = (tipX, tipY, fromX, fromY, k) => {
        const ang = Math.atan2(tipY - fromY, tipX - fromX);
        const a1 = ang + Math.PI - 0.5 - 0.06 * k, a2 = ang + Math.PI + 0.5 + 0.08 * k, h1 = 24 + 2 * k, h2 = 22 - 2 * k;
        return `M ${tipX + h1 * Math.cos(a1)} ${tipY + h1 * Math.sin(a1)} L ${tipX} ${tipY} L ${tipX + h2 * Math.cos(a2)} ${tipY + h2 * Math.sin(a2)}`;
      };
      parts.push([shaft, 1200], [head(cx1, top, mx, my, -1), 360], [head(cx2, top, mx, my, 1), 360]);   // ≈2.4 s in total
    } else {
      parts.push([`M ${x1} ${yy + 6} C ${x1 + 40} ${yy - 14}, ${x1 + 90} ${yy + 22}, ${x1 + 140} ${yy} S ${x2 - 60} ${yy + 12}, ${x2} ${yy - 4}`, 800]);
    }
    let t = 0; const els = [];
    parts.forEach(([d, ms]) => { els.push(ink(ctx, d, color, ms, t)); t += ms + 160; });
    ctx.later(() => els.forEach(p => p.classList.add('fade')), t + 300);
    ctx.later(() => els.forEach(p => p.remove()), t + 800);
  }

  /* ---------- plan cards ---------- */
  function thumbSvg(arr, touched, cc) {
    const paths = arr.map((v, i) => `<path d="${GLYPH[v]}" class="${touched.includes(v) ? 'c' : ''}" transform="translate(${8 + i * 26},4) scale(.36)"/>`).join('');
    return `<svg viewBox="0 0 118 44">${paths}</svg><i class="dot"></i>`;
  }
  function card(ctx, cls, arr, touched, opHtml) {
    const c = U.el('div', `card ${cls}`, `<div class="thumb">${thumbSvg(arr, touched)}</div><div class="op">${opHtml}</div>`);
    ctx.plan.appendChild(c); return c;
  }
  // rewrite an existing card (thumbnail + text)
  function setCard(c, arr, touched, opHtml) { c.classList.remove('blank'); c.querySelector('.thumb').innerHTML = thumbSvg(arr, touched); const op = c.querySelector('.op'); op.innerHTML = opHtml; if (c.classList.contains('data')) op.dataset.val = opHtml; c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
  const CEV = { data: 'a = [3, 2, 4, 1]', fm: 'find_max(<span class="v">[3, 2, 4, 1]</span>) → <span class="v">2</span>', fl3: 'flip(<span class="v">[3, 2, 4, 1]</span>, <span class="v">3</span>)', fl4: 'flip(<span class="v">[4, 2, 3, 1]</span>, <span class="v">4</span>)' };
  const cardAt = (ctx, i) => ctx.plan.querySelectorAll('.card')[i];
  // blank a card (thumbnail empty, text dimmed) until the replay reaches it
  function blankCard(c) { c.querySelector('.thumb').innerHTML = '<svg viewBox="0 0 118 44"></svg><i class="dot"></i>'; c.classList.add('blank'); }
  function clearCards(ctx) { [1, 2, 3].forEach(i => blankCard(cardAt(ctx, i))); }
  function showHint(ctx, on) { ctx.hint.classList.toggle('on', on); }
  function showTry(ctx, on) { ctx.tryBtn.classList.toggle('on', on); }
  // the four cards rewritten for the modified input, all at once (instant) — used by build
  function cardsCE(ctx) { setCard(cardAt(ctx, 0), CE, [], CEV.data); setCard(cardAt(ctx, 1), CE, [4], CEV.fm); setCard(cardAt(ctx, 2), [4, 2, 3, 1], [4, 2, 3], CEV.fl3); setCard(cardAt(ctx, 3), [1, 3, 2, 4], [1, 3, 2, 4], CEV.fl4); }
  const VIEWS = {
    value: { fm: 'find_max(<span class="v">[2, 3, 4, 1]</span>) → <span class="v">2</span>', fl3: 'flip(<span class="v">[2, 3, 4, 1]</span>, <span class="v">3</span>)', fl4: 'flip(<span class="v">[4, 3, 2, 1]</span>, <span class="v">4</span>)' },
  };
  function setView(ctx, view) {
    ctx.view = view;
    ctx.viewsEl.querySelectorAll('span').forEach(s => s.classList.toggle('on', s.dataset.v === view));
    const dc = ctx.plan.querySelector('.card.data .op');
    if (dc) dc.innerHTML = view === 'index' ? 'a[0 .. 3]' : view === 'param' ? 'a' : (dc.dataset.val || dc.innerHTML);
    ctx.plan.querySelectorAll('.card.group').forEach(c => { renderBlock(c, view); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); });
  }
  function selectPen(ctx, id) { ctx.pensEl.querySelectorAll('.pen').forEach(p => p.classList.toggle('on', p.dataset.pen === id)); }
  const penEl = (ctx, id) => ctx.pensEl.querySelector(`.pen[data-pen="${id}"]`);
  function addUserPen(ctx, name = 'one_round', id = 'user', color = COL.user) {
    const pen = U.el('span', 'pen new', `<i></i>${name}`); pen.dataset.pen = id; pen.style.setProperty('--pc', color);
    ctx.userPen.appendChild(pen); return pen;
  }
  const COL_PS = '#1c7ed6';
  // the whole algorithm: outer loop over i, inner one_round expanded (index view and up)
  function sortCard(ctx) {
    const c = U.el('div', 'card group ps', `<div class="thumb">${thumbSvg([1, 2, 3, 4], [1, 2, 3, 4])}</div>
      <div class="blk"><div class="ttl"><span>pancake_sort(a)</span><span class="chev">︿</span></div>
        <div class="ln loop"><span class="kw">for</span> i <span class="kw">in</span> <span class="rng">${V('[3, 2, 1]')}</span>:</div>
        <div class="ln sub1 head">one_round(${V('a[0..i]')})</div>
        <div class="ln sub2">m = find_max(${V('a[0..i]')})</div>
        <div class="ln sub2">flip(${V('a[0..m]')})</div>
        <div class="ln sub2">flip(${V('a[0..i]')})</div></div>`);
    ctx.plan.appendChild(c); return c;
  }
  function mergeSort(ctx) { Array.from(ctx.plan.querySelectorAll('.card')).slice(1).forEach(c => c.remove()); return sortCard(ctx); }
  // apply one_round to the first k digits of `arr` (values): returns {m, a1, a2}
  function oneRound(arr, k) {
    const head = arr.slice(0, k); const m = head.indexOf(Math.max(...head));
    const a1 = head.slice(0, m + 1).reverse().concat(head.slice(m + 1)).concat(arr.slice(k));
    const a2 = a1.slice(0, k).reverse().concat(arr.slice(k));
    return { m, a1, a2 };
  }
  const fmt = (a) => `[${a.join(', ')}]`;
  const V = (x) => `<span class="v">${x}</span>`;
  // the three abstraction levels of one application of one_round on the first k of `arr`
  function blockHtml(arr, k, view) {
    const { m, a1 } = oneRound(arr, k); const h = fmt(arr.slice(0, k)), h1 = fmt(a1.slice(0, k)), r = `a[0..${k - 1}]`;
    if (view === 'index') return { ttl: `one_round(a[0..i], i = ${V(k - 1)})`, ln: [`m = find_max(${V('a[0..i]')}) → ${V(m)}`, `flip(${V('a[0..m]')})`, `flip(${V('a[0..i]')})`] };
    if (view === 'param') return { ttl: `one_round(a, n = ${V(k)})`, ln: [`m = find_max(${V('a[0..n-1]')})`, `flip(${V('a[0..m]')})`, `flip(${V('a[0..n-1]')})`] };
    return { ttl: `one_round(${h})`, ln: [`find_max(${V(h)}) → ${V(m)}`, `flip(${V(h)}, ${V(m + 1)})`, `flip(${V(h1)}, ${V(k)})`] };
  }
  function renderBlock(c, view) {
    if (c.classList.contains('ps')) { c.querySelector('.rng').innerHTML = view === 'param' ? V('n-1 .. 1') : V('[3, 2, 1]'); return; }
    const { ttl, ln } = blockHtml(JSON.parse(c.dataset.arr), +c.dataset.k, view);
    c.querySelector('.ttl span').innerHTML = ttl; c.querySelectorAll('.ln').forEach((el, i) => { el.innerHTML = ln[i]; });
  }
  // a green block for one application of one_round on the first k digits
  function roundCard(ctx, arr, k, touched) {
    const { a2 } = oneRound(arr, k);
    const c = U.el('div', 'card group', `<div class="thumb">${thumbSvg(a2, touched || a2.slice(0, k))}</div>
      <div class="blk"><div class="ttl"><span></span><span class="chev">︿</span></div><div class="ln"></div><div class="ln"></div><div class="ln"></div></div>`);
    c.dataset.arr = JSON.stringify(arr); c.dataset.k = k; renderBlock(c, ctx.view || 'value');
    ctx.plan.appendChild(c); return c;
  }
  // merge: the three concrete cards fold into one block (the first round on 3 2 4 1)
  function mergeCE(ctx) { Array.from(ctx.plan.querySelectorAll('.card')).slice(1).forEach(c => c.remove()); return roundCard(ctx, CE, 4, []); }
  function showMerge(ctx, on) { ctx.mergeBtn.classList.toggle('on', on); }
  // hand-drawn loop around the first k digits of the row, drawn with the user pen
  function loopDigits(ctx, k, at, ms = 1400) {
    const cx = (pos(0).x + pos(k - 1).x) / 2 + 30 * SC, cy = Y0 + 44 * SC;
    const rx = (pos(k - 1).x - pos(0).x) / 2 + 30 * SC + 42, ry = 58 * SC + 12;
    return ink(ctx, loopPath(cx, cy, rx, ry, k), COL.user, ms, at);
  }
  // beat helper: loop the first k, then the system performs the two flips; card appears
  function playRound(ctx, arr, k, t0) {
    const { a1, a2 } = oneRound(arr, k);
    ctx.later(() => curTo(ctx, canvasPt(ctx, pos(0).x - 20, Y0 + 44 * SC)), t0);
    const p = loopDigits(ctx, k, t0 + 500);
    ctx.later(() => place(ctx, ctx.row, a1, false), t0 + 500 + 1400 + 700);
    ctx.later(() => place(ctx, ctx.row, a2, false), t0 + 500 + 1400 + 1700);
    ctx.later(() => { p.classList.add('fade'); roundCard(ctx, arr, k); curPark(ctx); }, t0 + 500 + 1400 + 2500);
    ctx.later(() => p.remove(), t0 + 500 + 1400 + 3100);
  }
  function showMerge(ctx, on) { ctx.mergeBtn.classList.toggle('on', on); }
  /* ---------- full-state renderer (instant) ---------- */
  function build(ctx, n) {
    ctx.svg.innerHTML = ''; ctx.plan.querySelectorAll('.card').forEach(c => c.remove());
    ctx.userPen.innerHTML = ''; ctx.row = new Map(); ctx.row.y = Y0; ctx.row2 = null;
    ctx.doneBtn.classList.remove('pulse'); selectPen(ctx, null); curPark(ctx);
    showHint(ctx, false); showTry(ctx, false); showMerge(ctx, false); ctx.win.classList.toggle('more', n >= 8);
    if (n >= 1) { START.forEach((v, i) => ctx.row.set(v, makeDigit(ctx, v, i, Y0, (i % 2 ? 3 : -3)))); card(ctx, 'data', START, [], 'a = [2, 3, 4, 1]'); selectPen(ctx, 'data'); }
    if (n >= 2) { setHalo(ctx.row, [4], 'max', COL.fm); card(ctx, 'fm', START, [4], VIEWS.value.fm); selectPen(ctx, 'fm'); }
    if (n >= 3) { place(ctx, ctx.row, [4, 3, 2, 1], true); card(ctx, 'fl', [4, 3, 2, 1], [4, 3, 2], VIEWS.value.fl3); selectPen(ctx, 'fl'); }
    if (n >= 4) { place(ctx, ctx.row, [1, 2, 3, 4], true); setHalo(ctx.row, [], 'max'); card(ctx, 'fl', [1, 2, 3, 4], [1, 2, 3, 4], VIEWS.value.fl4); }
    if (n >= 5 && n < 8) showHint(ctx, true);
    if (n >= 6) { showTry(ctx, true); swapInput(ctx, true); setCard(cardAt(ctx, 0), CE, [], CEV.data); clearCards(ctx); }
    if (n >= 7) { place(ctx, ctx.row, [1, 3, 2, 4], true); cardsCE(ctx); }
    if (n >= 8) { mergeCE(ctx); addUserPen(ctx); selectPen(ctx, 'user'); }
    if (n >= 9) { place(ctx, ctx.row, [2, 1, 3, 4], true); roundCard(ctx, [1, 3, 2, 4], 3); }
    if (n >= 10) { place(ctx, ctx.row, [1, 2, 3, 4], true); roundCard(ctx, [2, 1, 3, 4], 2); }
    ctx.win.classList.toggle('views-on', n >= 11);
    if (n >= 13) { mergeSort(ctx); addUserPen(ctx, 'pancake_sort', 'ps', COL_PS); selectPen(ctx, 'ps'); }
    setView(ctx, n >= 14 ? 'param' : n >= 12 ? 'index' : 'value');
  }

  Deck.demo('demo3', {
    reset(ctx) {
      const s = ctx.section;
      ctx.svg = s.querySelector('svg.sheet'); ctx.canvas = s.querySelector('.canvas');
      ctx.plan = s.querySelector('.plan'); ctx.pensEl = s.querySelector('.pens'); ctx.userPen = s.querySelector('.userpen');
      ctx.viewsEl = s.querySelector('.views'); ctx.doneBtn = s.querySelector('.done'); ctx.cursor = s.querySelector('.cursor'); ctx.wrap = s.querySelector('.d3');
      ctx.win = s.querySelector('.window'); ctx.hint = s.querySelector('.hint'); ctx.tryBtn = s.querySelector('.try'); ctx.mergeBtn = s.querySelector('.merge');
      if (ctx._raf) cancelAnimationFrame(ctx._raf);
      // the toggle is live: click value / index / param while presenting (only once it is shown, from beat 11)
      if (!ctx.viewsEl.dataset.live) { ctx.viewsEl.dataset.live = '1'; ctx.viewsEl.addEventListener('click', (e) => { const t = e.target.closest('[data-v]'); if (t && ctx.win.classList.contains('views-on')) setView(ctx, t.dataset.v); }); }
      build(ctx, 0);
    },
    beats: [
      // 1 — Data pen: write 2 3 4 1
      (ctx, instant) => {
        if (instant) return build(ctx, 1);
        curToEl(ctx, penEl(ctx, 'data'));
        ctx.later(() => { click(ctx); selectPen(ctx, 'data'); }, 600);
        ctx.later(() => curTo(ctx, canvasPt(ctx, pos(0).x + 20, Y0 + 40)), 800);
        START.forEach((v, i) => ctx.later(() => { const g = makeDigit(ctx, v, i, Y0, (i % 2 ? 3 : -3)); ctx.row.set(v, g); drawDigit(ctx, g, i, Y0, 900); }, 1400 + i * 1150));
        ctx.later(() => { card(ctx, 'data', START, [], 'a = [2, 3, 4, 1]'); }, 1400 + 4 * 1150 + 100);
      },
      // 2 — find_max pen: stroke across all four; the 4 lights up
      (ctx, instant) => {
        if (instant) return build(ctx, 2);
        curToEl(ctx, penEl(ctx, 'fm'));
        ctx.later(() => { click(ctx); selectPen(ctx, 'fm'); }, 600);
        ctx.later(() => curTo(ctx, canvasPt(ctx, pos(0).x - 10, Y0 + 60 * SC)), 800);
        ctx.later(() => stroke(ctx, 0, 3, Y0, COL.fm), 1400);
        ctx.later(() => { setHalo(ctx.row, [4], 'max', COL.fm); card(ctx, 'fm', START, [4], VIEWS.value.fm); }, 2500);
      },
      // 3 — flip pen across the first three → 4 3 2 1
      (ctx, instant) => {
        if (instant) return build(ctx, 3);
        curToEl(ctx, penEl(ctx, 'fl'));
        ctx.later(() => { click(ctx); selectPen(ctx, 'fl'); }, 600);
        ctx.later(() => curTo(ctx, canvasPt(ctx, pos(0).x - 10, Y0 + 60 * SC)), 800);
        ctx.later(() => stroke(ctx, 0, 2, Y0, COL.fl, 'arrow'), 1400);
        ctx.later(() => place(ctx, ctx.row, [4, 3, 2, 1], false), 4700);   // arrow done ≈3.7 s, pause, then swap
        ctx.later(() => card(ctx, 'fl', [4, 3, 2, 1], [4, 3, 2], VIEWS.value.fl3), 5300);
      },
      // 4 — flip pen across all four → 1 2 3 4
      (ctx, instant) => {
        if (instant) return build(ctx, 4);
        ctx.later(() => curTo(ctx, canvasPt(ctx, pos(0).x - 10, Y0 + 60 * SC)), 100);
        ctx.later(() => stroke(ctx, 0, 3, Y0, COL.fl, 'arrow'), 700);
        ctx.later(() => { setHalo(ctx.row, [], 'max'); place(ctx, ctx.row, [1, 2, 3, 4], false); }, 4000);   // arrow done ≈3.0 s
        ctx.later(() => card(ctx, 'fl', [1, 2, 3, 4], [1, 2, 3, 4], VIEWS.value.fl4), 4600);
      },
      // 5 — Check → the hint: "Hmmm, what if we make a small change to the input."
      (ctx, instant) => {
        if (instant) return build(ctx, 5);
        ctx.later(() => curToEl(ctx, ctx.doneBtn), 100);
        ctx.later(() => { click(ctx); ctx.doneBtn.classList.add('pulse'); }, 700);
        ctx.later(() => ctx.doneBtn.classList.remove('pulse'), 950);
        ctx.later(() => showHint(ctx, true), 1500);
        ctx.later(() => showTry(ctx, true), 2300);
      },
      // 6 — click "Try [3, 2, 4, 1]": the input is rewritten (system), the first card changes
      (ctx, instant) => {
        if (instant) return build(ctx, 6);
        ctx.later(() => curToEl(ctx, ctx.tryBtn), 100);
        ctx.later(() => { click(ctx); ctx.tryBtn.classList.add('pulse'); }, 700);
        ctx.later(() => ctx.tryBtn.classList.remove('pulse'), 950);
        ctx.later(() => { swapInput(ctx, false); setCard(cardAt(ctx, 0), CE, [], CEV.data); clearCards(ctx); curPark(ctx); }, 1100);
      },
      // 7 — replay the learner's plan on the new input: find_max → flip 3 → flip 4 … not sorted
      (ctx, instant) => {
        if (instant) return build(ctx, 7);
        ctx.later(() => { setHalo(ctx.row, [4], 'max', COL.fm); setCard(cardAt(ctx, 1), CE, [4], CEV.fm); }, 600);
        ctx.later(() => { place(ctx, ctx.row, [4, 2, 3, 1], false); setCard(cardAt(ctx, 2), [4, 2, 3, 1], [4, 2, 3], CEV.fl3); }, 2200);
        ctx.later(() => { setHalo(ctx.row, [], 'max'); place(ctx, ctx.row, [1, 3, 2, 4], false); setCard(cardAt(ctx, 3), [1, 3, 2, 4], [1, 3, 2, 4], CEV.fl4); }, 3800);
      },
      // 8 — the learner sees the repetition: select find_max / flip / flip → Merge → one reusable step
      (ctx, instant) => {
        if (instant) return build(ctx, 8);
        showHint(ctx, false);
        const cards = Array.from(ctx.plan.querySelectorAll('.card')).slice(1);
        cards.forEach((c, i) => {
          ctx.later(() => curToEl(ctx, c.querySelector('.op')), 300 + i * 700);
          ctx.later(() => { click(ctx); c.classList.add('sel'); }, 800 + i * 700);
        });
        ctx.later(() => showMerge(ctx, true), 2700);
        ctx.later(() => curToEl(ctx, ctx.mergeBtn), 3300);
        ctx.later(() => { click(ctx); ctx.mergeBtn.classList.add('pulse'); }, 3900);
        ctx.later(() => { ctx.mergeBtn.classList.remove('pulse'); showMerge(ctx, false); mergeCE(ctx); ctx.win.classList.add('more'); const pen = addUserPen(ctx); selectPen(ctx, 'user'); curToEl(ctx, pen); }, 4200);
      },
      // 9 — one_round pen: loop the first three (1 3 2) → the system does the two flips → 2 1 3 4
      (ctx, instant) => {
        if (instant) return build(ctx, 9);
        ctx.later(() => curToEl(ctx, penEl(ctx, 'user')), 100);
        ctx.later(() => { click(ctx); selectPen(ctx, 'user'); }, 700);
        playRound(ctx, [1, 3, 2, 4], 3, 1000);
      },
      // 10 — loop the first two (2 1) → 1 2 3 4. Sorted.
      (ctx, instant) => {
        if (instant) return build(ctx, 10);
        playRound(ctx, [2, 1, 3, 4], 2, 200);
      },
      // 11 — the value / index / param toggle appears
      (ctx, instant) => {
        if (instant) return build(ctx, 11);
        ctx.later(() => ctx.win.classList.add('views-on'), 300);
      },
      // 12 — index view: every block is now about positions, not these digits
      (ctx, instant) => {
        if (instant) return build(ctx, 12);
        ctx.later(() => curToEl(ctx, ctx.viewsEl.querySelector('[data-v="index"]')), 200);
        ctx.later(() => { click(ctx); setView(ctx, 'index'); }, 800);
      },
      // 13 — the three rounds differ only in i: select them → Merge → pancake_sort, a loop; a second user pen
      (ctx, instant) => {
        if (instant) return build(ctx, 13);
        const cards = Array.from(ctx.plan.querySelectorAll('.card.group'));
        cards.forEach((c, i) => {
          ctx.later(() => curToEl(ctx, c.querySelector('.ttl')), 300 + i * 700);
          ctx.later(() => { click(ctx); c.classList.add('sel'); }, 800 + i * 700);
        });
        ctx.later(() => showMerge(ctx, true), 2700);
        ctx.later(() => curToEl(ctx, ctx.mergeBtn), 3300);
        ctx.later(() => { click(ctx); ctx.mergeBtn.classList.add('pulse'); }, 3900);
        ctx.later(() => { ctx.mergeBtn.classList.remove('pulse'); showMerge(ctx, false); mergeSort(ctx); const pen = addUserPen(ctx, 'pancake_sort', 'ps', COL_PS); selectPen(ctx, 'ps'); curToEl(ctx, pen); }, 4200);
      },
      // 14 — param view: the loop no longer mentions these digits at all
      (ctx, instant) => {
        if (instant) return build(ctx, 14);
        ctx.later(() => curToEl(ctx, ctx.viewsEl.querySelector('[data-v="param"]')), 200);
        ctx.later(() => { click(ctx); setView(ctx, 'param'); }, 800);
      },
    ],
  });
})();
