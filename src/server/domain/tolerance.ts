import type { Evaluation, Quantity, Unit } from '../../shared/types.js';
import { convert, roundTo, steps } from './quantity.js';

/**
 * FR-12: classify a net weight against target ± tolerance (inclusive band).
 * All values are compared in the target's unit at its display precision.
 */
export function evaluate(weight: number, weightUnit: Unit, target: Quantity, tolerance: Quantity): Evaluation {
  const unit = target.unit;
  const w = steps(convert(weight, weightUnit, unit), unit);
  const t = steps(target.value, unit);
  const tol = steps(convert(tolerance.value, tolerance.unit, unit), unit);
  const min = t - tol;
  const max = t + tol;

  let zone: Evaluation['zone'];
  if (w > max) zone = 'OVER';
  else if (w === t) zone = 'TARGET';
  else if (w >= min) zone = 'IN_RANGE';
  else zone = 'UNDER';

  const scale = 10 ** (unit === 'kg' ? 3 : 1);
  const surplus = zone === 'OVER' ? (w - t) / scale : 0;
  return {
    zone,
    near: zone === 'UNDER' && w >= Math.round(t * 0.9),
    min: min / scale,
    max: max / scale,
    surplus: roundTo(surplus, unit),
    surplusPct: t === 0 ? 0 : Math.round(((w - t) / t) * 1000) / 10,
  };
}

export const isConfirmable = (e: Evaluation) => e.zone === 'IN_RANGE' || e.zone === 'TARGET';
