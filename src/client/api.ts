import type {
  Batch,
  Evaluation,
  Operator,
  Quantity,
  ScaleInfo,
  WeighingSession,
  WeightReading,
} from '../shared/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? 'HTTP_ERROR', data?.error?.message ?? res.statusText);
  return data as T;
}

export interface Health {
  scales: ScaleInfo[];
  scanner: 'READY' | 'OFFLINE';
  printer: 'READY' | 'OFFLINE';
  orgatex: { status: 'LINKED' | 'OFFLINE'; linkedAt: string };
}

export interface Live {
  reading: WeightReading;
  value: number;
  evaluation: Evaluation;
  /** ADR-001: information only — shade-ratio targets for remaining components, never applied. */
  proposal: { componentId: string; name: string; current: Quantity; proposed: Quantity }[];
}

export interface StationConfigView {
  stationId: string;
  operators: Operator[];
  defaultOperatorId: string;
}

export const api = {
  config: () => call<StationConfigView>('GET', '/api/station/config'),
  health: () => call<Health>('GET', '/api/health'),
  batches: () => call<Batch[]>('GET', '/api/batches'),
  session: () => call<WeighingSession | null>('GET', '/api/station/session'),
  start: (batchId: string, operatorId: string) => call<WeighingSession>('POST', '/api/station/session', { batchId, operatorId }),
  activate: (componentId: string) => call<WeighingSession>('POST', `/api/station/components/${componentId}/activate`),
  live: () => call<Live>('GET', '/api/station/live'),
  retare: () => call<WeightReading>('POST', '/api/station/retare'),
  quit: () => call<WeighingSession>('POST', '/api/station/quit'),
  confirm: () => call<WeighingSession>('POST', '/api/station/confirm'),
  override: (supervisorId: string, reason: string) => call<WeighingSession>('POST', '/api/station/override', { supervisorId, reason }),
  retryWriteBack: () => call<WeighingSession>('POST', '/api/station/writeback/retry'),
  printTicket: () => call<WeighingSession>('POST', '/api/station/ticket'),
  next: () => call<void>('POST', '/api/station/session/next'),
  abandon: () => call<void>('POST', '/api/station/session/abandon'),
  nextScan: () => call<{ code: string } | undefined>('GET', '/api/scanner/next'),
  // Training simulator (Dummy Scale controls)
  simPour: (scaleId: string, landing: number, reference: number) =>
    call('POST', `/api/_dummy/scales/${scaleId}/pour`, { landing, reference }),
  simWeight: (scaleId: string, value: number) => call('POST', `/api/_dummy/scales/${scaleId}/weight`, { value }),
};
