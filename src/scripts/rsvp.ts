import { $, $$ } from './dom';
import { shakePets } from './pets';
import { loadGuest, saveRsvp, type Guest } from './guest';

const DEADLINE = new Date('2027-01-16T00:00:00-03:00').getTime();
const QUIPS = ['El gato dice que no.', 'Ese botón está de adorno.', 'Casi.', 'Nop.', 'Ni lo intentes.', 'Probá con el rojo.', '¿Seguro? Pensalo.'];
const ERROR_MSG = 'No pudimos guardar tu respuesta. Probá de nuevo o mandale un WhatsApp a Jota.';

export function initRsvp(onLayout: () => void) {
  const f = $<HTMLFormElement>('.rsvp');
  if (!f) return;
  const arena = $('.arena', f), no = $<HTMLButtonElement>('.no', f), yes = $<HTMLButtonElement>('.yes', f), quip = $('.quip', f);
  const seg = $('[data-seg]', f), tema = $<HTMLInputElement>('#tema', f), err = $('[data-err]', f);
  const submit = $<HTMLButtonElement>('[type=submit]', f), summary = $('[data-summary]', f);
  let guest: Guest | null = null, n = 1, q = 0, last = 0;

  const show = (k: string) => { $$('.step', f).forEach(s => s.classList.toggle('on', s.dataset.step === k)); onLayout(); };

  if (Date.now() >= DEADLINE) $('[data-late]', f).hidden = false;

  /* el "No" se escapa: mouse, dedo, foco y click */
  function flee(e?: Event) {
    if (e) e.preventDefault();
    const now = Date.now();
    if (now - last < 120) return;
    last = now;
    const A = arena.getBoundingClientRect(), B = no.getBoundingClientRect(), Y = yes.getBoundingClientRect();
    let x: number, y: number, t = 0;
    do { x = Math.random() * (A.width - B.width); y = Math.random() * (A.height - B.height - 44); t++; }
    while (t < 25 && x < Y.right - A.left + 12 && x + B.width > Y.left - A.left - 12 && y < Y.bottom - A.top + 12 && y + B.height > Y.top - A.top - 12);
    no.style.left = x + 'px'; no.style.top = y + 'px';
    quip.textContent = QUIPS[q++ % QUIPS.length];
    shakePets();
  }
  (['pointerenter', 'pointerdown', 'focus', 'click'] as const).forEach(ev => no.addEventListener(ev, flee));

  function buildSeg(cupos: number) {
    seg.innerHTML = Array.from({ length: cupos }, (_, i) => `<button type="button" aria-pressed="${i + 1 === n}">${i + 1}</button>`).join('');
    $$('button', seg).forEach((b, i) => b.addEventListener('click', () => {
      n = i + 1;
      $$('button', seg).forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
    }));
  }

  function writeSummary(cantidad: number, t: string) {
    summary.textContent = '';
    summary.append(`Confirmaste ${cantidad} ${cantidad > 1 ? 'lugares' : 'lugar'}.`);
    if (t) {
      summary.append(' Tema pedido: ');
      const b = document.createElement('b'); b.textContent = t;
      summary.append(b, '. El DJ ya está avisado.');
    }
  }

  yes.addEventListener('click', () => { if (!guest) return; show('2'); tema.focus(); });
  $('[data-back]', f).addEventListener('click', () => show('1'));
  $('[data-edit]', f).addEventListener('click', () => show('1'));

  f.addEventListener('submit', async e => {
    e.preventDefault();
    if (!guest || submit.disabled) return;
    const t = tema.value.trim().slice(0, 120);
    err.textContent = '';
    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'Guardando…';
    const ok = await saveRsvp(guest.slug, n, t);
    submit.disabled = false;
    submit.textContent = label;
    if (!ok) { err.textContent = ERROR_MSG; onLayout(); return; }
    guest.respuesta = { asiste: 'si', cantidad: n, tema: t };
    writeSummary(n, t);
    show('3');
  });

  /* invitado */
  yes.disabled = true;
  loadGuest().then(r => {
    if (r.status !== 'ok') {
      $('[data-demo]', f)?.remove();
      $('[data-stranger]', f).textContent = r.status === 'unknown'
        ? 'Este link no es tuyo. Pedile el tuyo a Guada o a Jota.'
        : 'No pudimos cargar tu invitación. Recargá la página o mandale un WhatsApp a Jota.';
      show('x');
      return;
    }
    guest = r.guest;
    document.documentElement.dataset.tipo = guest.tipo;
    $('[data-guest]', f).textContent = guest.nombre ? `, ${guest.nombre}` : '';
    $('[data-cupos]', f).textContent = String(guest.cupos);
    $('[data-lugares]', f).textContent = guest.cupos > 1 ? 'lugares reservados' : 'lugar reservado';
    n = guest.respuesta ? Math.min(guest.cupos, guest.respuesta.cantidad) : guest.cupos;
    buildSeg(guest.cupos);
    yes.disabled = false;
    if (guest.respuesta) {
      tema.value = guest.respuesta.tema;
      writeSummary(n, guest.respuesta.tema);
      show('3');
    } else onLayout();
  });
}
