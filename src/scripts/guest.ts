/* Invitado del link personalizado (?i=<slug>) contra el Apps Script de la planilla.
   Sin PUBLIC_RSVP_URL corre en modo demo: invitado de prueba y no se manda nada. */

export type Respuesta = { asiste: string; cantidad: number; tema: string };
export type Guest = { slug: string; nombre: string; cupos: number; tipo: 'cena' | 'fiesta'; respuesta: Respuesta | null };
export type GuestResult =
  | { status: 'ok'; guest: Guest }
  | { status: 'unknown' }
  | { status: 'error' };

const RSVP_URL = (import.meta.env.PUBLIC_RSVP_URL || '').trim();
export const DEMO = !RSVP_URL;

const DEMO_GUEST: Guest = { slug: 'demo', nombre: 'Tía Marta', cupos: 2, tipo: 'cena', respuesta: null };

export const slugFromUrl = () => (new URLSearchParams(location.search).get('i') || '').trim().toLowerCase();

/** Hace el request y, si falla la red o la respuesta no es JSON, reintenta una vez. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); }
  catch { await new Promise(r => setTimeout(r, 700)); return fn(); }
}

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { redirect: 'follow', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function loadGuest(): Promise<GuestResult> {
  if (DEMO) return { status: 'ok', guest: { ...DEMO_GUEST } };
  const slug = slugFromUrl();
  if (!slug) return { status: 'unknown' };
  try {
    const d = await withRetry(() => getJson(`${RSVP_URL}?i=${encodeURIComponent(slug)}`));
    if (!d || !d.ok) return { status: 'unknown' };
    return {
      status: 'ok',
      guest: {
        slug,
        nombre: String(d.nombre || ''),
        cupos: Math.max(1, Number(d.cupos) || 1),
        tipo: d.tipo === 'fiesta' ? 'fiesta' : 'cena',
        respuesta: d.respuesta ? { asiste: String(d.respuesta.asiste || ''), cantidad: Number(d.respuesta.cantidad) || 1, tema: String(d.respuesta.tema || '') } : null,
      },
    };
  } catch {
    return { status: 'error' };
  }
}

/** Guarda la respuesta. Devuelve true solo si el script confirmó que la guardó. */
export async function saveRsvp(slug: string, cantidad: number, tema: string): Promise<boolean> {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return true; }
  try {
    const d = await withRetry(() => getJson(RSVP_URL, {
      method: 'POST',
      // text/plain evita el preflight de CORS contra Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ slug, cantidad, tema, ua: navigator.userAgent }),
    }).then(r => { if (!r || !r.ok) throw new Error('not saved'); return r; }));
    return !!d.ok;
  } catch {
    return false;
  }
}
