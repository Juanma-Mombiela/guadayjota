/**
 * Confirmaciones · Guada & Jota
 *
 * 1. En la planilla: pestañas "Invitados" (slug | nombre_mostrar | cupos | tipo | telefono | notas)
 *    y "Respuestas" (timestamp | slug | nombre_mostrar | asiste | cantidad | tema | user_agent).
 * 2. Desde la planilla: Extensiones → Apps Script → pegar este archivo (no hace falta tocar SHEET_ID).
 * 3. Implementar → Nueva implementación → App web · Ejecutar como: yo · Acceso: Cualquier usuario.
 * 4. Copiar la URL (termina en /exec) en PUBLIC_RSVP_URL (.env local y variables de entorno de Vercel).
 * 5. Links automáticos: en el editor de Apps Script elegir la función "generarLinks" y tocar Ejecutar
 *    (una sola vez, crea la pestaña Config y completa lo que ya haya). Desde ahí, cada nombre nuevo
 *    en Invitados genera solo su slug y su link. También queda el menú "Invitados" en la planilla.
 */
// Solo si el script NO se crea desde la planilla: pegar acá el ID que está en su URL.
const SHEET_ID = '';
const ss = () => SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
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
    const asiste = d.asiste === 'no' ? 'no' : 'si'; // "En serio, no puedo ir" manda 'no' con cantidad 0
    const cantidad = asiste === 'no' ? 0 : Math.max(1, Math.min(cupos, Number(d.cantidad) || 1));
    const tema = asiste === 'no' ? '' : String(d.tema || '').slice(0, 120);
    const row = [new Date(), slug, inv.vals[1], asiste, cantidad, tema, String(d.ua || '').slice(0, 200)];
    const res = ss().getSheetByName('Respuestas');
    const prev = findRow(res, slug);
    if (prev) res.getRange(prev.row, 1, 1, row.length).setValues([row]); else res.appendRow(row);
    return json({ ok: true });
  } finally { lock.releaseLock(); }
}

/* ---------- Links automáticos en la pestaña Invitados ----------
   Al escribir un nombre en nombre_mostrar: si falta, se genera el slug (fijo, no cambia más),
   cupos = 1 y tipo = cena por defecto, y en la columna "link" queda la URL completa.
   La URL base está en Config!B1: cuando tengan el dominio, se cambia ahí y se actualizan todos. */
const INV = 'Invitados', CONFIG = 'Config', BASE_URL_DEFAULT = 'http://localhost:4321/';
const COL = { slug: 1, nombre: 2, cupos: 3, tipo: 4, link: 7 };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Invitados').addItem('Generar slugs y links', 'generarLinks').addToUi();
}

function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== INV) return;
  const r0 = Math.max(2, e.range.getRow()), r1 = e.range.getLastRow();
  if (r1 >= r0) completar(sh, r0, r1);
}

/** Completa todas las filas (para correr a mano o desde el menú). */
function generarLinks() {
  const sh = ss().getSheetByName(INV), last = sh.getLastRow();
  prepararConfig();
  if (last >= 2) completar(sh, 2, last);
}

function prepararConfig() {
  if (ss().getSheetByName(CONFIG)) return;
  const c = ss().insertSheet(CONFIG);
  c.getRange('A1:B1').setValues([['URL del sitio', BASE_URL_DEFAULT]]);
  c.getRange('A2').setValue('Cambiá B1 por el dominio real cuando lo tengan (ej. https://…/). Todos los links se actualizan solos.');
  c.getRange('A1').setFontWeight('bold');
  c.setColumnWidth(1, 160); c.setColumnWidth(2, 320);
}

function completar(sh, r0, r1) {
  prepararConfig();
  const head = sh.getRange(1, COL.link);
  if (head.getValue() !== 'link') head.setValue('link').setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#B3000C');
  const last = Math.max(2, sh.getLastRow());
  const used = new Set(sh.getRange(2, COL.slug, last - 1, 1).getValues().map(r => String(r[0]).trim()).filter(Boolean));
  const vals = sh.getRange(r0, 1, r1 - r0 + 1, 4).getValues();
  vals.forEach((v, i) => {
    const row = r0 + i, nombre = String(v[COL.nombre - 1]).trim();
    if (!nombre) return;
    if (!String(v[COL.slug - 1]).trim()) {
      const s = nuevoSlug(nombre, used);
      used.add(s);
      sh.getRange(row, COL.slug).setValue(s);
    }
    if (v[COL.cupos - 1] === '') sh.getRange(row, COL.cupos).setValue(1);
    if (v[COL.tipo - 1] === '') sh.getRange(row, COL.tipo).setValue('cena');
    const link = sh.getRange(row, COL.link);
    if (!link.getFormula()) link.setFormula(`=IF(A${row}="","",REGEXREPLACE(${CONFIG}!$B$1,"/?$","/")&"?i="&A${row})`);
  });
}

/** "Tía Marta" → "tia-marta-k7q2" (4 caracteres al azar para que no se pueda adivinar). */
function nuevoSlug(nombre, used) {
  const base = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24).replace(/-+$/, '') || 'invitado';
  const A = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s;
  do { s = base + '-' + Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } while (used.has(s));
  return s;
}
