import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://sol.igroza.su';

async function prerender() {
  const vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
  });

  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');

    const distIndexPath = path.resolve(__dirname, 'dist/index.html');
    const template = await readFile(distIndexPath, 'utf-8');

    if (!template.includes('<div id="root"></div>')) {
      throw new Error('dist/index.html does not contain an empty <div id="root"></div> placeholder');
    }

    // Data-viz components render skeletons on the server (no data fetch at SSR),
    // so renderToString stays deterministic and side-effect free.
    const appHtml = renderToString(
      React.createElement(React.StrictMode, null, React.createElement(App))
    );

    const output = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    await writeFile(distIndexPath, output, 'utf-8');
    console.log(`✔ Prerendered / -> dist/index.html (${appHtml.length} chars)`);

    // sitemap.xml — single-page application.
    const today = new Date().toISOString().slice(0, 10);
    const sitemap =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url>\n' +
      `    <loc>${SITE_URL}/</loc>\n` +
      `    <lastmod>${today}</lastmod>\n` +
      '    <changefreq>daily</changefreq>\n' +
      '    <priority>1.0</priority>\n' +
      '  </url>\n' +
      '</urlset>\n';
    await writeFile(path.resolve(__dirname, 'dist/sitemap.xml'), sitemap, 'utf-8');
    console.log(`✔ Generated dist/sitemap.xml (lastmod ${today})`);

    console.log(`Done. 1 page prerendered for ${SITE_URL}`);
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
