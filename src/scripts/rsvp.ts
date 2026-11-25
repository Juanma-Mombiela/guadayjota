import { $, $$ } from './dom';
import { shakePets } from './pets';
import { loadGuest, saveRsvp, type Asiste, type Guest } from './guest';
import { applyTipo } from './tipo';

const DEADLINE = new Date('2027-01-16T00:00:00-03:00').getTime();
const QUIPS = ['Burrata no te lo permite.', 'Ese botón está de adorno.', 'Casi.', 'Nop.', 'Ni lo intentes.', 'Probá con el rojo.', '¿Seguro? Pensalo.'];
const ERROR_MSG = 'No pudimos guardar tu respuesta. Probá de nuevo o mandale un WhatsApp a Jota.';

export function initRsvp(onLayout: () => void) {
  const f = $<HTMLFormElement>('.rsvp');
  if (!f) return;
  const arena = $('.arena', f), no = $<HTMLButtonElement>('.no', f), yes = $<HTMLButtonElement>('.yes', f), quip = $('.quip', f);
  const decline = $<HTMLButtonElement>('[data-decline]', f), declineOk = $<HTMLButtonElement>('[data-decline-ok]', f);
  const seg = $('[data-seg]', f), tema = $<HTMLInputElement>('#tema', f);
  const submit = $<HTMLButtonElement>('[type=submit]', f), summary = $('[data-summary]', f), doneTitle = $('[data-done-title]', f);
  let guest: Guest | null = null, n = 1, q = 0, last = 0, busy = false;

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

  function writeSummary(asiste: Asiste, cantidad: number, t: string) {
    summary.textContent = '';
    if (asiste === 'no') {
      doneTitle.textContent = 'Te vamos a extrañar';
      summary.append('Avisaste que no podés venir. Si cambiás de idea, confirmá desde este mismo link.');
      return;
    }
    doneTitle.textContent = 'Te esperamos el 27';
    summary.append(`Confirmaste ${cantidad} ${cantidad > 1 ? 'lugares' : 'lugar'}.`);
    if (t) {
      summary.append(' Tema pedido: ');
      const b = document.createElement('b'); b.textContent = t;
      summary.append(b, '. El DJ ya está avisado.');
    }
  }

  /** Guarda la respuesta; solo muestra el "Listo" si se guardó de verdad. */
  async function send(asiste: Asiste, btn: HTMLButtonElement) {
    if (!guest || busy) return;
    busy = true;
    const err = $(`[data-err="${asiste}"]`, f);
    const cantidad = asiste === 'si' ? n : 0;
    const t = asiste === 'si' ? tema.value.trim().slice(0, 120) : '';
    err.textContent = '';
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Guardando…';
    const ok = await saveRsvp(guest.slug, asiste, cantidad, t);
    btn.disabled = false;
    btn.textContent = label;
    busy = false;
    if (!ok) { err.textContent = ERROR_MSG; onLayout(); return; }
    guest.respuesta = { asiste, cantidad, tema: t };
    writeSummary(asiste, cantidad, t);
    show('3');
  }

  yes.addEventListener('click', () => { if (!guest) return; show('2'); tema.focus(); });
  decline.addEventListener('click', () => { if (!guest) return; show('n'); declineOk.focus(); });
  $$('[data-back]', f).forEach(b => b.addEventListener('click', () => show('1')));
  $('[data-edit]', f).addEventListener('click', () => show('1'));
  declineOk.addEventListener('click', () => send('no', declineOk));
  f.addEventListener('submit', e => { e.preventDefault(); send('si', submit); });

  /* invitado */
  yes.disabled = decline.disabled = true;
  loadGuest().then(r => {
    if (r.status !== 'ok') {
      if (r.status === 'unknown') document.documentElement.classList.add('anon');
      $('[data-stranger]', f).textContent = r.status === 'unknown'
        ? 'Este link no es tuyo. Pedile el tuyo a Guada o a Jota.'
        : 'No pudimos cargar tu invitación. Recargá la página o mandale un WhatsApp a Jota.';
      show('x');
      return;
    }
    guest = r.guest;
    applyTipo(guest.tipo);
    $('[data-guest]', f).textContent = guest.nombre ? `, ${guest.nombre}` : '';
    // con un solo cupo es su invitación personal: sin la pregunta de cuántos vienen
    if (guest.cupos > 1) $('[data-cupos]', f).textContent = String(guest.cupos);
    else $('[data-reserva]', f).textContent = 'Tu lugar está reservado.';
    seg.closest<HTMLElement>('.field')!.hidden = guest.cupos === 1;
    const prev = guest.respuesta;
    n = prev && prev.asiste === 'si' ? Math.max(1, Math.min(guest.cupos, prev.cantidad)) : guest.cupos;
    buildSeg(guest.cupos);
    yes.disabled = decline.disabled = false;
    if (prev) {
      tema.value = prev.tema;
      writeSummary(prev.asiste, n, prev.tema);
      show('3');
    } else onLayout();
  });
}
