import { animate, inView } from 'motion';
import { $, $$, reduce, drawWith, frame } from './dom';
import { initDoodles, initMap } from './doodles';
import { initThread } from './thread';
import { initIntro } from './intro';
import { initStars } from './stars';
import { initCountdown } from './countdown';
import { initPets } from './pets';
import { initRsvp } from './rsvp';

// El orden importa: los trazos comparten una semilla y así quedan iguales que en el prototipo.

/* fotos intervenidas y mapa */
initDoodles();
initMap();

/* marcos a mano (alias y formulario) */
const aliasBox = $('[data-alias]'), aliasSvg = $<SVGSVGElement>('svg', aliasBox), aliasPath = $<SVGPathElement>('path', aliasSvg);
const form = $('.rsvp'), fSvg = $<SVGSVGElement>('.frame', form), fPath = $<SVGPathElement>('path', fSvg);
const frames = () => { frame(aliasBox, aliasSvg, aliasPath); frame(form, fSvg, fPath); };
frames();
drawWith(aliasSvg, aliasBox, ['start 0.9', 'center 0.6']);
drawWith(fSvg, form, ['start 0.95', 'start 0.4']);

/* hilo rojo */
const thread = initThread();
let rT = 0;
const rebuild = () => { clearTimeout(rT); rT = window.setTimeout(() => { thread.build(); frames(); }, 120); };
new ResizeObserver(rebuild).observe($('#main'));
document.fonts?.ready.then(rebuild);
thread.build();

/* entradas */
if (!reduce) {
  $$('[data-in]').forEach(el => {
    el.style.opacity = '0';
    inView(el, () => { animate(el, { opacity: [0, 1], y: [28, 0] }, { type: 'spring', bounce: 0.25, duration: 0.8 }); }, { amount: 0.4 });
  });
}

/* intro del logo */
initIntro(rebuild);

/* estrellas del logo por todo el sitio */
initStars();

/* cuenta regresiva */
initCountdown();

/* copiar */
$$<HTMLButtonElement>('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const t = b.textContent;
  try { await navigator.clipboard.writeText(b.dataset.copy || ''); b.textContent = '¡Copiado!'; }
  catch { b.textContent = 'Copialo a mano'; }
  setTimeout(() => (b.textContent = t), 1600);
}));

/* Burrata y el gatito */
initPets();

/* confirmación */
initRsvp(frames);
