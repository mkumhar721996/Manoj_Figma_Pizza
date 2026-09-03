const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, adminHeaders } = require('./helpers/testServer');
const repository = require('../src/repositories/menuItemRepository');

async function createAsAdmin(baseUrl, body) {
  const response = await fetch(`${baseUrl}/api/admin/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(body),
  });
  return response.json();
}

test('customer menu items', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());
  t.beforeEach(() => repository.reset());

  await t.test('AC2: a new item added by an admin is visible on the customer menu', async () => {
    const created = await createAsAdmin(baseUrl, {
      name: 'Margherita',
      description: 'Classic tomato and mozzarella',
      price: 9.99,
      category: 'pizza',
    });

    const response = await fetch(`${baseUrl}/api/menu-items`);
    assert.equal(response.status, 200);
    const list = await response.json();
    assert.ok(list.some((item) => item.id === created.id && item.name === 'Margherita'));
  });

  await t.test('AC4: edited item details are visible on the customer menu', async () => {
    const created = await createAsAdmin(baseUrl, {
      name: 'Margherita',
      description: 'Classic tomato and mozzarella',
      price: 9.99,
      category: 'pizza',
    });

    await fetch(`${baseUrl}/api/admin/menu-items/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({
        name: 'Margherita Deluxe',
        description: 'Extra mozzarella and basil',
        price: 12.49,
        category: 'pizza',
      }),
    });

    const response = await fetch(`${baseUrl}/api/menu-items`);
    const list = await response.json();
    const found = list.find((item) => item.id === created.id);
    assert.ok(found, 'expected updated item to be visible to customers');
    assert.equal(found.name, 'Margherita Deluxe');
    assert.equal(found.price, 12.49);
  });

  await t.test('AC5: toggling an item off hides it from the customer menu', async () => {
    const created = await createAsAdmin(baseUrl, { name: 'Pepperoni', price: 11.5, category: 'pizza' });

    await fetch(`${baseUrl}/api/admin/menu-items/${created.id}/toggle`, {
      method: 'PATCH',
      headers: adminHeaders(),
    });

    const response = await fetch(`${baseUrl}/api/menu-items`);
    const list = await response.json();
    assert.ok(!list.some((item) => item.id === created.id));
  });

  await t.test('AC6: toggling an item on shows it on the customer menu', async () => {
    const created = await createAsAdmin(baseUrl, {
      name: 'Seasonal Special',
      price: 14,
      category: 'pizza',
      active: false,
    });

    const beforeToggle = await fetch(`${baseUrl}/api/menu-items`);
    const beforeList = await beforeToggle.json();
    assert.ok(!beforeList.some((item) => item.id === created.id));

    await fetch(`${baseUrl}/api/admin/menu-items/${created.id}/toggle`, {
      method: 'PATCH',
      headers: adminHeaders(),
    });

    const afterToggle = await fetch(`${baseUrl}/api/menu-items`);
    const afterList = await afterToggle.json();
    assert.ok(afterList.some((item) => item.id === created.id));
  });
});
