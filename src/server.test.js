import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';
import { createSessionToken } from './lib/auth/session.js';
import { SESSION_SECRET } from './config.js';
import { db } from './data/db.js';

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function get(path, userId) {
  const headers = {};
  if (userId) {
    headers.Authorization = `Bearer ${createSessionToken(userId, SESSION_SECRET)}`;
  }
  return fetch(`${baseUrl}${path}`, { headers });
}

test('AC7: a project member can view the defect detail page', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-member-a');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Login button is unresponsive/);
});

test('AC7: the defect reporter can view the detail page without being a project member', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-reporter-a');
  assert.equal(res.status, 200);
});

test('AC8: a user outside the project who is not the reporter is denied', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-outsider');
  assert.equal(res.status, 403);
  const html = await res.text();
  assert.match(html, /access denied/i);
});

test('AC2: attachments are listed with filename and a download link', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-member-a');
  const html = await res.text();
  assert.match(html, /screenshot\.png/);
  assert.match(html, /href="\/files\/attachment-1"/);
});

test('AC3: an empty-state message is shown for a defect with no attachments', async () => {
  const res = await get('/projects/project-b/defects/defect-2', 'user-member-b');
  const html = await res.text();
  assert.match(html, /no attachments/i);
});

test('AC4: an at-risk SLA indicator is shown when the project has a policy and is past threshold', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-member-a');
  const html = await res.text();
  assert.match(html, /role="status"/);
  assert.match(html, /at.risk/i);
});

test('AC6: no SLA indicator is shown when the project has no policy configured', async () => {
  const res = await get('/projects/project-b/defects/defect-2', 'user-member-b');
  const html = await res.text();
  assert.doesNotMatch(html, /role="status"/);
});

test('AC9/AC10: the rendered page has a single h1, lang attribute, and a mobile breakpoint', async () => {
  const res = await get('/projects/project-a/defects/defect-1', 'user-member-a');
  const html = await res.text();
  assert.match(html, /<html lang="en">/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /@media \(max-width: 600px\)/);
});

test('returns 404 for a defect that does not exist', async () => {
  const res = await get('/projects/project-a/defects/does-not-exist', 'user-member-a');
  assert.equal(res.status, 404);
});

test('returns 401 when no authenticated user is provided', async () => {
  const res = await get('/projects/project-a/defects/defect-1');
  assert.equal(res.status, 401);
});

test('security: an unsigned x-user-id header claiming an identity is rejected', async () => {
  const res = await fetch(`${baseUrl}/projects/project-a/defects/defect-1`, {
    headers: { 'x-user-id': 'user-member-a' },
  });
  assert.equal(res.status, 401);
});

test('security: a token signed with the wrong secret is rejected', async () => {
  const forgedToken = createSessionToken('user-member-a', 'wrong-secret');
  const res = await fetch(`${baseUrl}/projects/project-a/defects/defect-1`, {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert.equal(res.status, 401);
});

test('an unexpected error while loading a defect returns 500 instead of crashing the server', async () => {
  const throwingRepo = {
    ...db,
    findDefectById: () => {
      throw new Error('boom');
    },
  };
  const throwingServer = createServer(throwingRepo);
  await new Promise((resolve) => throwingServer.listen(0, resolve));
  const { port } = throwingServer.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/projects/project-a/defects/defect-1`, {
      headers: { Authorization: `Bearer ${createSessionToken('user-member-a', SESSION_SECRET)}` },
    });
    assert.equal(res.status, 500);
  } finally {
    await new Promise((resolve) => throwingServer.close(resolve));
  }
});
