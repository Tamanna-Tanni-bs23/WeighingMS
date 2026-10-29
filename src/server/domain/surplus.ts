import type { Quantity } from '../../shared/types.js';
import { roundTo } from './quantity.js';

export interface SurplusProposalLine {
  componentId: string;
  name: string;
  current: Quantity;
  proposed: Quantity;
}

/**
 * ADR-001 (Step 24, option 2): on overshoot, show what preserving the shade ratio WOULD require
 * for the remaining components — information only. Targets are never changed by WeighingMS;
 * the recipe stays owned by OrgaTEX (brief §5.2, A-08).
 */
export function proportionalProposal(
  surplusPct: number,
  remaining: { componentId: string; name: string; target: Quantity }[],
): SurplusProposalLine[] {
  const factor = 1 + surplusPct / 100;
  return remaining.map((c) => ({
    componentId: c.componentId,
    name: c.name,
    current: c.target,
    proposed: { value: roundTo(c.target.value * factor, c.target.unit), unit: c.target.unit },
  }));
}
