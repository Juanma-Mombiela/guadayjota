import { animate, inView, scroll } from 'motion';
import { setSeed, rnd, jit } from './hand';
import { $, $$, reduce } from './dom';

/* Las 3 estrellas del logo repartidas por todo el sitio, con posiciones de semilla fija. */
export function initStars() {
  setSeed(42);
  const SRC = ['/img/estrella-a.png', '/img/estrella-b.png', '/img/estrella-c.png'];
  const stars: { el: HTMLDivElement; speed: number; y?: number }[] = [];
  const mk = (parent: Element, css: string, size: number, speed: number) => {
    const d = document.createElement('div');
    d.className = 'st';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = css + `;--s:${size}px;--d:${(3 + rnd() * 3).toFixed(1)}s;--dl:${(-rnd() * 4).toFixed(1)}s;--r:${Math.round(jit(50))}deg`;
    d.innerHTML = `<div class="pop"><img src="${SRC[Math.floor(rnd() * 3)]}" alt=""></div>`;
    parent.appendChild(d);
    stars.push({ el: d, speed });
    return d;
  };
  const small = innerWidth < 760;
  const sz = (a: number, b: number) => Math.round((small ? 0.6 : 1) * (a + rnd() * (b - a)));

  // en los márgenes de cada sección
  $$('#main>section,#main>footer,.hero').forEach((sec, i) => {
    const n = sec.classList.contains('hero') ? 5 : 3 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const left = (k + i) % 2 === 0, x = left ? 0.5 + rnd() * 6 : 92 + rnd() * 6.5, y = 8 + rnd() * 82;
      mk(sec, `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;margin-left:-${small ? 12 : 24}px`, sz(36, 86), 0.04 + rnd() * 0.12);
    }
  });
  // grandes y suaves de fondo, detrás del contenido
  $$('#main>section,#main>footer').forEach(sec => {
    for (let k = 0; k < 2; k++) {
      const d = mk(sec, `left:${(8 + rnd() * 84).toFixed(1)}%;top:${(10 + rnd() * 75).toFixed(1)}%;margin-left:-60px`, sz(110, 190), 0.02 + rnd() * 0.05);
      d.classList.add('bg');
    }
  });
  // en las esquinas de las fotos, medio afuera
  $$('.ph .pic').forEach((pic, i) => {
    const c = ['right:-28px;top:-26px', 'left:-30px;bottom:-24px', 'right:-22px;bottom:18%'];
    [c[i % 3], c[(i + 1) % 3]].slice(0, 1 + (i % 2)).forEach(css => mk(pic, css, sz(46, 84), 0));
  });
  // junto a los títulos, en secciones alternadas
  $$('.sec h2').forEach((h, i) => {
    if (i % 2) return;
    const w = h.parentElement!;
    if (getComputedStyle(w).position === 'static') w.style.position = 'relative';
    mk(w, `right:${(2 + rnd() * 8).toFixed(0)}%;top:${(-44 + rnd() * 10).toFixed(0)}px`, sz(30, 48), 0.08);
  });

  const margin = stars.filter(s => s.el.parentElement?.matches('#main>section') && !s.el.classList.contains('bg'));
  margin.forEach(s => { s.el.dataset.top = s.el.style.top; });

  /** Las estrellas del margen que caen sobre la cuenta regresiva bajan justo debajo de ella. */
  function avoidCountdown() {
    const boxes = $$('[data-cd]>div').map(d => d.getBoundingClientRect());
    if (!boxes.length) return;
    const bottom = Math.max(...boxes.map(b => b.bottom));
    let below = 0;
    margin.forEach(s => {
      const sec = s.el.parentElement!;
      if (!sec.contains($('[data-cd]'))) return;
      s.el.style.top = s.el.dataset.top!;
      const shift = parseFloat(s.el.style.translate?.split(' ')[1]) || 0;
      const r = s.el.getBoundingClientRect();
      const hit = boxes.some(b => r.right > b.left && r.left < b.right && r.bottom - shift + 8 > b.top && r.top - shift - 8 < b.bottom);
      if (!hit) return;
      const secTop = sec.getBoundingClientRect().top;
      s.el.style.top = `${(bottom - secTop + 10 + below).toFixed(0)}px`;
      below += r.height + 6;
    });
  }

  /** Las estrellas que quedan encima de una línea de texto se ponen más claritas para que se lea.
      Se mide en coordenadas de página y se vuelve a chequear con el parallax de cada estrella. */
  const TEXT = 'h1,h2,h3,p,.label,.big,.cd b,.cd span,.addr,.alias code,.btn,label';
  type Box = { l: number; r: number; t: number; b: number };
  let lines: Box[] = [];
  const boxes = new Map<HTMLElement, Box>();
  const dyOf = (el: HTMLElement) => parseFloat(el.style.translate?.split(' ')[1]) || 0;
  function measureText() {
    lines = [];
    const range = document.createRange();
    $$(TEXT).forEach(el => {
      if (!el.offsetParent) return; // oculto
      range.selectNodeContents(el);
      for (const r of range.getClientRects()) if (r.width > 2 && r.height > 2) lines.push({ l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY });
    });
    stars.forEach(s => {
      if (s.el.classList.contains('bg')) return;
      const r = s.el.getBoundingClientRect(), pad = r.width * 0.12, dy = dyOf(s.el); // el dibujo no llena la caja
      boxes.set(s.el, { l: r.left + pad, r: r.right - pad, t: r.top + scrollY - dy + pad, b: r.bottom + scrollY - dy - pad });
    });
  }
  function dim(el: HTMLElement, dy: number) {
    const s = boxes.get(el);
    if (!s) return;
    el.classList.toggle('dim', lines.some(l => s.r > l.l && s.l < l.r && s.b + dy > l.t && s.t + dy < l.b));
  }
  const dimAll = () => boxes.forEach((_, el) => dim(el, dyOf(el)));

  let tops = () => {};
  const settle = () => { avoidCountdown(); tops(); measureText(); dimAll(); };
  if (reduce) return { settle };
  // aparecen con un pop y flotan con el scroll
  stars.forEach(({ el }) => {
    const p = $('.pop', el);
    p.style.transform = 'scale(0)';
    inView(el, () => { animate(p, { scale: [0, 1], rotate: [-60, 0] }, { type: 'spring', bounce: 0.55, duration: 0.9, delay: rnd() * 0.25 }); }, { amount: 0.2 });
  });
  tops = () => stars.forEach(s => {
    const r = s.el.getBoundingClientRect();
    s.y = r.top + scrollY + r.height / 2 - (parseFloat(s.el.style.translate?.split(' ')[1]) || 0);
  });
  tops();
  addEventListener('resize', tops);
  scroll(() => {
    const c = scrollY + innerHeight / 2;
    stars.forEach(s => {
      if (!s.speed) return;
      const dy = (s.y! - c) * -s.speed;
      s.el.style.translate = `0 ${dy.toFixed(1)}px`;
      dim(s.el, dy);
    });
  });
  return { settle };
}
