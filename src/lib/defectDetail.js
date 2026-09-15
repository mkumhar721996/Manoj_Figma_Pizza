import { canViewDefect } from './auth/canViewDefect.js';
import { computeSlaStatus } from './sla/computeSlaStatus.js';
import { logEvent } from './log.js';

export function getDefectDetail(repo, currentUser, projectId, defectId) {
  const defect = repo.findDefectById(defectId);
  if (!defect || defect.projectId !== projectId) {
    logEvent('info', 'defect.not_found', {
      userId: currentUser.id,
      projectId,
      defectId,
      reason: defect ? 'defect_belongs_to_different_project' : 'defect_does_not_exist',
    });
    return { status: 404 };
  }

  const memberships = repo.findMembershipsByProjectId(projectId);
  if (!canViewDefect(currentUser, defect, memberships)) {
    logEvent('warn', 'defect.access_denied', {
      userId: currentUser.id,
      projectId,
      defectId,
      reason: 'not_a_project_member_and_not_the_reporter',
    });
    return { status: 403 };
  }

  const slaPolicy = repo.findSlaPolicyByProjectId(projectId);

  const dto = {
    id: defect.id,
    title: defect.title,
    description: defect.description,
    severity: defect.severity,
    priority: defect.priority,
    component: defect.component,
    status: defect.status,
    reporter: repo.findUserById(defect.reporterId),
    assignee: defect.assigneeId ? repo.findUserById(defect.assigneeId) : null,
    createdBy: repo.findUserById(defect.createdById),
    createdAt: defect.createdAt,
    updatedBy: repo.findUserById(defect.updatedById),
    updatedAt: defect.updatedAt,
    attachments: repo.findAttachmentsByDefectId(defectId),
    slaStatus: computeSlaStatus(defect, slaPolicy),
  };

  return { status: 200, dto };
}
