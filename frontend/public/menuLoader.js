import { renderMenuPage, renderErrorState } from './render.js';

export async function loadMenuMarkup(fetchImpl) {
  try {
    const response = await fetchImpl('/api/menu-items');
    if (!response.ok) {
      throw new Error(`Menu request failed with status ${response.status}`);
    }
    const items = await response.json();
    return renderMenuPage(items);
  } catch (error) {
    console.error('Failed to load menu:', error);
    return renderErrorState();
  }
}
