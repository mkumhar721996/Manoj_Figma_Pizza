const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, adminHeaders } = require('./helpers/testServer');
const repository = require('../src/repositories/menuItemRepository');

test('admin menu items', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());
  t.beforeEach(() => repository.reset());

  await t.test('AC1: adding a new item makes it appear in the admin menu list', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        name: 'Margherita',
        description: 'Classic tomato and mozzarella',
        price: 9.99,
        category: 'pizza',
      }),
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.name, 'Margherita');
    assert.ok(created.id);

    const listResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      headers: adminHeaders(),
    });
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.ok(list.some((item) => item.id === created.id && item.name === 'Margherita'));
  });

  await t.test('AC3: editing an item updates the admin menu list', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        name: 'Margherita',
        description: 'Classic tomato and mozzarella',
        price: 9.99,
        category: 'pizza',
      }),
    });
    const created = await createResponse.json();

    const updateResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        name: 'Margherita Deluxe',
        description: 'Extra mozzarella and basil',
        price: 12.49,
        category: 'pizza',
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.name, 'Margherita Deluxe');
    assert.equal(updated.price, 12.49);

    const listResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      headers: adminHeaders(),
    });
    const list = await listResponse.json();
    const found = list.find((item) => item.id === created.id);
    assert.equal(found.name, 'Margherita Deluxe');
    assert.equal(found.price, 12.49);
  });

  await t.test('AC3: editing an item cannot overwrite its id or active state', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ name: 'Margherita', price: 9.99, category: 'pizza' }),
    });
    const created = await createResponse.json();

    const updateResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        id: 'spoofed-id',
        active: false,
        name: 'Margherita Deluxe',
        price: 12.49,
        category: 'pizza',
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.id, created.id);
    assert.equal(updated.active, true);

    const listResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      headers: adminHeaders(),
    });
    const list = await listResponse.json();
    assert.ok(list.some((item) => item.id === created.id));
    assert.ok(!list.some((item) => item.id === 'spoofed-id'));
  });

  await t.test('AC3: a partial edit does not wipe out unspecified fields', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        name: 'Margherita',
        description: 'Classic tomato and mozzarella',
        price: 9.99,
        category: 'pizza',
      }),
    });
    const created = await createResponse.json();

    const updateResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ name: 'Margherita Deluxe' }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.name, 'Margherita Deluxe');
    assert.equal(updated.description, 'Classic tomato and mozzarella');
    assert.equal(updated.price, 9.99);
    assert.equal(updated.category, 'pizza');
  });

  await t.test('AC5: toggling an active item off sets it inactive', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ name: 'Pepperoni', price: 11.5, category: 'pizza' }),
    });
    const created = await createResponse.json();
    assert.equal(created.active, true);

    const toggleResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}/toggle`, {
      method: 'PATCH',
      headers: adminHeaders(),
    });
    assert.equal(toggleResponse.status, 200);
    const toggled = await toggleResponse.json();
    assert.equal(toggled.active, false);
  });

  await t.test('AC6: toggling an inactive item on sets it active', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ name: 'Seasonal Special', price: 14, category: 'pizza', active: false }),
    });
    const created = await createResponse.json();
    assert.equal(created.active, false);

    const toggleResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}/toggle`, {
      method: 'PATCH',
      headers: adminHeaders(),
    });
    assert.equal(toggleResponse.status, 200);
    const toggled = await toggleResponse.json();
    assert.equal(toggled.active, true);
  });
});
