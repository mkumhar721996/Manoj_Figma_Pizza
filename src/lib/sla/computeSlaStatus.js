const HOUR_MS = 3_600_000;

export function computeSlaStatus(defect, policy) {
  if (!policy) return null;
  const elapsedHours = (Date.now() - new Date(defect.createdAt).getTime()) / HOUR_MS;
  if (elapsedHours >= policy.breachHours) return 'BREACHED';
  if (elapsedHours >= policy.atRiskHours) return 'AT_RISK';
  return 'ON_TRACK';
}
