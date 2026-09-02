import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMenuPage, CATEGORIES } from '../public/render.js';

const sampleItems = [
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'Tomato and mozzarella.',
    photoUrl: 'https://example.com/margherita.jpg',
    category: 'Pizzas',
    sizePrices: { small: 8.99, medium: 11.99, large: 14.99 },
  },
  {
    id: 'drink-1',
    name: 'Cola',
    description: 'Chilled cola.',
    photoUrl: 'https://example.com/cola.jpg',
    category: 'Drinks',
    price: 2.5,
  },
];

test('CATEGORIES is the fixed, ordered list of headings', () => {
  assert.deepEqual(CATEGORIES, ['Pizzas', 'Sides', 'Drinks']);
});

test('renders all three category headings in fixed order, even when a category has no items', () => {
  const html = renderMenuPage(sampleItems);

  const pizzasIndex = html.indexOf('Pizzas');
  const sidesIndex = html.indexOf('Sides');
  const drinksIndex = html.indexOf('Drinks');

  assert.ok(pizzasIndex !== -1, 'Pizzas heading missing');
  assert.ok(sidesIndex !== -1, 'Sides heading missing even though no Sides items were passed');
  assert.ok(drinksIndex !== -1, 'Drinks heading missing');
  assert.ok(pizzasIndex < sidesIndex && sidesIndex < drinksIndex, 'headings must appear in fixed order');
});

test('places each item under its own category section', () => {
  const html = renderMenuPage(sampleItems);

  const pizzasIndex = html.indexOf('Pizzas');
  const drinksIndex = html.indexOf('Drinks');
  const margheritaIndex = html.indexOf('Margherita');
  const colaIndex = html.indexOf('Cola');

  assert.ok(margheritaIndex > pizzasIndex && margheritaIndex < drinksIndex);
  assert.ok(colaIndex > drinksIndex);
});

test('root menu page container carries the responsive layout class', () => {
  const html = renderMenuPage(sampleItems);
  assert.match(html, /class="menu-page"/);
  assert.match(html, /class="category-section"/);
});
