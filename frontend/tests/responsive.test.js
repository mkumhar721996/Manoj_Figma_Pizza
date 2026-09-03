import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMenuPage } from '../public/render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesPath = path.join(__dirname, '..', 'public', 'styles.css');

const sampleItems = [
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'Tomato and mozzarella.',
    photoUrl: 'https://example.com/margherita.jpg',
    category: 'Pizzas',
    sizePrices: { small: 8.99, medium: 11.99, large: 14.99 },
  },
];

test('rendered markup carries the responsive CSS hook classes', () => {
  const html = renderMenuPage(sampleItems);

  assert.match(html, /class="menu-page"/);
  assert.match(html, /class="category-section"/);
  assert.match(html, /class="menu-item-photo"/);
});

test('stylesheet enforces mobile-first, no-horizontal-scroll layout', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /\.menu-item-photo\s*\{[^}]*max-width:\s*100%/s);
  assert.match(css, /min-width:\s*768px/);
});
