const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { attachUser } = require('../../src/api/authMiddleware');

const ORIGINAL_SECRET = process.env.TRUSTED_PROXY_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.TRUSTED_PROXY_SECRET;
  } else {
    process.env.TRUSTED_PROXY_SECRET = ORIGINAL_SECRET;
  }
});

test('trusts role headers when no proxy secret is configured', () => {
  delete process.env.TRUSTED_PROXY_SECRET;

  const req = { headers: { 'x-user-role': 'ADMIN', 'x-user-id': 'u1' } };
  attachUser(req);

  assert.deepEqual(req.user, { id: 'u1', role: 'ADMIN' });
});

test('rejects spoofed role headers when a proxy secret is configured but missing', () => {
  process.env.TRUSTED_PROXY_SECRET = 'super-secret';

  const req = { headers: { 'x-user-role': 'ADMIN', 'x-user-id': 'attacker' } };
  attachUser(req);

  assert.equal(req.user, null);
});

test('trusts role headers when the correct proxy secret is present', () => {
  process.env.TRUSTED_PROXY_SECRET = 'super-secret';

  const req = {
    headers: {
      'x-user-role': 'ADMIN',
      'x-user-id': 'u1',
      'x-gateway-secret': 'super-secret',
    },
  };
  attachUser(req);

  assert.deepEqual(req.user, { id: 'u1', role: 'ADMIN' });
});
