# Brief: web de invitación · Guada & Jota

Brief para construir con Claude Code la web de invitación al casamiento de Guada y Jota. El prototipo navegable es el artifact **"Guada & Jota se casan"** (claude.ai), con estos archivos: `index.html`, `motion.js` e `img/`. Bajalo y guardalo en `reference/`: es la referencia visual y de comportamiento. Este documento manda donde haya diferencias. Los prototipos anteriores (personajes animados, landings, pradera) quedaron **descartados**: no hay dibujos animados.

> **Antes de arrancar, confirmar:** el arte del logo dice "26 febrero 2027" pero la fecha del evento es el 27. Ver la sección 12.

---

## 1. Qué es

Una web de una sola página que se manda por WhatsApp con un link personalizado por invitado. Al entrar, el invitado ve la invitación, recorre una historia con animaciones atadas al scroll y confirma si va o no. Las respuestas van a Google Sheets.

- Público: los invitados "de antes de las 12" (cena + fiesta desde las 18 hs). Los invitados "de después de las 12" van a tener un banner aparte más adelante; **fuera de alcance**, pero dejar el modelo de datos preparado (campo `tipo`).
- La mayoría la va a abrir **desde el navegador interno de WhatsApp en el celular**. Es mobile-first de verdad.

## 2. Datos fijos (no inventar nada fuera de esto)

| Dato | Valor |
|---|---|
| Nombres | Guada & Jota (siempre en ese orden) |
| Fecha y hora | Sábado 27 de febrero de 2027, 18 hs (America/Argentina/Buenos_Aires) |
| Lugar | **Cantilo al Medio** (centro cultural) · Cantilo 1011, B1896 City Bell · coords −34.8750958, −58.0489982 · https://maps.app.goo.gl/da3NadyBphEGpmwE7 |
| Dress code | Elegante y canchero |
| Regalos | Solo alias. Placeholder `GUADA.JOTA.CASORIO` hasta tener el real |
| Confirmar antes de | 15 de enero de 2027 |
| Música | **No.** Sin audio de ningún tipo |

**Prohibido mencionar:**
- La ceremonia. Hay una a las 18 hs pero es **sorpresa**. Se puede insinuar ("llegá a horario: a las 18 pasa algo que no te querés perder") sin decir qué.
- El civil (es el día anterior).
- Historia de la pareja, hitos o anécdotas. No quieren contar cómo se conocieron.

## 3. Tono

- **Elegante y canchero, humor nivel 2 de 3:** guiños en los textos, no chistes en cada línea. Español rioplatense con voseo.
- El botón "No" del formulario **no se puede tocar**: se escapa.

## 4. Identidad visual: lineal

Una sola tinta roja sobre papel, como el logo de los corazones con G y J. Las fotos van en blanco y negro, "intervenidas" con dibujos rojos a mano: coronas, flechas, estrellas, corazones, globos de diálogo y textos manuscritos. Referencia del estilo de intervención: pin "Ideas creativas de arte con cámara" (foto B&N + garabatos encima), pero en monocromo rojo.

```css
--ink:#B3000C;   /* tinta roja (sampleada del logo) */
--paper:#FBF9F5; /* fondo */
--text:#1D1A18;  /* texto */
--soft:#6D6560;  /* notas */
```

- Nada de otros colores. Las fotos van en escala de grises con un poco más de contraste (`autocontrast` + contraste ×1.12).
- **Tipografía:**
  - **Shantell Sans** (Google Fonts; 600/800, itálica): títulos, etiquetas manuscritas, números grandes y los textos dentro de las fotos.
  - **DM Sans** 400–600: texto corrido.
- **Logo:** `img/logo.png`, el arte "tatoos" en PNG transparente, recortado a 800 px.
- Estrellas, corazones y rulos dibujados por código con trazo de 2.4–2.6 px, `stroke-linecap: round` y un temblor leve (jitter) para que parezcan a mano.

## 5. Stack

- **Astro** (salida estática) + TypeScript. Sin framework de UI: componentes `.astro` y JS vanilla.
- **Motion** (motion.dev, `npm i motion`, API vanilla: `scroll`, `animate`, `inView`, `stagger`). `scroll()` maneja el dibujado de los trazos y del hilo; `animate` + `inView` maneja las entradas con spring.
- Scroll nativo. CSS propio con custom properties.
- Deploy en **Vercel**. Dominio pendiente.
- Confirmaciones: **Google Apps Script** sobre la planilla (sección 9).

## 6. Estructura del proyecto

```
src/
  pages/index.astro
  components/ Hero, PhotoDoodle, Countdown, Map, Alias, Rsvp, Footer, FloatingPets
  scripts/
    hand.ts        (generadores de trazos: ellipse, crown, heart, star, arrow, bubble, sun, rect + smooth Catmull-Rom)
    doodles.ts     (intervenciones por foto, en coordenadas 300×400)
    thread.ts      (hilo rojo)
    rsvp.ts, guest.ts, countdown.ts, pets.ts
  styles/tokens.css, base.css
public/img/ logo.png, burrata.png, gatito.png, estrella-a/b/c.png, fiesta.jpg, patio.jpg, mascarillas.jpg, paseo.jpg, ascensor.jpg, guada-flores.jpg, jota-flores.jpg, anillo.jpg, espejo.jpg
public/og.jpg
reference/  (prototipo)
```

## 7. Fotos intervenidas y gato

### Fotos (todas en 3:4, `object-fit: cover`, B&N)

| Archivo | Dónde va | Intervención |
|---|---|---|
| fiesta.jpg (recorte 3:4 de una foto horizontal, centrado en las caras) | "Es en serio" (al lado del texto) | coronas sobre las dos cabezas, corazón entre las coronas, estrellas cerca de las luces, "¡nos casamos!" sobre el vestido negro |
| patio.jpg (foto analógica retocada: se borró a una persona del fondo; recorte 3:4) | Galería (1.ª) | coronas sobre los dos · "lo juramos" arriba, sobre la pared blanca · corazón entre los dos · estrellas, una junto a la mano en alto de Guada |
| mascarillas.jpg (recorte 3:4 centrado) | Galería (2.ª) | "skincare pre-boda" + flecha a Jota · círculo en su cara · estrellas |
| anillo.jpg (selfie en la selfie del anillo; recorte 3:4) | Galería, **última** y más grande | "¡dijo que sí!" abajo a la izquierda, sobre la remera blanca · flecha al anillo · círculo alrededor del anillo · destellos |
| paseo.jpg (selfie en la calle; recorte **cuadrado** 1:1, `.pic` con aspect-ratio 1/1) | Galería, debajo de patio/mascarillas | corona sobre Guada · círculo en sus anteojos · "facha" + flecha · estrellas, corazón |
| ascensor.jpg (3:4) | Galería, al lado de paseo | "Jota ×2" con flechas a sus dos reflejos · "la fotógrafa" + flecha a Guada · estrellas, corazón |
| guada-flores.jpg + jota-flores.jpg | Galería (par) | "ella" + flecha y círculo al sombrero · "él" + flecha y corona |
| espejo.jpg | Dress code | "elegante" → flecha al vestido de Guada · "canchero" → flecha al traje de Jota |

- Los textos dibujados llevan un halo color papel (`paint-order: stroke`, 5 px) para leerse sobre fondos oscuros.
- Cada intervención es un SVG `viewBox="0 0 300 400"` con `preserveAspectRatio="xMidYMid slice"` encima de la foto. Las coordenadas están en `DOODLES` del prototipo.
- **Se dibujan con el scroll:** cada `path` lleva `pathLength=1` y su `stroke-dashoffset` va de 1 a 0, en secuencia, entre `start 0.85` y `center 0.5` de la foto. Los textos aparecen con opacidad en su turno.
- Si cambian las fotos, hay que reubicar las coordenadas mirando cada una.

### Burrata y el gatito: caritas flotantes (sin cursor custom)

Archivos: `img/burrata.png` (cara de Burrata) e `img/gatito.png` (cara del gatito gris y blanco, recortada con contorno suave y orejas en punta). Ambos son PNG transparentes de ~160 px.

- **No hay cursor personalizado:** el mouse es el normal del sistema.
- **En desktop y en mobile**, las dos caritas **flotan** por la pantalla como globos:
  - `position: fixed`, `pointer-events: none`, ancho `clamp(56px, 6vw, 78px)` con sombra suave.
  - Cada una sigue un recorrido de senos sumados con su propia fase: Burrata se mueve más por la izquierda (centro en x 0.30) y el gatito más por la derecha (centro en x 0.70), así casi nunca se superponen.
  - Se balancean (±10°) y se inclinan según la velocidad del scroll, en direcciones opuestas.
  - Cuando el "No" del formulario se escapa, se sacuden las dos.
  - Con `prefers-reduced-motion` quedan quietas en las esquinas inferiores.

## 8. Recorrido y animaciones

1. **Hero con intro animada (~2.4 s):** el logo **se dibuja solo** siguiendo las líneas reales del arte.
   - **Secuencia (segundos):**
     - los corazones y el rulo, de 0.1 a 1.15;
     - la G y la J, de 1.0 a 1.36;
     - "FEBRERO 2027", de 1.25 a 1.67.
   - **Las 3 estrellas NO se dibujan, aparecen:** pop con spring (scale 0 → 1, rotate −70° → 0) en 1.0, 1.12 y 1.24 s. Son imágenes aparte (`img/intro-star0..2.png`), recortadas del logo y ubicadas en sus coordenadas exactas dentro del SVG (`transform-box: fill-box`).
   - **Título:** "Guada & Jota se casan" se escribe letra por letra desde 1.45 s, a 30 ms por letra, con rebote. Cada **palabra** va en un span con `white-space: nowrap`, así nunca se corta una palabra (por ejemplo "Jota") en mobile; si no entra, baja la palabra entera. Después aparecen la fecha y "bajá ↓".
   - **Técnica:** `<svg viewBox="0 0 800 900">` con `<image href="img/logo.png" mask="url(#logoMask)">`. La máscara tiene 63 paths blancos de 24 px que se revelan con `stroke-dashoffset` (`pathLength=1`). Los datos están en `reference/intro_paths.json` como `[d, inicio, duración]`; salen de esqueletizar el PNG.
   - **Mientras dura:** el scroll queda bloqueado y el hilo rojo, oculto. "saltar", un toque, la rueda o una tecla terminan la intro. Con `prefers-reduced-motion` no hay intro.
2. **Es en serio:** foto de la fiesta bajo la carpa + texto.
3. **El día:** "27.02.27" gigante en rojo · "Sábado, 18 hs" · texto · cuenta regresiva.
4. **Galería ("Mirá, es verdad"), en este orden:** patio, mascarillas, paseo, ascensor, el par del aeropuerto y, al final, la selfie del anillo. Disposición: galería asimétrica de 12 columnas (en mobile, 1 columna y el par del aeropuerto lado a lado).
5. **Dónde:** dos columnas (una en mobile).
   - **Izquierda:** "Cantilo al Medio", la dirección y tres acciones:
     - **Cómo llegar:** `https://www.google.com/maps/dir/?api=1&destination=Cantilo%20al%20Medio%2C%20Cantilo%201011%2C%20City%20Bell`;
     - **Waze:** `https://waze.com/ul?ll=-34.8750958,-58.0489982&navigate=yes`;
     - **Copiar dirección:** copia "Cantilo 1011, City Bell, Buenos Aires".
   - **Derecha:** un mapa **dibujado a mano**, orientativo, que se dibuja con el scroll.
     - Calles: Cantilo, 473 bis y 474 en diagonal, cruzadas por 14 C, 15 y Sarmiento, más la plaza.
     - El lugar está marcado con un corazón en un círculo sobre Cantilo, entre 14 C y 15, con "¡acá!" y una flecha.
     - Todo el mapa es un link al pin de Google Maps.
   - En producción se puede sumar un iframe de Google Maps embebido debajo, pero el mapa dibujado queda como principal.
6. **Dress code:** foto del espejo + texto.
7. **Regalos:** alias dentro de un recuadro a mano que se dibuja + Copiar.
8. **Confirmación:** tarjeta con marco a mano que se dibuja.
9. **Cierre:** logo chico · "Nos vemos el 27".

**El hilo rojo (la animación que acompaña el scroll):**
- Es un solo SVG absoluto detrás del contenido, con la altura de toda la página. Baja por los márgenes, alternando derecha e izquierda en cada sección, y cruza entre secciones haciendo un rulo.
- Se dibuja hasta la altura del 62% del viewport, con un punto rojo en la punta.
- Se recalcula con ResizeObserver y cuando terminan de cargar las fuentes.

**Entradas:** los títulos y textos con `data-in` entran con `inView` + spring (y 28 → 0).

**Estrellas del logo por todo el sitio** (`img/estrella-a.png`, `estrella-b.png` y `estrella-c.png`: las 3 estrellas recortadas del arte del logo):
- **Dónde van:**
  - 2 por sección grandes y suaves de fondo (110–190 px, opacidad .16), repartidas detrás del contenido;
  - 3–5 por sección en los márgenes izquierdo y derecho, entre 36 y 86 px (×0.6 en mobile). Nunca en columna al centro;
  - 1–2 en las esquinas de cada foto, medio afuera y por encima de la foto;
  - una arriba de los títulos, en secciones alternadas.
- Siempre detrás del texto (`z-index: 0`; el contenido va en `z-index: 1`).
- **Cómo se mueven:**
  - aparecen con un pop (spring, scale 0 → 1, rotate −60° → 0) cuando entran en pantalla;
  - después se balancean sin parar con CSS (±9°, de 3 a 6 s);
  - las de los márgenes tienen un parallax leve con el scroll (`translate` según su distancia al centro × 0.04–0.16).
- Posiciones con semilla fija, para que siempre queden igual.

## 9. Confirmación de asistencia (lo más importante)

### Link personalizado
- URL: `https://<dominio>/?i=<slug>`. El slug es nombre + 4 caracteres al azar (`marta-k7q2`) para que no se pueda adivinar.
- Al cargar: `GET <APPS_SCRIPT_URL>?i=<slug>` → `{ok, nombre, cupos, tipo, respuesta?}`. Mientras carga, saludo genérico; si el slug no existe, invitación genérica sin formulario y con el mensaje "Este link no es tuyo. Pedile el tuyo a Guada o a Jota".
- Si ya respondió, mostrar directo el paso 3 con la opción "Cambiar respuesta".

### Flujo
1. "Hola, {nombre}" · **¿Venís?** · "Tenés {cupos} lugares reservados. Confirmá antes del 15 de enero."
   - **Sí, obvio** (botón rojo lleno).
   - **No**: se escapa a una posición al azar dentro del área con `pointerenter`, `pointerdown`, `focus` y `click`, sin superponerse con "Sí". Cada escape cambia el texto de abajo ("El gato dice que no.", "Ese botón está de adorno.", "Casi.", "Nop.", "Ni lo intentes.", "Probá con el rojo.", "¿Seguro? Pensalo.") y las caritas de los gatos se sacuden. Tiene que funcionar igual con el dedo en el celular.
   - Hay que responder sí o sí para seguir: no hay manera de salir del paso 1 sin elegir.
2. **¿Cuántos vienen?** (botones de 1 a `cupos`) + **¿Qué tema no puede faltar?** (texto, opcional, 120 caracteres como máximo) → Confirmar.
3. Al guardar OK: "Listo. Te esperamos el 27." + resumen ("Confirmaste 2 lugares. Tema pedido: X. El DJ ya está avisado.").
- Errores de red: reintentar una vez y si falla mostrar "No pudimos guardar tu respuesta. Probá de nuevo o mandale un WhatsApp a Jota". **Nunca** mostrar éxito si no se guardó.
- Después del 15 de enero, el formulario sigue abierto pero con el aviso "Ya pasó la fecha, igual avisanos".

> Nota: con el "No" bloqueado, la planilla solo va a recibir "sí". Si alguien no puede ir, se lo va a decir por WhatsApp. Es una decisión de ellos y está bien así.

### Planilla (Google Sheets)

Pestaña **Invitados**: `slug | nombre_mostrar | cupos | tipo (cena|fiesta) | telefono | notas`
Pestaña **Respuestas**: `timestamp | slug | nombre_mostrar | asiste | cantidad | tema | user_agent` (upsert por slug: una fila por invitado, la última respuesta gana).

### Apps Script (Extensiones → Apps Script, implementar como app web, acceso: "Cualquier usuario")

```js
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
```

Desde la web: el `POST` va con `Content-Type: text/plain;charset=utf-8` y el body `JSON.stringify({...})` para evitar el preflight de CORS. La URL del script va en `PUBLIC_RSVP_URL` (variable de entorno de Vercel).

Bonus a evaluar: un script local `scripts/links.ts` que lea un CSV exportado de Invitados y genere los mensajes de WhatsApp con el link de cada uno.

## 10. Textos

- Hero: "Guada & Jota se casan" · "Sábado 27 de febrero de 2027 · 18 hs" · "bajá ↓"
- Intro: "sí, leíste bien" · "Es en serio." · "Nos casamos y queremos que estés. Bajá despacio que te contamos todo."
- El día: "27.02.27" · "Sábado, 18 hs" · "Llegá a horario. A las 18 pasa algo que no te querés perder, y no te vamos a decir qué."
- Galería: "por si todavía no nos creés" · **"Mirá, es verdad"** · sin epígrafes debajo de las fotos (los textos van dibujados encima)
- Dónde: "Cantilo al Medio" · "Cantilo 1011, City Bell" · botones [Cómo llegar] [Waze] [Copiar dirección] · "tocá el mapa para abrirlo"
- Dress code: "Elegante y canchero" · "Lo mejor de tu placard, pero que se pueda bailar. Los colores están más que invitados; el blanco se lo dejamos a Guada."
- Regalos: "Lo más importante es que vengas" · "Pero si querés hacernos un regalo, dejamos este alias." · [Copiar alias → "¡Copiado!"]
- Cierre: "Nos vemos el 27" · "Traé ganas de bailar. Nosotros ponemos el resto."

## 11. Calidad

- **Celular primero:** probar en iOS Safari, en Chrome Android y en el navegador interno de WhatsApp (iOS y Android). Usar `100svh` para el escenario (la barra del navegador cambia de alto). Fotos servidas en WebP/AVIF con `srcset` (en el prototipo son JPG de 1200 px de alto).
- Lighthouse mobile: Performance ≥ 85 y Accessibility ≥ 95. Fotos en WebP de 1600 px de lado largo, < 250 KB cada una, con `loading="lazy"` salvo la primera.
- `prefers-reduced-motion`: los trazos aparecen completos, sin dibujarse; sin springs ni lluvia de estrellas. Las caritas de los gatos quedan quietas en las esquinas.
- Sin JS, se lee la invitación completa (sin formulario).
- Áreas táctiles de 44 px como mínimo y focus visible. El "No" que se escapa es un chiste visual: el formulario se completa entero con teclado eligiendo "Sí".
- **Vista previa en WhatsApp:** `og:title` "Guada & Jota se casan", `og:description` "Sábado 27 de febrero de 2027 · 18 hs", `og:image` 1200×630 con el logo en rojo sobre papel. Es lo primero que ve cada invitado.
- `<html lang="es-AR">`, favicon "G&J".
- Cuenta regresiva a `2027-02-27T18:00:00-03:00`; a partir de ahí, "¡Es hoy!".

## 12. Pendientes (pedir a Guada y Jota)

- [ ] **Fecha:** una versión del logo dice "26 febrero 2027"; la invitación usa el 27 (sábado, 18 hs). Usar el logo que dice solo "FEBRERO 2027" o confirmar.
- [ ] ¿Van más fotos? Hoy son 9 (fiesta, patio, mascarillas, paseo, ascensor, aeropuerto ×2, playa, espejo)
- [ ] Alias real
- [ ] Dominio
- [ ] ID de la planilla + carga de la pestaña Invitados (slug, nombre, cupos)
- [ ] Teléfono de Jota para el mensaje de error
