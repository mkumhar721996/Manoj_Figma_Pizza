const HOUR = 3_600_000;

const users = [
  { id: 'user-member-a', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'user-reporter-a', name: 'Katherine Johnson', email: 'katherine@example.com' },
  { id: 'user-assignee-a', name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 'user-creator-a', name: 'Alan Turing', email: 'alan@example.com' },
  { id: 'user-updater-a', name: 'Margaret Hamilton', email: 'margaret@example.com' },
  { id: 'user-member-b', name: 'Dennis Ritchie', email: 'dennis@example.com' },
  { id: 'user-outsider', name: 'Barbara Liskov', email: 'barbara@example.com' },
];

const projects = [
  { id: 'project-a', name: 'Checkout Revamp' },
  { id: 'project-b', name: 'Loyalty Program' },
];

const memberships = [
  { userId: 'user-member-a', projectId: 'project-a' },
  { userId: 'user-member-b', projectId: 'project-b' },
];

const slaPolicies = {
  'project-a': { projectId: 'project-a', atRiskHours: 24, breachHours: 48 },
  'project-b': null,
};

const defects = [
  {
    id: 'defect-1',
    projectId: 'project-a',
    title: 'Login button is unresponsive',
    description: 'Clicking the login button does nothing on Safari.',
    severity: 'HIGH',
    priority: 'HIGH',
    component: 'Authentication',
    status: 'IN_PROGRESS',
    reporterId: 'user-reporter-a',
    assigneeId: 'user-assignee-a',
    createdById: 'user-creator-a',
    createdAt: new Date(Date.now() - 30 * HOUR).toISOString(),
    updatedById: 'user-updater-a',
    updatedAt: new Date(Date.now() - 1 * HOUR).toISOString(),
  },
  {
    id: 'defect-2',
    projectId: 'project-b',
    title: 'Loyalty points not credited',
    description: 'Points earned on a purchase are missing from the balance.',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    component: 'Loyalty',
    status: 'OPEN',
    reporterId: 'user-member-b',
    assigneeId: null,
    createdById: 'user-member-b',
    createdAt: new Date(Date.now() - 2 * HOUR).toISOString(),
    updatedById: 'user-member-b',
    updatedAt: new Date(Date.now() - 2 * HOUR).toISOString(),
  },
];

const attachments = [
  { id: 'attachment-1', defectId: 'defect-1', filename: 'screenshot.png', url: '/files/attachment-1' },
];

export const db = {
  findDefectById: (defectId) => defects.find((d) => d.id === defectId) ?? null,
  findUserById: (userId) => users.find((u) => u.id === userId) ?? null,
  findMembershipsByProjectId: (projectId) => memberships.filter((m) => m.projectId === projectId),
  findAttachmentsByDefectId: (defectId) => attachments.filter((a) => a.defectId === defectId),
  findSlaPolicyByProjectId: (projectId) => slaPolicies[projectId] ?? null,
};

export const seedFixtures = { users, projects, memberships, slaPolicies, defects, attachments };
