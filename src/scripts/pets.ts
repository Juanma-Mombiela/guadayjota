import { clamp, jit, setSeed } from './hand';
import { $, $$, NS, reduce } from './dom';

/* Burrata y el gatito flotan como globos: Burrata más por la izquierda, el gatito más por la derecha. */
const pets = () => $$('.pet');

/* Cara de enojados: ojos de cada foto en sus píxeles (centro y radio horizontal). */
type Eye = { x: number; y: number; r: number };
type Mark = { x: number; y: number; s: number; rot: number };
const FACES: { w: number; h: number; eyes: [Eye, Eye]; mark: Mark }[] = [
  { w: 160, h: 144, eyes: [{ x: 53, y: 78, r: 12 }, { x: 107, y: 81, r: 12 }], mark: { x: 131, y: 33, s: 14, rot: 12 } }, // Burrata
  { w: 160, h: 153, eyes: [{ x: 38, y: 94, r: 9 }, { x: 80, y: 115, r: 10 }], mark: { x: 124, y: 50, s: 13, rot: 20 } },  // gatito (cara inclinada)
];

/** Vena de enojo (💢): cuatro curvas, una por cuadrante, que se doblan hacia el centro y dejan una cruz hueca. */
function angerMark({ x, y, s, rot }: Mark): string[] {
  const g = s * 0.28, a = rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
  const T = (px: number, py: number) => `${(x + px * c - py * sn + jit(0.5)).toFixed(1)} ${(y + px * sn + py * c + jit(0.5)).toFixed(1)}`;
  return [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sx, sy]) =>
    `M${T(sx * g, sy * s)} Q${T(sx * g * 1.1, sy * g * 1.1)} ${T(sx * s, sy * g)}`);
}

/** Por ojo: una ceja recta encima (sin tapar el ojo), más baja del lado de la nariz. */
function angryPaths(eyes: [Eye, Eye]): string[] {
  const [a, b] = eyes, L = Math.hypot(b.x - a.x, b.y - a.y);
  const u = [(b.x - a.x) / L, (b.y - a.y) / L], up = [u[1], -u[0]];
  const d: string[] = [];
  eyes.forEach((e, i) => {
    const s = i ? -1 : 1; // hacia la nariz
    const P = (along: number, rise: number) => [e.x + s * u[0] * along * e.r + up[0] * rise * e.r + jit(0.8), e.y + s * u[1] * along * e.r + up[1] * rise * e.r + jit(0.8)];
    const line = (p: number[], q: number[]) => `M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    d.push(line(P(-1.1, 1.6), P(1.0, 1.0)));      // ceja: una sola línea sobre el ojo, inclinada hacia la nariz
  });
  return d;
}

function buildAngry() {
  setSeed(7);
  pets().forEach((pet, i) => {
    const f = FACES[i];
    if (!f) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'angry-face');
    svg.setAttribute('viewBox', `0 0 ${f.w} ${f.h}`);
    svg.setAttribute('aria-hidden', 'true');
    const stroke = (d: string, k: number) =>
      `<path class="halo" d="${d}" pathLength="1" style="transition-delay:${k * 0.07}s"/><path class="ink" d="${d}" pathLength="1" style="transition-delay:${k * 0.07}s"/>`;
    const brows = angryPaths(f.eyes);
    // después de las cejas, la vena; el grupo late mientras dura el enojo
    svg.innerHTML = brows.map(stroke).join('') +
      `<g class="vein" style="transform-origin:${f.mark.x}px ${f.mark.y}px">${angerMark(f.mark).map((d, k) => stroke(d, brows.length + k * 0.6)).join('')}</g>`;
    $('.face', pet).appendChild(svg);
  });
}

let calm = 0;
export function shakePets() {
  pets().forEach(c => { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake', 'angry'); });
  clearTimeout(calm);
  calm = window.setTimeout(() => pets().forEach(c => c.classList.remove('angry')), 2500);
}

export function initPets() {
  buildAngry();
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
