import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
// FontAwesome bundled locally (the CDN <link> was blocked by a stale SRI hash,
// so no icons rendered). Vite emits the webfonts as hashed assets under base.
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';

// Progressive enhancement: reveal-blocks are only hidden when JS is present and
// the user has not requested reduced motion. The class is added before render —
// no flash of hidden content.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('reveal-on');
}

const container = document.getElementById('root') as HTMLElement;
const tree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
