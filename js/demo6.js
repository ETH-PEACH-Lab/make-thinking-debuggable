/* Demo 6 — ChatCommunity: the same answer, plus the people. 3 beats.
   Built on the real Stack Overflow thread 75779984 (quotes verbatim). */
(function () {
  const U = DemoUtil;

  const GPT = `Almost certainly a benchmarking artifact, not the algorithm. The first run pays for JVM warm-up and JIT compilation; the second runs compiled code.

On sorted input pancake sort does zero flips, so it should be faster. Try:
1. Use JMH instead of hand-rolled timing.
2. Warm up, then average many runs.
3. Copy the array before each run.`;

  const KELLY_FIRST = 'Given the long runtimes of 3 and 6 hours, I see two possible interesting explanations:';

  // ChatCommunity's answer is generated from the retrieved community post, and cites it
  const CC = `At 3 and 6 hours, warm-up can't explain this — it's your data, not your timer. Two effects, from a thread on exactly this experiment [1]:

1. Sorted neighbours share long prefixes → slower string comparisons.
2. Sorting shuffles the memory order → worse cache locality.

Reproduced there: 1.2 s unsorted vs 2.0 s sorted.
[1] Kelly Bundy, stackoverflow.com/questions/75779984`;

  // ---- thread content (from the real page)
  const THREAD = {
    title: 'Why is Bubble/Selection/Pancake Sort faster when testing it with unsorted values?',
    meta: ['Asked 3 years, 6 months ago', 'Viewed 219 times', 'java · arrays · sorting · time-complexity'],
    a0: {
      votes: 0, who: 'frozenproof', rep: '93', when: 'Mar 19, 2023 at 4:05',
      html: `<p>Aren't you using the same array in the variable field by the function?</p><p>This may have to do with machine load. Usually, your machine may spend different amount of CPU cycles on each task, and performing certain task may push the priority for the execution down a bit, which lead to some delay.</p><p>If you perform raw execution of each algorithm around 50 times, the difference is uncanny on recorded time.</p>`,
      cmts: [
        ['Stephen C', 'Also, he only runs each test once, so the results are liable to be distorted JVM warmup issues; e.g. class loading, heap resizing, JIT compilation, and so on.', ''],
        ['Sheep_Walker', 'Ok, I tested it with a smaller array of 6 elements, and now -as expected- it sorts faster the sorted version of the array.... I think it is because of what you both said.... JVM issues...', ''],
        ['Kelly Bundy', '@StephenC How long does it take to warm up? <span class="rq">The times were 3 hours and 6 hours.</span> I think you guys all dismissed this incorrectly.', 'kelly'],
        ['Kelly Bundy', "@frozenproof Your first paragraph doesn't make sense. Yes, they're using the same variable, so the second time it's already sorted. But that's intentional. Remember what the question is about! And I don't think it's reasonable to run this 50 times. <span class=\"rq\">That's 450 hours!</span> You don't need that many times.", 'kelly'],
      ],
    },
    a1: {
      votes: 1, who: 'Kelly Bundy', rep: '28.2k', when: 'Mar 21, 2023 at 0:37 · edited Mar 22',
      html: `<p>${KELLY_FIRST}</p><ol><li>You always compare neighbor elements. When the array is unsorted, neighbor strings likely already differ at the first character, which makes the comparisons fast. When the array is sorted, neighbor strings likely share a common prefix, which makes comparisons slower.</li><li>You created the string objects in unsorted order, for example reading a file of unsorted strings into memory. […] So at the start, going through the strings in array order accesses the memory sequentially, which is cache-friendly. But then the sorting changes the array order. So going through the strings of the sorted array accesses the memory "randomly", which is cache-unfriendly.</li></ol><p><b>Update</b> after your question update with the additional timings and link to code/data: Both of the above reasons apply, although I suspect the cache one is the main one. […]</p><p>I was able to reliably reproduce the "unsorted" case being faster than the "sorted" case (1.2 seconds vs 2.0 seconds, doing five rounds and ignoring the first round for warmup) with 10000 artificially created strings of 100 characters each.</p>`,
      cmts: [
        ['Sheep_Walker', 'Holy water! That makes a lot of sense actually... I think the first theory could be the main reason. You know? it makes too much sense haha.', ''],
        ['Sheep_Walker', 'Do you only want the other tests I made and a code to copy and run as more info, right? In fact, I even have it already in the github with some txt files filled with many many words', ''],
        ['Kelly Bundy', "@Sheep_Walker Thanks fo the additional timings/code/data. It's all as expected. See the \"Update\" paragraph I added to my answer now.", 'kelly'],
        ['Sheep_Walker', 'thank you very much. Now I understand better. You know? really cool you fought your way to the reopening of my question, and posted this good answer', 'last'],
      ],
    },
  };

  function answerHtml(a) {
    const cm = a.cmts.map(([who, txt, cls]) => `<div class="cmt ${cls || ''}"><b>${who}</b>${txt}</div>`).join('');
    return `<div class="answer"><div class="vote">▲<b>${a.votes}</b>▼</div><div class="atxt">${a.html}<div class="sig">answered ${a.when} · <b>${a.who}</b> <span>${a.rep}</span></div><div class="cmts">${cm}</div></div></div>`;
  }
  function buildThread(ctx) {
    ctx.thread.querySelector('.body').innerHTML = `<div class="qh">${THREAD.title}</div><div class="qmeta">${THREAD.meta.map(m => `<span>${m}</span>`).join('')}</div><div class="a0">${answerHtml(THREAD.a0)}</div><div class="a1">${answerHtml(THREAD.a1)}</div>`;
  }
  const cmts = (ctx, which) => Array.from(ctx.thread.querySelectorAll(`.${which} .cmt`));

  function preview(ctx) {
    ctx.srcs.innerHTML = `<div class="lbl">from the community</div>
      <div class="post"><div class="av">KB</div><div><div class="who"><b>Kelly Bundy</b><span class="rep">28.2k</span><span class="rep">· 8 gold · 36 silver · 76 bronze</span></div>
      <div class="meta"><span>▲ 1</span><span>👁 219 views</span><span>💬 4 comments</span><span>Mar 21, 2023</span></div>
      <div class="first">“${KELLY_FIRST}”</div></div></div>`;
  }

  Deck.demo('demo6', {
    reset(ctx) {
      const s = ctx.section;
      ctx.gptWin = s.querySelector('.col.gpt'); ctx.gptWin.classList.remove('on'); ctx.gpt = s.querySelector('.col.gpt .ans'); ctx.gpt.innerHTML = ''; ctx.gpt.classList.remove('cursor');
      ctx.cc = s.querySelector('.col.cc'); ctx.ccAns = ctx.cc.querySelector('.ans'); ctx.ccAns.innerHTML = ''; ctx.ccAns.classList.remove('cursor'); ctx.cc.classList.remove('on');
      ctx.srcs = s.querySelector('.srcs'); ctx.srcs.classList.remove('on'); preview(ctx);
      ctx.thread = s.querySelector('.col.thread'); ctx.thread.classList.add('on'); buildThread(ctx);   // the thread is there from the start
      ctx.thread.querySelector('.body').scrollTop = 0;
      ctx.chart = s.querySelector('.chart'); ctx.chart.classList.remove('on');
    },
    beats: [
      // 1 — left: a chat window appears with the question; a regular chatbot types a confident, generic answer
      (ctx, instant) => {
        ctx.gptWin.classList.add('on');
        if (instant) { ctx.gpt.textContent = GPT; return; }
        ctx.gpt.classList.add('cursor'); ctx.later(() => U.type(ctx.gpt, GPT, 3600, false, () => ctx.gpt.classList.remove('cursor')), 700);
      },
      // 2 — the chart: monthly questions on Stack Overflow
      (ctx, instant) => {
        ctx.gptWin.classList.add('on'); ctx.gpt.textContent = GPT; ctx.thread.classList.add('on');
        if (instant) { ctx.chart.classList.add('on'); return; }
        ctx.later(() => ctx.chart.classList.add('on'), 200);
      },
      // 3 — chart gone; the right window is ChatCommunity: an answer grounded in the thread, with a citation
      (ctx, instant) => {
        ctx.gptWin.classList.add('on'); ctx.gpt.textContent = GPT; ctx.chart.classList.remove('on'); ctx.thread.classList.remove('on'); ctx.cc.classList.add('on');
        if (instant) { ctx.ccAns.textContent = CC; ctx.srcs.classList.add('on'); return; }
        ctx.ccAns.classList.add('cursor');
        ctx.later(() => U.type(ctx.ccAns, CC, 3600, false, () => { ctx.ccAns.classList.remove('cursor'); ctx.srcs.classList.add('on'); }), 600);
      },
    ],
  });
})();
