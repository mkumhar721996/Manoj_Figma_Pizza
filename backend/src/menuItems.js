'use strict';

/**
 * @typedef {'Pizzas' | 'Sides' | 'Drinks'} Category
 */

/**
 * Seed menu data. This is the single source of truth for which items are
 * "active" — the API only ever returns active items, so the frontend never
 * needs to re-apply that filter.
 * @type {Array<Object>}
 */
const menuItems = [
  {
    id: 'pizza-margherita',
    name: 'Margherita',
    description: 'Tomato, mozzarella, and fresh basil.',
    photoUrl: 'https://example.com/photos/margherita.jpg',
    category: 'Pizzas',
    active: true,
    sizePrices: { small: 8.99, medium: 11.99, large: 14.99 },
  },
  {
    id: 'pizza-pepperoni',
    name: 'Pepperoni',
    description: 'Classic pepperoni with mozzarella and tomato sauce.',
    photoUrl: 'https://example.com/photos/pepperoni.jpg',
    category: 'Pizzas',
    active: true,
    sizePrices: { small: 9.99, medium: 12.99, large: 15.99 },
  },
  {
    id: 'side-garlic-bread',
    name: 'Garlic Bread',
    description: 'Toasted bread with garlic butter and herbs.',
    photoUrl: 'https://example.com/photos/garlic-bread.jpg',
    category: 'Sides',
    active: true,
    price: 4.5,
  },
  {
    id: 'drink-cola',
    name: 'Cola',
    description: 'Chilled classic cola, 330ml can.',
    photoUrl: 'https://example.com/photos/cola.jpg',
    category: 'Drinks',
    active: true,
    price: 2.5,
  },
  {
    id: 'pizza-discontinued',
    name: 'Discontinued Special',
    description: 'No longer on the menu.',
    photoUrl: 'https://example.com/photos/discontinued.jpg',
    category: 'Pizzas',
    active: false,
    sizePrices: { small: 7.99, medium: 10.99, large: 13.99 },
  },
];

module.exports = { menuItems };
