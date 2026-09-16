import { evaluateSla } from '../sla/evaluateSla.ts';
import { resolveSlaRule } from '../sla/resolveSlaRule.ts';
import type { Defect, SlaRule } from '../sla/types.ts';
import { renderSlaIndicator } from './renderSlaIndicator.ts';

export function renderDefectRecord(defect: Defect, rules: SlaRule[], now: Date): string {
  const rule = resolveSlaRule(rules, defect);
  const evaluation = evaluateSla(defect, rule, now);
  const indicatorHtml = renderSlaIndicator(evaluation);

  return `<article data-testid="defect-record"><h1>${defect.id}</h1>${indicatorHtml}</article>`;
}
