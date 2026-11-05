// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLinks from './src/plugins/remark-wiki-links.mjs';
import remarkBaseImages from './src/plugins/remark-base-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://demarchist.github.io',
  base: '/the-reliquary',
  markdown: {
    remarkPlugins: [remarkWikiLinks, remarkBaseImages],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
