const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../../src/api/app');
const { DefectRepository } = require('../../src/domain/defectRepository');

let repo;
let server;
let baseUrl;

beforeEach(async () => {
  repo = new DefectRepository();
  repo.create({ id: 'dup-1', title: 'Duplicate defect', status: 'Open', duplicateOfId: null });
  repo.create({ id: 'canonical-1', title: 'Canonical defect', status: 'Open', duplicateOfId: null });

  const app = createApp(repo);
  server = http.createServer((req, res) => {
    app(req, res).catch((err) => {
      res.writeHead(500);
      res.end(String(err));
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  server.closeAllConnections();
  server.close();
});

test('links the duplicate and exposes it on both detail views', async () => {
  const linkResponse = await fetch(`${baseUrl}/defects/dup-1/duplicate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'TRIAGER' },
    body: JSON.stringify({ canonicalDefectId: 'canonical-1' }),
  });
  assert.equal(linkResponse.status, 201);

  const dupResponse = await fetch(`${baseUrl}/defects/dup-1`);
  assert.equal(dupResponse.status, 200);
  const dup = await dupResponse.json();
  assert.equal(dup.duplicateOfId, 'canonical-1');

  const canonicalResponse = await fetch(`${baseUrl}/defects/canonical-1`);
  const canonical = await canonicalResponse.json();
  assert.deepEqual(canonical.duplicateDefectIds, ['dup-1']);
});

test('rejects linking a defect as a duplicate of itself', async () => {
  const response = await fetch(`${baseUrl}/defects/dup-1/duplicate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'TRIAGER' },
    body: JSON.stringify({ canonicalDefectId: 'dup-1' }),
  });
  assert.equal(response.status, 400);

  const dupResponse = await fetch(`${baseUrl}/defects/dup-1`);
  const dup = await dupResponse.json();
  assert.equal(dup.duplicateOfId, null);
});

test('rejects an unauthorized user', async () => {
  const response = await fetch(`${baseUrl}/defects/dup-1/duplicate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'REPORTER' },
    body: JSON.stringify({ canonicalDefectId: 'canonical-1' }),
  });
  assert.equal(response.status, 403);

  const dupResponse = await fetch(`${baseUrl}/defects/dup-1`);
  const dup = await dupResponse.json();
  assert.equal(dup.duplicateOfId, null);
});
