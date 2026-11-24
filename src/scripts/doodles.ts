import { SH, setSeed, jit, smooth, type Pt, type ShapeName } from './hand';
import { $, $$, NS, drawWith } from './dom';

/* Intervenciones por foto, en coordenadas 300×400.
   ['text', x, y, texto, tamaño, rotación] o [forma, ...args de SH]. */
type Doodle = ['text', number, number, string, number, number] | [ShapeName, ...number[]];

export const DOODLES: Record<string, Doodle[]> = {
  fiesta: [['crown', 80, 70, 54, 30], ['crown', 162, 76, 58, 30], ['heart', 148, 34, 16], ['star', 26, 36, 12], ['star', 278, 40, 10], ['star', 276, 118, 8], ['text', 12, 352, '¡nos casamos!', 24, -6], ['star', 284, 205, 8]],
  paseo: [['crown', 172, 118, 56, 26], ['ellipse', 222, 178, 46, 22], ['text', 214, 268, 'facha', 26, -6], ['arrow', 236, 250, 232, 204, 16], ['star', 140, 92, 9], ['heart', 124, 238, 14], ['star', 284, 318, 10]],
  ascensor: [['text', 96, 66, 'Jota ×2', 26, -5], ['arrow', 140, 76, 166, 126, -14], ['arrow', 196, 70, 248, 108, 16], ['text', 6, 388, 'la fotógrafa', 20, -6], ['arrow', 44, 362, 44, 252, 14], ['star', 26, 140, 9], ['heart', 110, 190, 13], ['star', 284, 40, 10]],
  anillo: [['text', 14, 374, '¡dijo que sí!', 25, -5], ['arrow', 96, 348, 124, 234, -18], ['ellipse', 133, 212, 27, 17, 1.2], ['star', 98, 186, 8], ['star', 168, 236, 9], ['star', 284, 82, 10], ['heart', 22, 26, 13]],
  espejo: [['text', 14, 42, 'elegante', 22, -8], ['arrow', 46, 56, 84, 206, -26], ['text', 190, 352, 'canchero', 22, -6], ['arrow', 240, 330, 212, 232, -20], ['star', 270, 40, 10], ['heart', 160, 60, 12]],
  guadaFlores: [['text', 34, 44, 'ella', 28, -8], ['arrow', 72, 52, 112, 96, 18], ['ellipse', 156, 112, 58, 28], ['star', 58, 172, 10], ['star', 160, 182, 8], ['heart', 236, 168, 16]],
  patio: [['text', 148, 32, 'lo juramos', 24, -5], ['crown', 72, 94, 54, 28], ['crown', 194, 128, 46, 24], ['heart', 160, 212, 16], ['star', 264, 112, 9], ['star', 24, 62, 11], ['star', 282, 232, 8]],
  mascarillas: [['text', 140, 46, 'skincare pre-boda', 19, -6], ['arrow', 230, 60, 266, 186, -18], ['ellipse', 276, 232, 28, 34], ['star', 44, 58, 10], ['star', 118, 34, 7], ['heart', 236, 330, 14]],
  jotaFlores: [['text', 210, 42, 'él', 30, 8], ['arrow', 224, 56, 166, 82, -16], ['crown', 104, 80, 62, 32], ['star', 60, 196, 10], ['star', 152, 188, 8], ['heart', 68, 120, 14]],
};

function buildDoodle(fig: HTMLElement): SVGSVGElement | undefined {
  const def = DOODLES[fig.dataset.doodle || ''];
  if (!def) return;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 300 400');
  svg.setAttribute('class', 'doodle');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  def.forEach(([k, ...a]) => {
    if (k === 'text') {
      const [x, y, txt, size, rot] = a as [number, number, string, number, number];
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
      t.setAttribute('font-size', String(size));
      t.setAttribute('transform', `rotate(${rot} ${x} ${y})`);
      t.textContent = txt;
      svg.appendChild(t);
      return;
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', (SH[k] as (...n: number[]) => string)(...(a as number[])));
    p.setAttribute('pathLength', '1');
    svg.appendChild(p);
  });
  $('.pic', fig).appendChild(svg);
  return svg;
}

export function initDoodles() {
  setSeed(11);
  $$('[data-doodle]').forEach(f => { const s = buildDoodle(f); if (s) drawWith(s, f); });
}

/* Mapa dibujado: las calles alrededor de Cantilo al Medio (orientativo). */
export function initMap() {
  const link = $('[data-map]');
  if (!link) return;
  const svg = $<SVGSVGElement>('svg', link);
  setSeed(5);
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    const P: Pt[] = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; P.push([x1 + (x2 - x1) * t + jit(3), y1 + (y2 - y1) * t + jit(3)]); }
    return smooth(P);
  };
  // calles paralelas a Cantilo (horizontales en el grupo rotado) y transversales
  const par: [number, string][] = [[110, 'Cantilo'], [175, '473 bis'], [240, '474']];
  const tra: [number, string][] = [[150, '14 C'], [320, '15'], [470, 'Sarmiento']];
  let g = '';
  par.forEach(([y]) => g += `<path d="${line(-40, y, 640, y)}" pathLength="1"/>`);
  tra.forEach(([x]) => g += `<path d="${line(x, 10, x, 320)}" pathLength="1"/>`);
  SH.ellipse(60, 40, 34, 26, 1.05); // (era la plaza) se calcula igual para no mover el temblor del resto de los trazos
  g += `<path d="${SH.heart(238, 108, 30)}" pathLength="1"/><path d="${SH.ellipse(238, 112, 38, 34, 1.15)}" pathLength="1"/>`;
  g += `<path d="${SH.arrow(320, 40, 266, 86, -20)}" pathLength="1"/>`;
  par.forEach(([y, n]) => g += `<text x="${n === 'Cantilo' ? 400 : 520}" y="${y - 8}" font-size="${n === 'Cantilo' ? 22 : 17}">${n}</text>`);
  tra.forEach(([x, n]) => g += `<text x="${x + 8}" y="306" font-size="17">${n}</text>`);
  g += `<text x="326" y="40" font-size="24">¡acá!</text>`;
  svg.innerHTML = `<g transform="rotate(-24 300 170)">${g}</g>`;
  drawWith(svg, link, ['start 0.9', 'end 0.6']);
}
