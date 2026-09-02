import { renderMenuPage } from './render.js';

async function mountMenuPage() {
  const root = document.getElementById('root');
  const response = await fetch('/api/menu-items');
  const items = await response.json();
  root.innerHTML = renderMenuPage(items);
}

mountMenuPage();
