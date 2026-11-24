import { defineConfig } from 'astro/config';

// Dominio público (para og:image absoluta). SITE_URL manda; si no, en Vercel se usa el dominio de producción.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercel ? `https://${vercel}` : undefined);

export default defineConfig({
  output: 'static',
  site,
  devToolbar: { enabled: false },
});
