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

class InvalidLinkError extends DuplicateLinkError {
  constructor(defectId) {
    super(`Defect cannot be linked as a duplicate of itself: ${defectId}`);
    this.name = 'InvalidLinkError';
  }
}

function linkAsDuplicate({ actingUser, duplicateDefectId, canonicalDefectId }, repo) {
  if (!canLinkDuplicate(actingUser)) {
    throw new UnauthorizedError();
  }

  if (duplicateDefectId === canonicalDefectId) {
    throw new InvalidLinkError(duplicateDefectId);
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

module.exports = {
  linkAsDuplicate,
  DuplicateLinkError,
  UnauthorizedError,
  NotFoundError,
  InvalidLinkError,
};
