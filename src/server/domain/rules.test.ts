import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config.js';
import { selectScale } from './scale-selection.js';
import { evaluate, isConfirmable } from './tolerance.js';

const g = (value: number) => ({ value, unit: 'g' as const });
const kg = (value: number) => ({ value, unit: 'kg' as const });

describe('tolerance evaluation — Yellow RGB, target 94.0 g ±0.5 g (workbook Step 22)', () => {
  const cases: [number, string, boolean][] = [
    [93.4, 'UNDER', false],
    [93.5, 'IN_RANGE', true],
    [94.0, 'TARGET', true],
    [94.5, 'IN_RANGE', true],
    [94.6, 'OVER', false],
  ];
  for (const [w, zone, ok] of cases) {
    it(`${w} g → ${zone}, confirm ${ok ? 'allowed' : 'blocked'}`, () => {
      const e = evaluate(w, 'g', g(94), g(0.5));
      expect(e.zone).toBe(zone);
      expect(isConfirmable(e)).toBe(ok);
    });
  }

  it('reports the band for the caption (93.5 – 94.5)', () => {
    const e = evaluate(0, 'g', g(94), g(0.5));
    expect([e.min, e.max]).toEqual([93.5, 94.5]);
  });

  it('flags "near" from 90 % of target while still under', () => {
    expect(evaluate(84.5, 'g', g(94), g(0.5)).near).toBe(false);
    expect(evaluate(84.6, 'g', g(94), g(0.5)).near).toBe(true);
  });

  it('calculates surplus and percent on overshoot (prototype: +2.4 g, +2.6 %)', () => {
    const e = evaluate(96.4, 'g', g(94), g(0.5));
    expect(e.zone).toBe('OVER');
    expect(e.surplus).toBe(2.4);
    expect(e.surplusPct).toBe(2.6);
  });

  it('is immune to floating-point noise at the boundary', () => {
    expect(evaluate(93.5000000001, 'g', g(94), g(0.5)).zone).toBe('IN_RANGE');
    expect(evaluate(0.1 + 0.2 + 94.2, 'g', g(94), g(0.5)).zone).toBe('IN_RANGE');
  });
});

describe('tolerance evaluation — kg components and unit conversion', () => {
  it('Sodium Sulphate 24.000 kg ±0.120 kg', () => {
    expect(evaluate(23.879, 'kg', kg(24), kg(0.12)).zone).toBe('UNDER');
    expect(evaluate(23.88, 'kg', kg(24), kg(0.12)).zone).toBe('IN_RANGE');
    expect(evaluate(24.12, 'kg', kg(24), kg(0.12)).zone).toBe('IN_RANGE');
    expect(evaluate(24.121, 'kg', kg(24), kg(0.12)).zone).toBe('OVER');
  });

  it('project-requirement §7 example: 1.000 kg ±0.010 kg', () => {
    const t = kg(1), tol = kg(0.01);
    expect(evaluate(0.98, 'kg', t, tol).zone).toBe('UNDER');
    expect(evaluate(0.995, 'kg', t, tol).zone).toBe('IN_RANGE');
    expect(evaluate(1.0, 'kg', t, tol).zone).toBe('TARGET');
    expect(evaluate(1.008, 'kg', t, tol).zone).toBe('IN_RANGE');
    expect(evaluate(1.02, 'kg', t, tol).zone).toBe('OVER');
  });

  it('evaluates a gram reading against a kg target', () => {
    expect(evaluate(995, 'g', kg(1), kg(0.01)).zone).toBe('IN_RANGE');
  });
});

describe('scale selection (project-requirement §5.3)', () => {
  const cfg = defaultConfig;
  it.each([
    [g(94), 'scale-3kg'],
    [g(1240), 'scale-3kg'],
    [kg(0.25), 'scale-3kg'],
    [kg(3), 'scale-3kg'],
    [g(3000), 'scale-3kg'],
    [kg(3.001), 'scale-32kg'],
    [kg(24), 'scale-32kg'],
    [kg(9.6), 'scale-32kg'],
  ])('%o → %s', (target, scale) => {
    expect(selectScale(target, cfg)).toBe(scale);
  });

  it('follows configuration, not code', () => {
    expect(selectScale(kg(2.5), { ...cfg, scaleThresholdKg: 2 })).toBe('scale-32kg');
  });
});

describe('surplus proposal — ADR-001 information only', async () => {
  const { proportionalProposal } = await import('./surplus.js');
  it('reproduces the prototype figures for a +2.6 % Yellow RGB overshoot', () => {
    const lines = proportionalProposal(2.6, [
      { componentId: 'AUX-0101', name: 'Sodium Sulphate', target: kg(24) },
      { componentId: 'AUX-0107', name: 'Soda Ash', target: kg(9.6) },
    ]);
    expect(lines.map((l) => l.proposed.value)).toEqual([24.624, 9.85]);
    expect(lines.map((l) => l.current.value)).toEqual([24, 9.6]);
  });
});
