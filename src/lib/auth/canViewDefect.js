export function canViewDefect(user, defect, memberships) {
  if (user.id === defect.reporterId) return true;
  return memberships.some((m) => m.userId === user.id && m.projectId === defect.projectId);
}
