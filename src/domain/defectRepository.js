class DefectRepository {
  constructor() {
    this._defects = new Map();
  }

  create(defect) {
    this._defects.set(defect.id, { ...defect });
    return this.get(defect.id);
  }

  get(id) {
    const defect = this._defects.get(id);
    return defect ? { ...defect } : undefined;
  }

  update(id, patch) {
    const existing = this._defects.get(id);
    if (!existing) {
      return undefined;
    }
    const updated = { ...existing, ...patch };
    this._defects.set(id, updated);
    return { ...updated };
  }

  findDuplicatesOf(canonicalId) {
    return Array.from(this._defects.values())
      .filter((defect) => defect.duplicateOfId === canonicalId)
      .map((defect) => ({ ...defect }));
  }
}

module.exports = { DefectRepository };
