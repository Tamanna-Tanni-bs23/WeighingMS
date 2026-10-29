import type { Quantity } from '../../shared/types.js';
import type { StationConfig } from '../config.js';
import { toKg } from './quantity.js';

/** FR-8: target ≤ threshold → precision scale; above → floor scale. Threshold is configuration. */
export function selectScale(target: Quantity, config: Pick<StationConfig, 'scaleThresholdKg' | 'precisionScaleId' | 'floorScaleId'>): string {
  // Compare in grams as integers so "exactly 3 kg" is never misclassified by float noise.
  const targetMg = Math.round(toKg(target) * 1_000_000);
  const thresholdMg = Math.round(config.scaleThresholdKg * 1_000_000);
  return targetMg <= thresholdMg ? config.precisionScaleId : config.floorScaleId;
}
