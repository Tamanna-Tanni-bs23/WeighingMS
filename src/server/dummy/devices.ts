import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { PrintJob, ScaleInfo, Ticket, WeightReading } from '../../shared/types.js';
import type { ScaleDefinition } from '../config.js';
import { notFound, unavailable } from '../errors.js';
import { JsonFile } from '../store/json-file.js';

// DUMMY devices — scales, scanner, printer. Training stand-ins; real protocols unknown (A-04, A-05, A-10).

const POUR_TICK_MS = 34;

interface ScaleState {
  def: ScaleDefinition;
  online: boolean;
  /** Net reading in the scale's own unit. */
  value: number;
  timer?: NodeJS.Timeout;
}

export class DummyScales {
  private readonly scales = new Map<string, ScaleState>();

  constructor(defs: ScaleDefinition[]) {
    for (const def of defs) this.scales.set(def.scaleId, { def, online: true, value: 0 });
  }

  private get(scaleId: string): ScaleState {
    const s = this.scales.get(scaleId);
    if (!s) throw notFound('SCALE_NOT_FOUND', `Scale ${scaleId} not found`);
    return s;
  }

  private ensureOnline(s: ScaleState) {
    if (!s.online) throw unavailable('SCALE_UNAVAILABLE', `Scale ${s.def.label} is offline`);
  }

  private round(s: ScaleState, v: number) {
    const steps = Math.round(v / s.def.resolution);
    return Number((steps * s.def.resolution).toFixed(6));
  }

  info(scaleId: string): ScaleInfo {
    const s = this.get(scaleId);
    return { ...s.def, status: s.online ? 'READY' : 'OFFLINE' };
  }

  list(): ScaleInfo[] {
    return [...this.scales.keys()].map((id) => this.info(id));
  }

  read(scaleId: string): WeightReading {
    const s = this.get(scaleId);
    this.ensureOnline(s);
    return {
      scaleId,
      value: this.round(s, s.value),
      unit: s.def.unit,
      stable: !s.timer,
      timestamp: new Date().toISOString(),
    };
  }

  tare(scaleId: string): WeightReading {
    const s = this.get(scaleId);
    this.ensureOnline(s);
    this.stop(s);
    s.value = 0;
    return this.read(scaleId);
  }

  // ── Simulation controls (training only) ──────────────────────────
  setWeight(scaleId: string, value: number) {
    const s = this.get(scaleId);
    this.stop(s);
    s.value = value;
  }

  /** Simulated hand pour: fast at first, easing off near the landing value. */
  pour(scaleId: string, landing: number, reference: number) {
    const s = this.get(scaleId);
    this.ensureOnline(s);
    this.stop(s);
    s.value = 0;
    s.timer = setInterval(() => {
      const remaining = landing - s.value;
      if (remaining <= s.def.resolution / 2) {
        s.value = landing;
        this.stop(s);
        return;
      }
      s.value = Math.min(landing, s.value + Math.max(reference * 0.004, remaining * 0.055));
    }, POUR_TICK_MS);
  }

  setOnline(scaleId: string, online: boolean) {
    const s = this.get(scaleId);
    s.online = online;
    if (!online) this.stop(s);
  }

  private stop(s: ScaleState) {
    if (s.timer) clearInterval(s.timer);
    s.timer = undefined;
  }

  reset() {
    for (const s of this.scales.values()) {
      this.stop(s);
      s.value = 0;
      s.online = true;
    }
  }
}

export class DummyScanner {
  online = true;
  private queue: { code: string; timestamp: string }[] = [];

  inject(code: string) {
    if (!this.online) throw unavailable('SCANNER_UNAVAILABLE', 'Scanner is offline');
    this.queue.push({ code, timestamp: new Date().toISOString() });
  }

  next() {
    if (!this.online) throw unavailable('SCANNER_UNAVAILABLE', 'Scanner is offline');
    return this.queue.shift();
  }

  reset() {
    this.online = true;
    this.queue = [];
  }
}

export class DummyPrinter {
  online = true;
  private readonly jobs: JsonFile<PrintJob[]>;

  constructor(dataDir: string) {
    this.jobs = new JsonFile(dataDir, 'printed-tickets.json', () => []);
  }

  print(ticket: Ticket): PrintJob {
    if (!this.online) throw unavailable('PRINTER_UNAVAILABLE', 'Printer is offline');
    const job: PrintJob = { ticketId: `TKT-${randomUUID().slice(0, 8).toUpperCase()}`, printedAt: new Date().toISOString(), ticket };
    this.jobs.update((all) => [...all, job]);
    return job;
  }

  list(): PrintJob[] {
    return this.jobs.read();
  }

  reset() {
    this.online = true;
    this.jobs.write([]);
  }
}

const quantity = z.object({ value: z.number(), unit: z.enum(['g', 'kg']) });
const ticketSchema = z.object({
  title: z.string(),
  batchId: z.string(),
  orderId: z.string(),
  machine: z.string(),
  shade: z.string(),
  date: z.string(),
  operator: z.string(),
  lines: z.array(z.object({ name: z.string(), target: quantity, actual: quantity, result: z.enum(['IN_TOLERANCE', 'OVERRIDE']) })),
  verdict: z.string(),
  barcode: z.string(),
  reprint: z.boolean(),
});

export function devicesRouter(scales: DummyScales, scanner: DummyScanner, printer: DummyPrinter): Router {
  const r = Router();
  r.get('/scales', (_req, res) => res.json(scales.list()));
  r.get('/scales/:scaleId/status', (req, res) => res.json(scales.info(req.params.scaleId)));
  r.get('/scales/:scaleId/weight', (req, res) => res.json(scales.read(req.params.scaleId)));
  r.post('/scales/:scaleId/tare', (req, res) => res.json(scales.tare(req.params.scaleId)));

  r.get('/scanner/status', (_req, res) => res.json({ status: scanner.online ? 'READY' : 'OFFLINE' }));
  r.get('/scanner/next', (_req, res) => {
    const scan = scanner.next();
    if (!scan) res.status(204).end();
    else res.json(scan);
  });

  r.get('/printer/status', (_req, res) => res.json({ status: printer.online ? 'READY' : 'OFFLINE' }));
  r.post('/tickets', (req, res) => res.status(201).json(printer.print(ticketSchema.parse(req.body))));
  r.get('/tickets', (_req, res) => res.json(printer.list()));
  return r;
}
