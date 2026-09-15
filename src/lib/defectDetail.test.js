import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDefectDetail } from './defectDetail.js';

const HOUR = 3_600_000;

function makeRepo(overrides = {}) {
  const reporter = { id: 'user-reporter', name: 'Ada Lovelace' };
  const assignee = { id: 'user-assignee', name: 'Grace Hopper' };
  const creator = { id: 'user-creator', name: 'Alan Turing' };
  const updater = { id: 'user-updater', name: 'Margaret Hamilton' };

  const defect = {
    id: 'defect-1',
    projectId: 'project-1',
    title: 'Login button is unresponsive',
    description: 'Clicking login does nothing on Safari.',
    severity: 'HIGH',
    priority: 'P1',
    component: 'Authentication',
    status: 'IN_PROGRESS',
    reporterId: reporter.id,
    assigneeId: assignee.id,
    createdById: creator.id,
    createdAt: new Date(Date.now() - 10 * HOUR).toISOString(),
    updatedById: updater.id,
    updatedAt: new Date(Date.now() - 1 * HOUR).toISOString(),
    ...overrides.defect,
  };

  const users = { [reporter.id]: reporter, [assignee.id]: assignee, [creator.id]: creator, [updater.id]: updater };

  return {
    findDefectById: () => defect,
    findUserById: (id) => users[id] ?? null,
    findMembershipsByProjectId: () => overrides.memberships ?? [],
    findAttachmentsByDefectId: () => overrides.attachments ?? [],
    findSlaPolicyByProjectId: () => (overrides.slaPolicy === undefined ? null : overrides.slaPolicy),
  };
}

test('AC1/AC11: returns a full DTO with all fields and audit metadata for an authorised member', () => {
  const repo = makeRepo({ memberships: [{ userId: 'user-member', projectId: 'project-1' }] });
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'defect-1');

  assert.equal(result.status, 200);
  assert.equal(result.dto.title, 'Login button is unresponsive');
  assert.equal(result.dto.reporter.name, 'Ada Lovelace');
  assert.equal(result.dto.assignee.name, 'Grace Hopper');
  assert.equal(result.dto.createdBy.name, 'Alan Turing');
  assert.equal(result.dto.updatedBy.name, 'Margaret Hamilton');
});

test('AC7: is visible to a project member', () => {
  const repo = makeRepo({ memberships: [{ userId: 'user-member', projectId: 'project-1' }] });
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'defect-1');
  assert.equal(result.status, 200);
});

test('AC7: is visible to the reporter even without membership', () => {
  const repo = makeRepo({ memberships: [] });
  const result = getDefectDetail(repo, { id: 'user-reporter' }, 'project-1', 'defect-1');
  assert.equal(result.status, 200);
});

test('AC8: denies an outsider who is not a member or the reporter', () => {
  const repo = makeRepo({ memberships: [{ userId: 'user-member', projectId: 'project-1' }] });
  const result = getDefectDetail(repo, { id: 'user-outsider' }, 'project-1', 'defect-1');
  assert.equal(result.status, 403);
});

test('returns 404 when the defect does not exist', () => {
  const repo = makeRepo();
  repo.findDefectById = () => null;
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'missing-defect');
  assert.equal(result.status, 404);
});

test('AC4: includes a BREACHED sla status when the policy threshold is exceeded', () => {
  const repo = makeRepo({
    memberships: [{ userId: 'user-member', projectId: 'project-1' }],
    slaPolicy: { atRiskHours: 2, breachHours: 8 },
  });
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'defect-1');
  assert.equal(result.dto.slaStatus, 'BREACHED');
});

test('AC6: includes a null sla status when no policy is configured', () => {
  const repo = makeRepo({ memberships: [{ userId: 'user-member', projectId: 'project-1' }], slaPolicy: null });
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'defect-1');
  assert.equal(result.dto.slaStatus, null);
});

test('AC2/AC3: includes attachments, defaulting to an empty list when there are none', () => {
  const repo = makeRepo({ memberships: [{ userId: 'user-member', projectId: 'project-1' }], attachments: [] });
  const result = getDefectDetail(repo, { id: 'user-member' }, 'project-1', 'defect-1');
  assert.deepEqual(result.dto.attachments, []);
});
