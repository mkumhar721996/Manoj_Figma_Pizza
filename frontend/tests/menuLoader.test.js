import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMenuMarkup } from '../public/menuLoader.js';

const sampleItems = [
  {
    id: 'drink-cola',
    name: 'Cola',
    description: 'Chilled classic cola, 330ml can.',
    photoUrl: 'https://example.com/photos/cola.jpg',
    category: 'Drinks',
    price: 2.5,
  },
];

test('renders the menu when fetch succeeds with valid data', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => sampleItems,
  });

  const html = await loadMenuMarkup(fakeFetch);

  assert.match(html, /Cola/);
});

test('renders a user-friendly error message when fetch rejects (network failure)', async () => {
  const fakeFetch = async () => {
    throw new Error('network down');
  };

  const html = await loadMenuMarkup(fakeFetch);

  assert.match(html, /menu-error/);
  assert.match(html, /unavailable/i);
});

test('renders a user-friendly error message when the response is not ok', async () => {
  const fakeFetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
  });

  const html = await loadMenuMarkup(fakeFetch);

  assert.match(html, /menu-error/);
  assert.match(html, /unavailable/i);
});

test('renders a user-friendly error message when the response body is not valid JSON', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  });

  const html = await loadMenuMarkup(fakeFetch);

  assert.match(html, /menu-error/);
  assert.match(html, /unavailable/i);
});
