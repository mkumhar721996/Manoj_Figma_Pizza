const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { DefectRepository } = require('../../src/domain/defectRepository');
const {
  linkAsDuplicate,
  UnauthorizedError,
  DuplicateLinkError,
} = require('../../src/domain/duplicateLinkService');

let repo;

beforeEach(() => {
  repo = new DefectRepository();
  repo.create({ id: 'dup-1', title: 'Duplicate defect', status: 'Open', duplicateOfId: null });
  repo.create({ id: 'canonical-1', title: 'Canonical defect', status: 'Open', duplicateOfId: null });
});

test('saves the relationship and makes it visible on both records', () => {
  const triager = { id: 'u1', role: 'TRIAGER' };
  linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

  assert.equal(repo.get('dup-1')?.duplicateOfId, 'canonical-1');
  assert.deepEqual(repo.findDuplicatesOf('canonical-1').map((d) => d.id), ['dup-1']);
});

test('does not cascade status changes between linked defects', () => {
  const triager = { id: 'u1', role: 'TRIAGER' };
  linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

  repo.update('canonical-1', { status: 'Resolved' });

  assert.equal(repo.get('dup-1')?.status, 'Open');
});

test('preserves the link when the duplicate is Cancelled', () => {
  repo.update('dup-1', { status: 'Cancelled' });
  const triager = { id: 'u1', role: 'TRIAGER' };
  linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo);

  assert.equal(repo.get('dup-1')?.duplicateOfId, 'canonical-1');
  assert.equal(repo.get('dup-1')?.status, 'Cancelled');
});

test('rejects linking a defect as a duplicate of itself', () => {
  const triager = { id: 'u1', role: 'TRIAGER' };
  assert.throws(
    () => linkAsDuplicate({ actingUser: triager, duplicateDefectId: 'dup-1', canonicalDefectId: 'dup-1' }, repo),
    DuplicateLinkError,
  );
  assert.equal(repo.get('dup-1')?.duplicateOfId, null);
});

test('rejects the action for an unauthorized user', () => {
  const reporter = { id: 'u2', role: 'REPORTER' };
  assert.throws(
    () => linkAsDuplicate({ actingUser: reporter, duplicateDefectId: 'dup-1', canonicalDefectId: 'canonical-1' }, repo),
    UnauthorizedError,
  );
  assert.equal(repo.get('dup-1')?.duplicateOfId, null);
});
