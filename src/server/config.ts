import type { Operator, Unit } from '../shared/types.js';

export interface ScaleDefinition {
  scaleId: string;
  label: string;
  unit: Unit;
  resolution: number;
  capacity: number;
}

export interface StationConfig {
  stationId: string;
  /** Targets at or below this many kg go to the precision scale (project-requirement §5.3). */
  scaleThresholdKg: number;
  precisionScaleId: string;
  floorScaleId: string;
  scales: ScaleDefinition[];
  operators: Operator[];
  defaultOperatorId: string;
}

// Configuration, not code: thresholds and scale assignment can change without touching rules.
export const defaultConfig: StationConfig = {
  stationId: 'STATION 01',
  scaleThresholdKg: 3,
  precisionScaleId: 'scale-3kg',
  floorScaleId: 'scale-32kg',
  scales: [
    { scaleId: 'scale-3kg', label: '3 kg precision', unit: 'g', resolution: 0.1, capacity: 3000 },
    { scaleId: 'scale-32kg', label: '32 kg floor', unit: 'kg', resolution: 0.001, capacity: 32 },
  ],
  operators: [
    { operatorId: 'OP-017', name: 'R. Karim', shift: 'Shift A', supervisor: false },
    { operatorId: 'OP-022', name: 'N. Akter', shift: 'Shift A', supervisor: false },
    { operatorId: 'SV-003', name: 'M. Hossain', shift: 'Shift A', supervisor: true },
  ],
  defaultOperatorId: 'OP-017',
};
