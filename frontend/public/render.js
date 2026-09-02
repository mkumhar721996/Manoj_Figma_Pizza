export const CATEGORIES = ['Pizzas', 'Sides', 'Drinks'];

const SIZE_LABELS = [
  ['small', 'Small'],
  ['medium', 'Medium'],
  ['large', 'Large'],
];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

export function groupByCategory(items) {
  const grouped = {};
  for (const category of CATEGORIES) {
    grouped[category] = [];
  }
  for (const item of items) {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  }
  return grouped;
}

function renderSizePriceList(sizePrices) {
  const rows = SIZE_LABELS.map(
    ([key, label]) =>
      `<div class="size-price-row"><span class="size-label">${label}</span><span class="size-price">${formatPrice(sizePrices[key])}</span></div>`
  ).join('');
  return `<div class="size-price-list">${rows}</div>`;
}

export function renderMenuItemCard(item) {
  const priceMarkup =
    item.category === 'Pizzas'
      ? renderSizePriceList(item.sizePrices)
      : `<div class="menu-item-price">${formatPrice(item.price)}</div>`;

  return `<article class="menu-item-card">
    <img class="menu-item-photo" src="${escapeHtml(item.photoUrl)}" alt="${escapeHtml(item.name)}" />
    <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
    <p class="menu-item-description">${escapeHtml(item.description)}</p>
    ${priceMarkup}
  </article>`;
}

export function renderCategorySection(category, items) {
  const cards = items.map(renderMenuItemCard).join('');
  return `<section class="category-section">
    <h2 class="category-heading">${escapeHtml(category)}</h2>
    <div class="menu-item-list">${cards}</div>
  </section>`;
}

export function renderMenuPage(items) {
  const grouped = groupByCategory(items);
  const sections = CATEGORIES.map((category) => renderCategorySection(category, grouped[category])).join('');
  return `<div class="menu-page">${sections}</div>`;
}
