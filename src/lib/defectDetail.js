import { canViewDefect } from './auth/canViewDefect.js';
import { computeSlaStatus } from './sla/computeSlaStatus.js';

export function getDefectDetail(repo, currentUser, projectId, defectId) {
  const defect = repo.findDefectById(defectId);
  if (!defect || defect.projectId !== projectId) {
    return { status: 404 };
  }

  const memberships = repo.findMembershipsByProjectId(projectId);
  if (!canViewDefect(currentUser, defect, memberships)) {
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
