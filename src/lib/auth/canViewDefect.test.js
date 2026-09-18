import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canViewDefect } from './canViewDefect.js';

const defect = { id: 'defect-1', projectId: 'project-1', reporterId: 'user-reporter' };

test('AC7: allows a user with a project membership for the defect project', () => {
  const member = { id: 'user-member' };
  const memberships = [{ userId: 'user-member', projectId: 'project-1' }];
  assert.equal(canViewDefect(member, defect, memberships), true);
});

test('AC7: allows the defect reporter even without a project membership', () => {
  const reporter = { id: 'user-reporter' };
  assert.equal(canViewDefect(reporter, defect, []), true);
});

test('AC8: denies a user who is neither a project member nor the reporter', () => {
  const outsider = { id: 'user-outsider' };
  const memberships = [{ userId: 'user-member', projectId: 'project-1' }];
  assert.equal(canViewDefect(outsider, defect, memberships), false);
});

test('AC8: denies a project member of a different project who is not the reporter', () => {
  const otherProjectMember = { id: 'user-other-project' };
  const memberships = [{ userId: 'user-other-project', projectId: 'project-2' }];
  assert.equal(canViewDefect(otherProjectMember, defect, memberships), false);
});
