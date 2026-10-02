/* Demo 0 — the negative example. ChatGPT writes pancake sort in eight seconds.
   Beats: 1 prompt appears · 2 code + explanation typed out · 3 tests pass. */
(function () {
  const U = DemoUtil;

  const CODE = `fn pancake_sort(arr: &mut Vec<i32>) {
    let n = arr.len();
    for size in (2..=n).rev() {
        let max_i = (0..size).max_by_key(|&i| arr[i]).unwrap();
        if max_i != size - 1 {
            arr[..=max_i].reverse();
            arr[..size].reverse();
        }
    }
}`;

  const EXPLAIN = `This finds the largest unsorted pancake, flips it to the top, then flips it to the bottom of the unsorted portion, shrinking the portion each round. It runs in O(n²) time and uses at most 2n − 3 flips.`;

  const TESTS = [
    ['vec![2,3,4,1]', '[1,2,3,4]'],
    ['vec![4,3,2,1]', '[1,2,3,4]'],
    ['vec![1]', '[1]'],
    ['vec![]', '[]'],
  ];

  function hl(src) {
    return src
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/(\/\/.*)$/gm, '<span class="c">$1</span>')
      .replace(/\b(fn|let|for|in|if|mut|Vec|i32)\b/g, '<span class="k">$1</span>')
      .replace(/\b(len|reverse|rev|max_by_key|unwrap|println!)/g, '<span class="f">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="n">$1</span>');
  }

  Deck.demo('demo0', {
    reset(ctx) {
      const s = ctx.section;
      ctx.chat = s.querySelector('.chat');
      ctx.tests = s.querySelector('.tests');
      ctx.chat.innerHTML = ''; ctx.chat.appendChild(U.el('div', 'msg user', 'Write pancake sort in Rust.'));   // the prompt is there from the start
      ctx.tests.innerHTML = '';
      ctx.tests.classList.remove('on');
      ctx.wrap = s.querySelector('.d0');
      ctx.wrap.classList.remove('quiz');
      ctx.qtop = s.querySelector('.qtop'); ctx.qopts = s.querySelector('.qopts');
      ctx.qtop.innerHTML = ''; ctx.qopts.innerHTML = '';
      ctx.qtop.classList.remove('on'); ctx.qopts.classList.remove('on');
      ctx.poll = s.querySelector('.poll'); ctx.poll.classList.remove('on'); ctx.qopts.classList.remove('live');
      Poll.stop();
      if (!ctx._pollKey) { ctx._pollKey = true; document.addEventListener('keydown', (e) => { if (e.key === '0' && ctx.section.classList.contains('active')) Poll.reset(); }); }
    },
    beats: [
      // 1 — the answer (code + one-line explanation), at once
      (ctx, instant) => {
        const b = U.el('div', 'msg bot');
        const pre = U.el('pre', 'py'); const code = U.el('code');
        pre.appendChild(code); b.appendChild(pre);
        const ex = U.el('p', 'explain');
        b.appendChild(ex);
        ctx.chat.appendChild(b);
        code.innerHTML = hl(CODE); ex.textContent = EXPLAIN;   // no typing — the whole answer at once
      },
      // 2 — tests pass
      (ctx, instant) => {
        ctx.tests.classList.add('on');
        const rows = TESTS.map(([call, want]) => {
          const r = U.el('div', 'row', `<span class="tick">✓</span><code>${call}</code><span class="arrow">→</span><code>${want}</code>`);
          ctx.tests.appendChild(r); return r;
        });
        const done = U.el('div', 'done', '4 passed, 0 failed');
        ctx.tests.appendChild(done);
        U.seq([
          ...rows.map(r => [() => r.classList.add('on'), 260]),
          [() => done.classList.add('on'), 0],
        ], instant);
      },
      // 3 — everything fades but the code; a println!("flip") opens up after each reverse() and is typed in
      (ctx, instant) => {
        ctx.wrap.classList.add('quiz');
        const code = ctx.chat.querySelector('pre.py code');
        const lines = CODE.split('\n');
        const i1 = lines.findIndex(l => l.includes('arr[..=max_i].reverse();')) + 1;
        const i2 = lines.findIndex(l => l.includes('arr[..size].reverse();')) + 1;
        const text = 'println!("flip");';
        // the two new lines are their own blocks so their height can animate from 0
        code.innerHTML = `${hl(lines.slice(0, i1).join('\n'))}\n<span class="nl"><span class="pl"></span></span>${hl(lines.slice(i1, i2).join('\n'))}\n<span class="nl"><span class="pl"></span></span>${hl(lines.slice(i2).join('\n'))}`;
        const nls = Array.from(code.querySelectorAll('.nl')), pls = Array.from(code.querySelectorAll('.pl'));
        if (instant) { nls.forEach(n => n.classList.add('open')); pls.forEach(p => p.textContent = text); return; }
        requestAnimationFrame(() => requestAnimationFrame(() => nls.forEach(n => n.classList.add('open'))));
        let i = 0;
        const tick = () => { i++; pls.forEach(p => p.textContent = text.slice(0, i)); if (i < text.length) ctx.later(tick, 55); };
        ctx.later(tick, 550);
      },
      // 4 — the question, with the QR and live bars (A 4 / B 6 / C 8) right away
      (ctx, instant) => {
        ctx.qtop.innerHTML = `How many times would we flip the pancakes for <code>[4, 2, 5, 1]</code>?`;
        ctx.qopts.classList.add('live'); ctx.poll.classList.add('on');
        const bars = Array.from(ctx.poll.querySelectorAll('.bar')), total = ctx.poll.querySelector('.total');
        Poll.start((c) => {
          const sum = c.A + c.B + c.C, max = Math.max(1, c.A, c.B, c.C);
          bars.forEach(b => { const v = c[b.dataset.v] || 0; b.style.setProperty('--p', v / max); b.querySelector('.n').textContent = v; });
          total.textContent = sum ? `${sum} vote${sum === 1 ? '' : 's'}` : 'waiting for votes…';
        });
        if (instant) { ctx.qtop.classList.add('on'); return; }
        ctx.later(() => ctx.qtop.classList.add('on'), 100);
      },
    ],
  });
})();
