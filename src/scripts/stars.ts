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

  if (reduce) return;
  // aparecen con un pop y flotan con el scroll
  stars.forEach(({ el }) => {
    const p = $('.pop', el);
    p.style.transform = 'scale(0)';
    inView(el, () => { animate(p, { scale: [0, 1], rotate: [-60, 0] }, { type: 'spring', bounce: 0.55, duration: 0.9, delay: rnd() * 0.25 }); }, { amount: 0.2 });
  });
  const tops = () => stars.forEach(s => {
    const r = s.el.getBoundingClientRect();
    s.y = r.top + scrollY + r.height / 2 - (parseFloat(s.el.style.translate?.split(' ')[1]) || 0);
  });
  tops();
  addEventListener('resize', tops);
  scroll(() => {
    const c = scrollY + innerHeight / 2;
    stars.forEach(s => { if (s.speed) s.el.style.translate = `0 ${((s.y! - c) * -s.speed).toFixed(1)}px`; });
  });
}
