import { $$ } from './dom';
import { setCountdownTarget } from './countdown';

/* Horario según el tipo de invitado de la planilla.
   cena: 18 hs (lo que ya viene en el HTML). fiesta: 23 hs y sin el aviso de la sorpresa de las 18:30. */
const HORARIOS = {
  cena: { hora: '18 hs', iso: '2027-02-27T18:00:00-03:00' },
  fiesta: { hora: '23 hs', iso: '2027-02-27T23:00:00-03:00' },
} as const;

export type Tipo = keyof typeof HORARIOS;

export function applyTipo(tipo: Tipo) {
  const h = HORARIOS[tipo];
  document.documentElement.dataset.tipo = tipo;
  $$('[data-hora]').forEach(el => { el.textContent = h.hora; });
  $$('[data-solo-cena]').forEach(el => { el.hidden = tipo !== 'cena'; });
  setCountdownTarget(h.iso);
}
