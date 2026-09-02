import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMenuItemCard } from '../public/render.js';

const sampleDrink = {
  id: 'drink-cola',
  name: 'Cola',
  description: 'Chilled classic cola, 330ml can.',
  photoUrl: 'https://example.com/photos/cola.jpg',
  category: 'Drinks',
  price: 2.5,
};

const samplePizza = {
  id: 'pizza-margherita',
  name: 'Margherita',
  description: 'Tomato, mozzarella, and fresh basil.',
  photoUrl: 'https://example.com/photos/margherita.jpg',
  category: 'Pizzas',
  sizePrices: { small: 8.99, medium: 11.99, large: 14.99 },
};

// AC3: active item shows name, description, photo (from stored URL), and price
test('renders name, description, photo, and price for a simple item', () => {
  const html = renderMenuItemCard(sampleDrink);

  assert.match(html, /Cola/);
  assert.match(html, /Chilled classic cola, 330ml can\./);
  assert.match(html, /<img[^>]*src="https:\/\/example\.com\/photos\/cola\.jpg"[^>]*alt="Cola"/);
  assert.match(html, /\$2\.50/);
});

// AC5: pizza item shows Small/Medium/Large size options with their respective prices
test('renders Small/Medium/Large size options with respective prices for a pizza', () => {
  const html = renderMenuItemCard(samplePizza);

  assert.match(html, /Small/);
  assert.match(html, /\$8\.99/);
  assert.match(html, /Medium/);
  assert.match(html, /\$11\.99/);
  assert.match(html, /Large/);
  assert.match(html, /\$14\.99/);
});

test('pizza card has no single/default price shown outside the size rows', () => {
  const html = renderMenuItemCard(samplePizza);
  assert.doesNotMatch(html, /menu-item-price/);
});

// AC6: side/drink item shows a single price with no size selector
test('side/drink item shows a single price and no size labels', () => {
  const html = renderMenuItemCard(sampleDrink);

  assert.match(html, /menu-item-price/);
  assert.doesNotMatch(html, /Small/);
  assert.doesNotMatch(html, /Medium/);
  assert.doesNotMatch(html, /Large/);
});

test('renders without crashing when a pizza is missing a size price, showing only the available sizes', () => {
  const incompletePizza = {
    ...samplePizza,
    sizePrices: { small: 8.99, large: 14.99 },
  };

  const html = renderMenuItemCard(incompletePizza);

  assert.match(html, /Small/);
  assert.match(html, /\$8\.99/);
  assert.doesNotMatch(html, /Medium/);
  assert.match(html, /Large/);
  assert.match(html, /\$14\.99/);
});

test('does not render an <img> tag when photoUrl uses an unsafe scheme', () => {
  const unsafeItem = {
    ...sampleDrink,
    photoUrl: 'javascript:alert(document.cookie)',
  };

  const html = renderMenuItemCard(unsafeItem);

  assert.doesNotMatch(html, /<img/);
});

test('renders an <img> tag when photoUrl is a safe https URL', () => {
  const html = renderMenuItemCard(sampleDrink);
  assert.match(html, /<img/);
});
