import { clamp } from './hand';
import { $$, reduce } from './dom';

/* Burrata y el gatito flotan como globos: Burrata más por la izquierda, el gatito más por la derecha. */
const pets = () => $$('.pet');

export function shakePets() {
  pets().forEach(c => { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); });
}

export function initPets() {
  const els = pets();
  const P = [
    { cx: 0.3, ax: 0.22, fx: 0.21, cy: 0.55, ay: 0.28, fy: 0.16, ph: 0 },
    { cx: 0.7, ax: 0.22, fx: 0.18, cy: 0.45, ay: 0.28, fy: 0.14, ph: 2.1 },
  ];
  const t0 = performance.now();
  let vy = 0, lastY = scrollY;
  const fl = (now: number) => {
    const t = (now - t0) / 1000, W = innerWidth, H = innerHeight;
    vy += ((scrollY - lastY) - vy) * 0.08;
    lastY = scrollY;
    els.forEach((el, i) => {
      const p = P[i], w = el.offsetWidth || 64;
      if (reduce) { el.style.transform = `translate(${i ? W - w - 16 : 16}px,${H - w - 20}px)`; return; }
      const x = W * (p.cx + p.ax * Math.sin(t * p.fx + p.ph) + 0.04 * Math.sin(t * 0.9 + p.ph)) - w / 2;
      const y = H * (p.cy + p.ay * Math.sin(t * p.fy + 1.3 + p.ph) + 0.03 * Math.sin(t * 1.3 + p.ph)) - w / 2;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(Math.sin(t * 0.8 + p.ph) * 10 + clamp(vy, -30, 30) * 0.6 * (i ? -1 : 1)).toFixed(1)}deg)`;
    });
    if (!reduce) requestAnimationFrame(fl);
  };
  requestAnimationFrame(fl);
  if (reduce) addEventListener('resize', () => requestAnimationFrame(fl));
}
