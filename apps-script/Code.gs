/**
 * Confirmaciones · Guada & Jota
 *
 * 1. En la planilla: pestañas "Invitados" (slug | nombre_mostrar | cupos | tipo | telefono | notas)
 *    y "Respuestas" (timestamp | slug | nombre_mostrar | asiste | cantidad | tema | user_agent).
 * 2. Extensiones → Apps Script → pegar este archivo y reemplazar SHEET_ID.
 * 3. Implementar → Nueva implementación → App web · Ejecutar como: yo · Acceso: Cualquier usuario.
 * 4. Copiar la URL (termina en /exec) en PUBLIC_RSVP_URL (.env local y variables de entorno de Vercel).
 */
const SHEET_ID = 'PEGAR_ID';
const ss = () => SpreadsheetApp.openById(SHEET_ID);
const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function findRow(sheet, slug) {
  const v = sheet.getDataRange().getValues();
  for (let r = 1; r < v.length; r++) if (String(v[r][0]).trim() === slug) return { row: r + 1, vals: v[r] };
  return null;
}

function doGet(e) {
  const slug = String(e.parameter.i || '').trim().toLowerCase();
  const inv = findRow(ss().getSheetByName('Invitados'), slug);
  if (!inv) return json({ ok: false });
  const res = ss().getSheetByName('Respuestas');
  const prev = findRow(res, slug);
  return json({
    ok: true, nombre: inv.vals[1], cupos: Number(inv.vals[2]) || 1, tipo: inv.vals[3] || 'cena',
    respuesta: prev ? { asiste: prev.vals[3], cantidad: prev.vals[4], tema: prev.vals[5] } : null
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const slug = String(d.slug || '').trim().toLowerCase();
    const inv = findRow(ss().getSheetByName('Invitados'), slug);
    if (!inv) return json({ ok: false, error: 'slug' });
    const cupos = Number(inv.vals[2]) || 1;
    const cantidad = Math.max(1, Math.min(cupos, Number(d.cantidad) || 1));
    const tema = String(d.tema || '').slice(0, 120);
    const row = [new Date(), slug, inv.vals[1], 'si', cantidad, tema, String(d.ua || '').slice(0, 200)];
    const res = ss().getSheetByName('Respuestas');
    const prev = findRow(res, slug);
    if (prev) res.getRange(prev.row, 1, 1, row.length).setValues([row]); else res.appendRow(row);
    return json({ ok: true });
  } finally { lock.releaseLock(); }
}
