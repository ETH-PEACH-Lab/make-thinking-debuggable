/* Demo 2 — Plan tracing: make execution visible. 7 beats.
   Demo 1's box, unchanged; each slice gets trace cells (array after / max / i). */
(function () {
  const U = DemoUtil;
  const HEAD = 0.55;

  // the plan, exactly as Demo 1 left it (step 1 folded)
  const PLAN = [
    { id: 'a', t: 'find the largest pancake', chip: '▸ 3 sub-steps' },
    { id: 'b', t: 'flip the biggest one' },
    { id: 'b2', t: 'flip it to the bottom' },
  ];
  // "array after" per node
  const TRACE = { a: '[2, 3, 4, 1]', b: '[4, 3, 2, 1]', b2: '[1, 2, 3, 4]' };

  const FEEDBACK = [
    "Thank you for submitting your plan and execution trace for the pancake sorting problem. I have carefully reviewed each step of your plan together with the values you recorded, and I will walk through them in order so that you can see how I interpreted your reasoning at each point before I explain the issue I found.",
    "In step 1, you describe finding the largest pancake. Your sub-steps 1.1 through 1.3 indicate that you look at each pancake from top to bottom, keep track of the largest one seen so far, and remember its position. In your trace, starting from the input [2, 3, 4, 1], you correctly identified 4 as the largest pancake and recorded its position as index 2. This is consistent with a linear scan over the array, and the values you recorded match what such a scan would produce.",
    "In step 2, you flip the biggest one. Based on your trace, the array after this step is [4, 3, 2, 1], which indicates that you flipped the top three pancakes so that the largest pancake moved from position 2 to position 0. This is consistent with a flip of the prefix of length position + 1, and the recorded state correctly reflects a reversal of the first three elements.",
    "In step 3, you flip it to the bottom. Your trace shows the array becoming [1, 2, 3, 4], which corresponds to reversing the entire array of four elements. After this step the largest pancake is at the last position, which is indeed its correct final position, and on this particular input the whole array happens to be sorted as well.",
    "However, this outcome depends on the specific input you traced. Placing the largest pancake at the bottom is only the first round of the algorithm; it guarantees the position of one pancake, not of the others. On the input [2, 3, 4, 1] the remaining pancakes 1, 2 and 3 happened to land in order after the second flip, but this is a coincidence of the input rather than a property of the plan. Consider, for example, the input [3, 2, 4, 1]: after the same three steps the array would be [1, 3, 2, 4], with 3 above 2, and your plan would stop there and leave the stack unsorted.",
    "In other words, your plan describes one iteration of the procedure but does not describe the repetition, nor the shrinking range over which the repetition takes place. In general, the same three steps must be applied again to the unsorted portion of the stack, that is, to the top n − 1 pancakes, then the top n − 2, and so on, until the unsorted portion contains a single pancake. Consider adding a step that repeats steps 1 to 3 on the remaining unsorted pancakes, and be explicit about how many pancakes are considered in each round.",
    "Overall, your decomposition of the individual steps is precise and your trace is consistent with the intended behaviour of each step. The missing piece is the outer repetition, which your chosen input did not reveal. Once it is added, the plan should sort any input correctly, and I would encourage you to trace a second input such as [3, 2, 4, 1] before proceeding to implementation.",
  ];

  function build(ctx) {
    ctx.list.innerHTML = ''; ctx.nodes = {};
    PLAN.forEach((n, i) => {
      const el = U.el('div', 'node ok' + (n.chip ? ' collapsed split' : '')); el.dataset.id = n.id; el.style.flexGrow = 1;
      el.innerHTML = `<div class="row"><span class="badge">✓</span><span class="num">${i + 1}</span><span class="txt">${n.t}</span><span class="chip">${n.chip || ''}</span><span class="tr arr"></span></div>`;
      ctx.list.appendChild(el); ctx.nodes[n.id] = el;
    });
  }
  const cell = (ctx, id) => ctx.nodes[id].querySelector(':scope > .row > .tr');
  function fill(ctx, ids) { ids.forEach(id => { cell(ctx, id).textContent = TRACE[id]; }); }
  function typeCell(ctx, id, ms, done) {
    const c = cell(ctx, id); c.classList.add('cursor');
    U.type(c, TRACE[id], ms, false, () => { c.classList.remove('cursor'); done && done(); });
  }
  function setStatus(ctx, id, st) {
    const el = ctx.nodes[id]; el.classList.remove('ok', 'q'); el.classList.add(st); if (st !== 'ok') el.classList.remove('split');
    el.querySelector(':scope > .row > .badge').textContent = st === 'ok' ? '✓' : '?';
  }
  function stackTo(ctx, upto) {
    const seq = { b: [3], b2: [3, 4] };
    ctx.st.set([2, 3, 4, 1], true);
    (seq[upto] || []).forEach(k => ctx.st.flip(k, true));
  }
  const input = (ctx, on) => { ctx.inputEl.innerHTML = on ? 'input: <b>[2, 3, 4, 1]</b>' : 'input: <b>—</b>'; };

  Deck.demo('demo2', {
    reset(ctx) {
      const s = ctx.section;
      ctx.list = s.querySelector('.nodes');
      ctx.inputEl = s.querySelector('.input');
      ctx.btn = s.querySelector('.btn.verify'); ctx.btn.classList.remove('pulse');
      ctx.stackbox = s.querySelector('.stackbox'); ctx.stackbox.innerHTML = '';
      ctx.st = new PancakeStack(ctx.stackbox, { values: [2, 3, 4, 1], width: 460, height: 380, thick: 44, gap: 14, maxVal: 4, showIndex: true });
      ctx.fb = s.querySelector('.feedback'); ctx.fb.classList.remove('on');
      ctx.fbBody = s.querySelector('.feedback .body'); ctx.fbBody.innerHTML = FEEDBACK.map(p => `<p>${p}</p>`).join(''); ctx.fbBody.scrollTop = 0;
      build(ctx); setStatus(ctx, 'b', 'q'); input(ctx, false);
    },
    beats: [
      // 1 — the input appears; trace cells are there, empty
      (ctx) => { input(ctx, true); },
      // 2 — step 1: the array is unchanged; the learner scans the stack and finds the 4; cursor waits in "flip the biggest one"
      (ctx, instant) => {
        input(ctx, true);
        if (instant) { fill(ctx, ['a']); cell(ctx, 'b').classList.add('cursor'); return; }
        ctx.later(() => typeCell(ctx, 'a', 500), 100);
        ctx.later(() => { cell(ctx, 'b').classList.add('cursor'); }, 900);
      },
      // 3 — learner types [4, 3, 2, 1]; the stack flips; ? → ✓
      (ctx, instant) => {
        input(ctx, true); fill(ctx, ['a']);
        if (instant) { fill(ctx, ['b']); return; }
        ctx.later(() => typeCell(ctx, 'b', 900), 200);
      },
      // 4 — last row; the whole stack flips; sorted
      (ctx, instant) => {
        input(ctx, true); fill(ctx, ['a', 'b']);
        if (instant) { fill(ctx, ['b2']); return; }
        ctx.later(() => typeCell(ctx, 'b2', 800), 200);
      },
      // 5 — Verify: the ? turns into a ✓
      (ctx, instant) => {
        input(ctx, true); fill(ctx, ['a', 'b', 'b2']);
        if (instant) { setStatus(ctx, 'b', 'ok'); return; }
        ctx.later(() => ctx.btn.classList.add('pulse'), 150);
        ctx.later(() => ctx.btn.classList.remove('pulse'), 370);
        ctx.later(() => setStatus(ctx, 'b', 'ok'), 800);
      },
      // 6 — the long feedback slides over the stack
      (ctx, instant) => {
        input(ctx, true); fill(ctx, ['a', 'b', 'b2']); setStatus(ctx, 'b', 'ok');
        if (instant) { ctx.fb.classList.add('on'); return; }
        ctx.later(() => ctx.fb.classList.add('on'), 200);
      },
      // 7 — scroll all the way down; the panel stays
      (ctx, instant) => {
        input(ctx, true); fill(ctx, ['a', 'b', 'b2']); setStatus(ctx, 'b', 'ok');
        ctx.fb.classList.add('on');
        const end = () => ctx.fbBody.scrollHeight;
        if (instant) { ctx.fbBody.style.scrollBehavior = 'auto'; ctx.fbBody.scrollTop = end(); ctx.fbBody.style.scrollBehavior = ''; return; }
        ctx.later(() => { ctx.fbBody.scrollTop = 320; }, 500);
        ctx.later(() => { ctx.fbBody.scrollTop = 700; }, 1500);
        ctx.later(() => { ctx.fbBody.scrollTop = end(); }, 2500);
      },
    ],
  });
})();
