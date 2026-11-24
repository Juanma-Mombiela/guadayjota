import { scroll } from 'motion';
import { clamp, setSeed, SH } from './hand';

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
export const NS = 'http://www.w3.org/2000/svg';
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

type Offset = [string, string];

/** Dibuja los trazos de un SVG sincronizados con el scroll (paths con pathLength=1; textos por opacidad). */
export function drawWith(svg: SVGSVGElement, target: Element, offset: Offset = ['start 0.85', 'center 0.5']) {
  const items = $$<SVGPathElement | SVGTextElement>('path,text', svg);
  items.forEach(el => {
    if (el.tagName === 'path') { el.style.strokeDasharray = '1'; el.style.strokeDashoffset = '1'; }
    else el.style.opacity = '0';
  });
  const set = (p: number) => items.forEach((el, i) => {
    const s = i / items.length * 0.65, k = clamp((p - s) / 0.35);
    if (el.tagName === 'path') el.style.strokeDashoffset = (1 - k).toFixed(3);
    else el.style.opacity = k.toFixed(2);
  });
  if (!reduce) scroll(set, { target, offset: offset as any });
  else set(1);
}

/** Marco rectangular a mano ajustado al tamaño del elemento. */
export function frame(el: Element, svg: SVGSVGElement, path: SVGPathElement) {
  const r = el.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  setSeed(r.width | 0);
  path.setAttribute('d', SH.rect(r.width, r.height));
  path.setAttribute('pathLength', '1');
}
