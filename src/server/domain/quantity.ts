import type { Quantity, Unit } from '../../shared/types.js';

/** Display/comparison precision per unit, as in the prototype: g → 0.1, kg → 0.001. */
export const decimals = (unit: Unit) => (unit === 'kg' ? 3 : 1);

export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === 'g' ? value / 1000 : value * 1000;
}

export const toKg = (q: Quantity) => convert(q.value, q.unit, 'kg');

/** Integer count of the smallest displayed step — avoids floating-point boundary errors. */
export const steps = (value: number, unit: Unit) => Math.round(value * 10 ** decimals(unit));

export const roundTo = (value: number, unit: Unit) => steps(value, unit) / 10 ** decimals(unit);
