import STROKES from '../data/intro_paths.json';
import { $, $$, reduce } from './dom';

declare global { interface Window { __gjIntro?: boolean } }

/* Intro: el logo se dibuja solo siguiendo las líneas del arte y el título se escribe letra por letra.
   Los paths de la máscara y los spans de cada letra ya vienen renderizados desde Hero.astro;
   la clase html.intro (puesta por el script inline del <head>) los oculta hasta que arrancan. */
export function initIntro(onDone: () => void) {
  window.__gjIntro = true;
  const root = document.documentElement;
  const paths = $$<SVGPathElement>('[data-strokes] path');
  const chars = $$('[data-type] .ch');
  const istars = $$('.istar');
  const skipB = $('[data-skip]');
  const data = STROKES as [string, number, number][];
  const T_TITLE = 1.45, T_END = T_TITLE + chars.length * 0.03 + 0.35, T_STAR = [1.0, 1.12, 1.24];
  let done = false, t0 = 0;

  function finish() {
    if (done) return;
    done = true;
    paths.forEach(p => { p.style.strokeDashoffset = '0'; });
    chars.forEach(c => c.classList.add('on'));
    istars.forEach(st => st.classList.add('on'));
    root.classList.remove('intro');
    (['wheel', 'touchstart', 'keydown'] as const).forEach(ev => removeEventListener(ev, skipFromInput));
    onDone();
  }

  const ease = (x: number) => x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
  function tick(now: number) {
    if (done) return;
    const t = (now - t0) / 1000;
    data.forEach(([, st, du], i) => { const k = Math.min(1, Math.max(0, (t - st) / du)); paths[i].style.strokeDashoffset = (1 - ease(k)).toFixed(4); });
    chars.forEach((c, i) => { if (t >= T_TITLE + i * 0.03) c.classList.add('on'); });
    istars.forEach((st, i) => { if (t >= T_STAR[i]) st.classList.add('on'); });
    if (t >= T_END) finish(); else requestAnimationFrame(tick);
  }

  function skipFromInput(e: Event) {
    if (e.type === 'keydown' && !['Escape', ' ', 'Enter', 'ArrowDown', 'PageDown'].includes((e as KeyboardEvent).key)) return;
    finish();
  }

  if (reduce || !root.classList.contains('intro')) { finish(); return; }
  scrollTo(0, 0);
  skipB.addEventListener('click', finish);
  (['wheel', 'touchstart', 'keydown'] as const).forEach(ev => addEventListener(ev, skipFromInput, { passive: true }));
  const go = () => { t0 = performance.now(); requestAnimationFrame(tick); };
  const img = new Image();
  img.src = '/img/logo.png';
  Promise.race([img.decode().catch(() => {}), new Promise(r => setTimeout(r, 1500))]).then(() => setTimeout(go, 150));
}
