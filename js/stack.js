/* Pancake stack — shared visual for the running example.
   Index 0 is the TOP pancake (so "flip the top k" reverses a prefix, as in the algorithm).

   const st = new PancakeStack(container, { values:[3,1,4,2], width:520, height:420, showIndex:false });
   st.set([3,1,4,2], instant)        // replace values
   st.flip(k, instant, done)         // reverse the top k, animated
   st.highlight([i, j]) / st.highlight([])   // glow specific pancakes
   st.mark(i, 'bad') / st.mark(i, null)      // red outline etc.
   st.values                          // current array (copy)
*/
class PancakeStack {
  constructor(container, opt = {}) {
    this.c = container;
    this.W = opt.width || 520; this.H = opt.height || 420;
    this.showIndex = !!opt.showIndex;
    this.maxVal = opt.maxVal || 5;
    this.thick = opt.thick || 40; this.gap = opt.gap || 14;
    this.plate = opt.plate !== false;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    this.svg.setAttribute('width', this.W); this.svg.setAttribute('height', this.H);
    this.svg.classList.add('pstack');
    this.c.appendChild(this.svg);
    this.els = new Map(); // value -> <g>
    this.set(opt.values || [3, 1, 4, 2], true);
  }
  get values() { return this._v.slice(); }
  _y(i) {                                   // y of pancake at stack position i (0 = top)
    const n = this._v.length;
    const base = this.H - (this.plate ? 46 : 12);
    return base - (n - i) * (this.thick + this.gap);
  }
  _w(v) { return 110 + (v / this.maxVal) * (this.W - 160); }
  set(values, instant) {
    this._v = values.slice();
    this.svg.innerHTML = '';
    this.els.clear();
    if (this.plate) {
      const p = this._ns('ellipse', { cx: this.W / 2, cy: this.H - 30, rx: this.W / 2 - 10, ry: 16, class: 'plate' });
      this.svg.appendChild(p);
    }
    this._v.forEach((v, i) => {
      const g = this._ns('g', { class: 'pc' });
      const w = this._w(v);
      const r = this._ns('rect', { x: -w / 2, y: -this.thick / 2, width: w, height: this.thick, rx: this.thick / 2, class: 'body' });
      const sh = this._ns('rect', { x: -w / 2, y: this.thick / 2 - 8, width: w, height: 10, rx: 5, class: 'shade' });
      g.appendChild(sh); g.appendChild(r);
      if (this.showIndex) {
        const t = this._ns('text', { x: 0, y: 8, 'text-anchor': 'middle', class: 'lbl' }); t.textContent = v; g.appendChild(t);
      }
      g.style.transition = instant ? 'none' : 'transform .45s cubic-bezier(.4,0,.2,1)';
      g.style.transform = `translate(${this.W / 2}px, ${this._y(i)}px)`;
      this.svg.appendChild(g);
      this.els.set(v, g);
    });
  }
  _place(instant) {
    this._v.forEach((v, i) => {
      const g = this.els.get(v);
      g.style.transition = instant ? 'none' : 'transform .45s cubic-bezier(.4,0,.2,1)';
      g.style.transform = `translate(${this.W / 2}px, ${this._y(i)}px)`;
    });
  }
  flip(k, instant, done) {
    k = Math.min(k, this._v.length);
    const before = this._v.slice();
    const top = this._v.slice(0, k).reverse();
    this._v = top.concat(this._v.slice(k));
    if (instant) { this._place(true); done && done(); return; }
    // Rotate the top k pancakes as one rigid group by 180° around the group's centre, with a lift.
    const yTop = this._y(0), yBot = this._y(k - 1);
    const midY = (yTop + yBot) / 2;
    const grp = this._ns('g', { class: 'flipgrp' });
    grp.style.transformBox = 'view-box';
    grp.style.transformOrigin = `${this.W / 2}px ${midY}px`;
    this.svg.appendChild(grp);
    before.slice(0, k).forEach(v => { const g = this.els.get(v); g.style.transition = 'none'; grp.appendChild(g); g.classList.add('lift'); });
    this._spatula(k);
    grp.style.animation = 'pflip .75s cubic-bezier(.45,0,.2,1) forwards';
    setTimeout(() => {
      // unwrap: put pancakes back at their new resting positions, upright
      before.slice(0, k).forEach(v => { const g = this.els.get(v); g.classList.remove('lift'); this.svg.insertBefore(g, grp); });
      grp.remove();
      this._place(true);
      done && done();
    }, 780);
  }
  _spatula(k) {
    // a thin bar under the flipped group, fades out
    const y = this._y(k - 1) + this.thick / 2 + 6;
    const bar = this._ns('rect', { x: 40, y, width: this.W - 80, height: 6, rx: 3, class: 'spatula' });
    this.svg.appendChild(bar);
    setTimeout(() => bar.remove(), 700);
  }
  highlight(idxs) {
    this._v.forEach((v, i) => this.els.get(v).classList.toggle('hi', idxs.includes(i)));
  }
  mark(i, cls) {
    const g = this.els.get(this._v[i]);
    g.classList.remove('bad', 'good', 'warn');
    if (cls) g.classList.add(cls);
  }
  _ns(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
}
window.PancakeStack = PancakeStack;
