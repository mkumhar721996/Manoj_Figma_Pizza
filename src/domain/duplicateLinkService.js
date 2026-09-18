const { canLinkDuplicate } = require('./authorization');

class DuplicateLinkError extends Error {}

class UnauthorizedError extends DuplicateLinkError {
  constructor() {
    super('User is not authorized to link defects as duplicates.');
    this.name = 'UnauthorizedError';
  }
}

class NotFoundError extends DuplicateLinkError {
  constructor(defectId) {
    super(`Defect not found: ${defectId}`);
    this.name = 'NotFoundError';
  }
}

function linkAsDuplicate({ actingUser, duplicateDefectId, canonicalDefectId }, repo) {
  if (!canLinkDuplicate(actingUser)) {
    throw new UnauthorizedError();
  }

  const duplicateDefect = repo.get(duplicateDefectId);
  if (!duplicateDefect) {
    throw new NotFoundError(duplicateDefectId);
  }

  const canonicalDefect = repo.get(canonicalDefectId);
  if (!canonicalDefect) {
    throw new NotFoundError(canonicalDefectId);
  }

  return repo.update(duplicateDefectId, { duplicateOfId: canonicalDefectId });
}

module.exports = { linkAsDuplicate, DuplicateLinkError, UnauthorizedError, NotFoundError };
