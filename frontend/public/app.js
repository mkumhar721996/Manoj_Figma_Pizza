import { loadMenuMarkup } from './menuLoader.js';

async function mountMenuPage() {
  const root = document.getElementById('root');
  root.innerHTML = await loadMenuMarkup(fetch);
}

mountMenuPage();
