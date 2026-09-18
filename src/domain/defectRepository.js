class DefectRepository {
  constructor() {
    this._defects = new Map();
  }

  create(defect) {
    const record = { duplicateOfId: null, ...defect };
    this._defects.set(record.id, record);
    return record;
  }

  get(id) {
    return this._defects.get(id) || null;
  }

  update(id, patch) {
    const existing = this._defects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this._defects.set(id, updated);
    return updated;
  }

  findDuplicatesOf(canonicalId) {
    return [...this._defects.values()].filter((d) => d.duplicateOfId === canonicalId);
  }
}

module.exports = { DefectRepository };
