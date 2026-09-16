import type { Defect, SlaRule } from './types.ts';

export function resolveSlaRule(rules: SlaRule[], defect: Defect): SlaRule | undefined {
  return rules.find(
    (rule) => rule.projectId === defect.projectId && rule.priority === defect.priority
  );
}
