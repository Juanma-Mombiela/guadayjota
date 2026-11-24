interface ImportMetaEnv {
  /** URL de la app web de Google Apps Script. Si falta, el formulario corre en modo demo. */
  readonly PUBLIC_RSVP_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
