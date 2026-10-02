/* Part 0 — pancake sort introduced once, on [2,3,4,1] — sorted after one round. 4 beats. */
(function () {
  const START = [2, 3, 4, 1];
  Deck.demo('intro', {
    reset(ctx) {
      const s = ctx.section;
      ctx.box = s.querySelector('.stackbox');
      ctx.box.innerHTML = '';
      ctx.st = new PancakeStack(ctx.box, { values: START, width: 680, height: 560, thick: 60, gap: 18, maxVal: 4, showIndex: true });
      ctx.steps = Array.from(s.querySelectorAll('.intro li'));
      ctx.steps.forEach(li => li.classList.remove('on', 'done'));
    },
    beats: [
      (ctx) => { mark(ctx, 0); ctx.st.highlight([2]); },
      (ctx, instant) => { mark(ctx, 1); ctx.st.highlight([]); ctx.st.flip(3, instant); ctx.later(() => ctx.st.highlight([0]), instant ? 0 : 650); },
      (ctx, instant) => { mark(ctx, 2); ctx.st.highlight([]); ctx.st.flip(4, instant, () => { ctx.st.mark(3, 'good'); }); },
      (ctx, instant) => {
        mark(ctx, 3);
        // remaining rounds on [1,2,3 | 4]: the largest of each shrinking range is already at its bottom — nothing to flip
        if (instant) { [2, 1, 0].forEach(i => ctx.st.mark(i, 'good')); return; }
        let t = 0;
        [2, 1, 0].forEach(i => {
          ctx.later(() => ctx.st.highlight([i]), t); t += 600;
          ctx.later(() => { ctx.st.highlight([]); ctx.st.mark(i, 'good'); }, t); t += 450;
        });
      },
    ],
  });
  function mark(ctx, i) { ctx.steps.forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('done', j < i); }); }
})();
