/* Live poll for Demo 0. Backend: Firebase Realtime Database over plain REST + EventSource (no SDK).
   Config lives in POLL_CONFIG; with dbUrl === null the slide runs in demo mode (fake votes trickle in). */
window.POLL_CONFIG = {
  dbUrl: 'https://awesome-presentation-788e7-default-rtdb.firebaseio.com',
  path: 'talks/chci-2026/q1',                  // where this question's counts live
  voteUrl: 'https://peachlab.inf.ethz.ch/vote',// where the QR points (vote/index.html hosted there)
};
window.Poll = (function () {
  const C = window.POLL_CONFIG;
  let es = null, demoTimer = null, counts = { A: 0, B: 0, C: 0 }, onChange = null;
  function render() { onChange && onChange({ ...counts }); }
  function start(cb) {
    onChange = cb; stop();
    if (!C.dbUrl) {                            // demo mode: deterministic-ish trickle, mostly B
      counts = { A: 0, B: 0, C: 0 }; render();
      const seq = 'BCABBCBBABCBBBCBABBB'; let i = 0;
      demoTimer = setInterval(() => { if (i >= seq.length) return; counts[seq[i++]]++; render(); }, 650);
      return;
    }
    es = new EventSource(`${C.dbUrl}/${C.path}.json`);
    const apply = (e) => {
      const m = JSON.parse(e.data); if (!m || m.data == null) return;
      if (m.path === '/') counts = Object.assign({ A: 0, B: 0, C: 0 }, m.data);
      else counts[m.path.replace('/', '')] = m.data;
      render();
    };
    es.addEventListener('put', apply); es.addEventListener('patch', apply);
  }
  function stop() { if (es) { es.close(); es = null; } if (demoTimer) { clearInterval(demoTimer); demoTimer = null; } }
  async function reset() {                     // speaker: key 0 on the slide
    counts = { A: 0, B: 0, C: 0 }; render();
    if (C.dbUrl) await fetch(`${C.dbUrl}/${C.path}.json`, { method: 'PUT', body: JSON.stringify(counts) });
  }
  return { start, stop, reset, counts: () => counts };
})();
