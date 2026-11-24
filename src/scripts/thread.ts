import { scroll } from 'motion';
import { setSeed, rnd, jit, smooth, bezierSegments, type Pt } from './hand';
import { $, $$ } from './dom';

/* El hilo rojo: un solo SVG detrás del contenido que baja por los márgenes y cruza con un rulo entre secciones. */
export function initThread() {
  const main = $('#main'), thread = $<SVGSVGElement>('#thread'), tp = $<SVGPathElement>('#threadPath'), tip = $<SVGCircleElement>('#tip');
  let samples: [number, number, number][] = [], total = 1;

  function build() {
    const W = main.clientWidth, H = main.scrollHeight;
    thread.setAttribute('width', String(W)); thread.setAttribute('height', String(H));
    thread.style.height = H + 'px';
    thread.setAttribute('viewBox', `0 0 ${W} ${H}`);
    setSeed(3);
    const g = Math.max(12, Math.min(W * 0.035, 48)), secs = $$('#main>section:not([hidden]), #main>footer');
    const hero = $('.hero');
    const P: Pt[] = [[W / 2, hero.offsetTop + hero.offsetHeight - 40]];
    let right = true;
    secs.forEach((s, i) => {
      const top = s.offsetTop, bot = top + s.offsetHeight, x = right ? W - g : g;
      P.push([x + jit(6), top + 40]); P.push([x + jit(10), (top + bot) / 2]); P.push([x + jit(6), bot - 60]);
      if (i < secs.length - 1) { // cruce con rulo
        const cy = bot - 10, cx = W * (0.35 + rnd() * 0.3), r = 18 + rnd() * 10, dir = right ? -1 : 1;
        P.push([cx - dir * r * 2.2, cy - r * 0.6]);
        for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + dir * (k / 8) * Math.PI * 2; P.push([cx + Math.cos(a) * r * dir * -1, cy + Math.sin(a) * r]); }
        P.push([cx + dir * r * 2.4, cy + r * 0.5]);
        right = !right;
      }
    });
    const last = P[P.length - 1];
    P.push([W / 2, last[1] + 30]);
    tp.setAttribute('d', smooth(P));
    // muestreo propio de las curvas (getPointAtLength en un path tan largo tarda segundos)
    samples = [];
    let len = 0, prev: Pt = P[0];
    samples.push([0, prev[0], prev[1]]);
    for (const [a, b, c, e] of bezierSegments(P)) {
      const steps = Math.max(4, Math.ceil(Math.hypot(e[0] - a[0], e[1] - a[1]) / 3));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * e[0];
        const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * e[1];
        len += Math.hypot(x - prev[0], y - prev[1]);
        prev = [x, y];
        samples.push([len, x, y]);
      }
    }
    total = tp.getTotalLength();
    // ajusta el largo aproximado al real del navegador
    const k = total / (len || 1);
    samples.forEach(s => { s[0] *= k; });
    tp.style.strokeDasharray = String(total);
    draw();
  }

  // se dibuja hasta el 62% del viewport, con un punto en la punta
  function draw() {
    if (!samples.length) return;
    const target = scrollY - main.offsetTop + innerHeight * 0.62;
    let s = samples[0];
    for (const q of samples) { if (q[2] > target + 30) break; s = q; }
    tp.style.strokeDashoffset = (total - s[0]).toFixed(1);
    tip.setAttribute('cx', s[1].toFixed(1)); tip.setAttribute('cy', s[2].toFixed(1));
  }

  scroll(() => draw());
  return { build };
}
