const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./helpers/testServer');
const repository = require('../src/repositories/menuItemRepository');

test('authorization', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());
  t.beforeEach(() => repository.reset());

  await t.test('AC7: a non-admin cannot add, edit, or toggle a menu item', async () => {
    const createResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
      body: JSON.stringify({ name: 'Margherita', price: 9.99, category: 'pizza' }),
    });
    const created = await createResponse.json();

    const nonAdminHeaderSets = [{}, { 'x-role': 'customer' }];

    for (const headers of nonAdminHeaderSets) {
      const addResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: 'Hacked Item', price: 1, category: 'pizza' }),
      });
      assert.equal(addResponse.status, 403);

      const editResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      assert.equal(editResponse.status, 403);

      const toggleResponse = await fetch(`${baseUrl}/api/admin/menu-items/${created.id}/toggle`, {
        method: 'PATCH',
        headers,
      });
      assert.equal(toggleResponse.status, 403);
    }

    const listResponse = await fetch(`${baseUrl}/api/admin/menu-items`, {
      headers: { 'x-role': 'admin' },
    });
    const list = await listResponse.json();
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Margherita');
    assert.equal(list[0].active, true);
  });
});
