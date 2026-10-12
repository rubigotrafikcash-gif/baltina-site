// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Адрес сайта нужен для canonical, Open Graph и sitemap.xml.
// Пока домена нет, задаётся переменной окружения SITE_URL при сборке.
const site = process.env.SITE_URL || 'http://localhost:4321';
// Подпапка сайта, например /baltina-site для GitHub Pages. Для своего домена — '/'.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  compressHTML: true,
  integrations: [react(), sitemap()],
  build: {
    inlineStylesheets: 'always',
  },
});
