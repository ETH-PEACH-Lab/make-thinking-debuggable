/* Demo 1 — DBox: make the plan visible. 7 beats.
   The solution is one fixed-height box. Steps are horizontal slices of it. Splitting a step
   cuts its slice; decomposing a step grows its slice, then cuts the inside.
   The DOM is persistent (nodes keyed by id) so flex-grow transitions do the reflow. */
(function () {
  const U = DemoUtil;
  const HEAD = 0.55;                 // weight of a parent's header strip, in leaf units

  const N = (id, t, st = '', extra = {}) => Object.assign({ id, t, st, kids: [] }, extra);
  const KIDS = ['set <code>largest</code> to the first element', 'check each remaining element', 'if it is greater than <code>largest</code>, update <code>largest</code>'];

  const S1 = () => [N('a', 'find the largest pancake'), N('b', 'flip it to the bottom')];
  const S2 = () => [N('a', 'find the largest pancake', 'ok', { split: true }), N('b', 'flip it to the bottom', 'bad')];
  const S3 = () => [N('a', 'find the largest pancake', 'ok', { split: true }), N('b', 'flip it to the top', 'ok'), N('b2', 'flip it to the bottom', 'ok')];
  const S4 = () => { const s = S3(); s[0].split = true; s[0].kids = KIDS.map((k, i) => N('a' + (i + 1), k, 'ok')); return s; };
  const S4c = () => { const s = S4(); s[0].collapsed = true; return s; };   // step 1 folded up
  const S5 = () => { const s = S4c(); s[1].t = 'flip the biggest one'; s[1].st = ''; return s; };
  const S6 = () => { const s = S5(); s[1].st = 'q'; return s; };

  const weight = n => (n.kids.length && !n.collapsed) ? HEAD + n.kids.reduce((a, k) => a + weight(k), 0) : (n.w || 1);

  /* reconcile the DOM under `parentEl` with `nodes` */
  function reconcile(ctx, parentEl, nodes, prefix, opts = {}) {
    const existing = new Map(Array.from(parentEl.children).filter(e => e.classList.contains('node')).map(e => [e.dataset.id, e]));
    let prev = null;
    nodes.forEach((n, i) => {
      let el = existing.get(n.id);
      const fresh = !el;
      if (fresh) {
        el = U.el('div', 'node'); el.dataset.id = n.id;
        el.innerHTML = '<div class="row"><span class="badge"></span><span class="num"></span><span class="txt"></span><span class="chip"></span></div><div class="kids"></div>';
        if (!opts.instant) el.classList.add('new');
      }
      // order
      if (prev ? prev.nextSibling !== el : parentEl.firstChild !== el) parentEl.insertBefore(el, prev ? prev.nextSibling : parentEl.firstChild);
      prev = el;
      existing.delete(n.id);
      // content
      const num = `${prefix}${i + 1}`;
      el.querySelector(':scope > .row > .num').textContent = num;
      const txt = el.querySelector(':scope > .row > .txt');
      if (!opts.keepText || !opts.keepText.has(n.id)) txt.innerHTML = n.t;
      el.querySelector(':scope > .row > .badge').textContent = n.st === 'ok' ? '✓' : n.st === 'bad' ? '✕' : n.st === 'q' ? '?' : '';
      el.classList.remove('ok', 'bad', 'q', 'split');
      if (n.st) el.classList.add(n.st);
      if (n.split) el.classList.add('split');
      el.classList.toggle('parent', (n.kids.length > 0 && !n.collapsed) || !!n.w);
      el.classList.toggle('collapsed', !!n.collapsed);
      el.querySelector(':scope > .row > .chip').textContent = n.collapsed ? `▸ ${n.kids.length} sub-steps` : '';
      el.style.flexGrow = weight(n);
      reconcile(ctx, el.querySelector(':scope > .kids'), n.kids, num + '.', opts);
      if (fresh && !opts.instant) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('new')));
      if (fresh && opts.instant) el.classList.remove('new');
    });
    existing.forEach(el => el.remove());
  }
  function render(ctx, tree, instant, opts = {}) {
    if (instant) { ctx.list.classList.add('notrans'); }
    reconcile(ctx, ctx.list, tree, '', Object.assign({ instant }, opts));
    if (instant) { void ctx.list.offsetHeight; ctx.list.classList.remove('notrans'); }
  }
  const nodeEl = (ctx, id) => ctx.list.querySelector(`.node[data-id="${id}"]`);
  function typeInto(ctx, id, text, ms, done) {
    const txt = nodeEl(ctx, id).querySelector(':scope > .row > .txt');
    txt.classList.add('cursor');
    const plain = text.replace(/<[^>]+>/g, '');
    U.type(txt, plain, ms, false, () => { txt.classList.remove('cursor'); txt.innerHTML = text; done && done(); });
  }
  function cut(ctx, el, fractions, at) {
    // laser lines sweep across `el` at the given height fractions (staggered), then fade
    fractions.forEach((f, i) => {
      const c = U.el('div', 'cut'); c.style.top = `calc(${f * 100}% - 2px)`; el.appendChild(c);
      ctx.later(() => c.classList.add('on'), at + i * 140);
      ctx.later(() => c.classList.add('off'), at + 520 + i * 140);
      ctx.later(() => c.remove(), at + 900 + i * 140);
    });
  }
  function shatter(ctx, ids, at) {
    // the freshly cut pieces fade in as they take their place
    ctx.later(() => ids.forEach((id) => {
      const el = nodeEl(ctx, id); if (!el) return;
      el.classList.add('piece');
      ctx.later(() => el.classList.remove('piece'), 600);
    }), at);
  }
  function check(ctx, at, then) {
    ctx.later(() => ctx.btn.classList.add('pulse'), at);
    ctx.later(() => ctx.btn.classList.remove('pulse'), at + 220);
    ctx.later(then, at + 700);
  }

  Deck.demo('demo1', {
    reset(ctx) {
      const s = ctx.section;
      ctx.list = s.querySelector('.nodes'); ctx.list.innerHTML = '';
      ctx.btn = s.querySelector('.btn.check'); ctx.btn.classList.remove('pulse');
      ctx.stackbox = s.querySelector('.stackbox'); ctx.stackbox.innerHTML = '';
      ctx.st = new PancakeStack(ctx.stackbox, { values: [2, 3, 4, 1], width: 460, height: 380, thick: 44, gap: 14, maxVal: 4, showIndex: true });
    },
    beats: [
      // 1 — the box is cut into three; three steps typed in
      (ctx, instant) => {
        if (instant) return render(ctx, S1(), true);
        const blank = S1().map(n => N(n.id, ''));
        render(ctx, blank, false);
        let t = 500;
        S1().forEach(n => { ctx.later(() => typeInto(ctx, n.id, n.t, 900), t); t += 1150; });
      },
      // 2 — Check: a ok(split), b bad, c ok(split)
      (ctx, instant) => { if (instant) return render(ctx, S2(), true); check(ctx, 200, () => render(ctx, S2(), false)); },
      // 3 — cut b in two; retype both; Check → all ok
      (ctx, instant) => {
        if (instant) return render(ctx, S3(), true);
        ctx.later(() => {
          const s = S2(); s[1].st = ''; s[1].t = ''; s.splice(2, 0, N('b2', '')); render(ctx, s, false);
        }, 100);
        ctx.later(() => typeInto(ctx, 'b', 'flip it to the top', 800), 800);
        ctx.later(() => typeInto(ctx, 'b2', 'flip it to the bottom', 800), 1800);
        check(ctx, 3000, () => render(ctx, S3(), false));
      },
      // 4 — grow a, cut its inside into three, type the sub-steps; Check
      (ctx, instant) => {
        if (instant) return render(ctx, S4(), true);
        const grown = S3(); grown[0].w = HEAD + 3; grown[0].split = true; render(ctx, grown, false);   // others shrink
        ctx.later(() => { const s = S3(); s[0].split = true; s[0].kids = KIDS.map((k, i) => N('a' + (i + 1), '')); render(ctx, s, false); }, 700);
        let t = 1400;
        KIDS.forEach((k, i) => { ctx.later(() => typeInto(ctx, 'a' + (i + 1), k, 900), t); t += 1150; });
        check(ctx, t + 200, () => render(ctx, S4(), false));
      },
      // 5 — fold step 1 back up
      (ctx, instant) => { render(ctx, S4c(), instant); },
      // 6 — edit "flip it to the top" → "flip the biggest one"
      (ctx, instant) => {
        if (instant) return render(ctx, S5(), true);
        const s = S4c(); s[1].st = ''; s[1].t = ''; render(ctx, s, false);
        ctx.later(() => typeInto(ctx, 'b', 'flip the biggest one', 900), 150);
      },
      // 7 — Check → "?"
      (ctx, instant) => { if (instant) return render(ctx, S6(), true); check(ctx, 200, () => render(ctx, S6(), false)); },
    ],
  });
})();
