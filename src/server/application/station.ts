import { randomUUID } from 'node:crypto';
import type {
  CompletionSummary,
  Evaluation,
  Operator,
  Quantity,
  SessionComponent,
  Ticket,
  WeighingSession,
  WeighingTransaction,
  WeightReading,
} from '../../shared/types.js';
import type { StationConfig } from '../config.js';
import { AppError, conflict, notFound } from '../errors.js';
import type { OrgatexPort, PrinterPort, ScalePort } from '../ports.js';
import { convert, decimals, roundTo, toKg } from '../domain/quantity.js';
import { selectScale } from '../domain/scale-selection.js';
import { proportionalProposal, type SurplusProposalLine } from '../domain/surplus.js';
import { evaluate, isConfirmable } from '../domain/tolerance.js';
import { JsonFile } from '../store/json-file.js';

export interface StationDeps {
  config: StationConfig;
  orgatex: OrgatexPort;
  scales: ScalePort;
  printer: PrinterPort;
  dataDir: string;
  now?: () => Date;
}

/** Progress-bar full scale: ~1.33 × target, rounded up to two significant digits. */
function displayMax(target: Quantity) {
  const raw = target.value * 1.33;
  const mag = 10 ** (Math.floor(Math.log10(raw)) - 1);
  return Math.ceil(raw / mag) * mag;
}

export class StationService {
  private readonly session: JsonFile<WeighingSession | null>;
  private readonly archive: JsonFile<WeighingSession[]>;
  private readonly transactions: JsonFile<WeighingTransaction[]>;
  private readonly now: () => Date;

  constructor(private readonly d: StationDeps) {
    this.session = new JsonFile(d.dataDir, 'session.json', () => null);
    this.archive = new JsonFile(d.dataDir, 'sessions-archive.json', () => []);
    this.transactions = new JsonFile(d.dataDir, 'weighing-transactions.json', () => []);
    this.now = d.now ?? (() => new Date());
  }

  // ── Queries ───────────────────────────────────────────────────────
  operators(): Operator[] {
    return this.d.config.operators;
  }

  operator(operatorId: string): Operator {
    const op = this.d.config.operators.find((o) => o.operatorId === operatorId);
    if (!op) throw notFound('OPERATOR_NOT_FOUND', `Operator ${operatorId} not found`);
    return op;
  }

  current(): WeighingSession | null {
    return this.session.read();
  }

  weighings(batchId?: string): WeighingTransaction[] {
    return this.transactions.read().filter((t) => !batchId || t.batchId === batchId);
  }

  private require(): WeighingSession {
    const s = this.session.read();
    if (!s) throw conflict('NO_ACTIVE_SESSION', 'No batch is being weighed');
    return s;
  }

  private active(s: WeighingSession): SessionComponent {
    const c = s.components.find((x) => x.state === 'active');
    if (!c) throw conflict('NO_ACTIVE_COMPONENT', 'Select a component to weigh');
    return c;
  }

  private save(s: WeighingSession) {
    this.session.write(s);
    return s;
  }

  // ── Batch selection (FR-2, FR-3) ──────────────────────────────────
  async start(batchId: string, operatorId: string): Promise<WeighingSession> {
    this.operator(operatorId);
    const existing = this.session.read();
    if (existing && existing.status === 'WEIGHING') {
      if (existing.batch.batchId === batchId) return existing;
      throw conflict('SESSION_ACTIVE', `Batch ${existing.batch.batchId} is still being weighed`);
    }
    if (existing) this.closeSession(existing);

    const batch = await this.d.orgatex.getBatch(batchId);
    if (batch.status !== 'RELEASED' && batch.status !== 'WEIGHING') {
      throw conflict('BATCH_NOT_RELEASED', `Batch ${batchId} is ${batch.status} and cannot be weighed`);
    }
    const recipe = await this.d.orgatex.getRecipe(batchId);
    const components: SessionComponent[] = [...recipe.components]
      .sort((a, b) => a.sequence - b.sequence)
      .map((c) => {
        const scaleId = selectScale(c.target, this.d.config);
        const def = this.d.config.scales.find((s) => s.scaleId === scaleId);
        return { ...c, state: 'pending', scaleId, scaleLabel: def?.label ?? scaleId, displayMax: displayMax(c.target) };
      });
    const s: WeighingSession = {
      sessionId: randomUUID(),
      batch: { ...batch, status: 'WEIGHING' },
      operatorId,
      startedAt: this.now().toISOString(),
      status: 'WEIGHING',
      components,
    };
    const first = components[0];
    if (first) {
      first.state = 'active';
      await this.d.scales.tare(first.scaleId).catch(() => undefined);
    }
    return this.save(s);
  }

  // ── Component handling (FR-4, FR-7, FR-16, FR-17) ─────────────────
  async activate(componentId: string): Promise<WeighingSession> {
    const s = this.require();
    const c = s.components.find((x) => x.componentId === componentId);
    if (!c) throw notFound('COMPONENT_NOT_FOUND', `Component ${componentId} not in recipe`);
    if (c.state === 'done') throw conflict('COMPONENT_DONE', `${c.name} is already weighed`);
    for (const x of s.components) if (x.state === 'active') x.state = 'pending';
    c.state = 'active';
    await this.d.scales.tare(c.scaleId);
    return this.save(s);
  }

  async retare(): Promise<WeightReading> {
    const s = this.require();
    return this.d.scales.tare(this.active(s).scaleId);
  }

  quit(): WeighingSession {
    const s = this.require();
    const c = this.active(s);
    c.state = 'pending';
    return this.save(s);
  }

  /** Live reading converted to the active component's unit, with its evaluation. */
  async live(): Promise<{ reading: WeightReading; value: number; evaluation: Evaluation; proposal: SurplusProposalLine[] }> {
    const s = this.require();
    const c = this.active(s);
    const reading = await this.d.scales.read(c.scaleId);
    const value = roundTo(convert(reading.value, reading.unit, c.target.unit), c.target.unit);
    const evaluation = evaluate(value, c.target.unit, c.target, c.tolerance);
    const proposal =
      evaluation.zone === 'OVER' ? proportionalProposal(evaluation.surplusPct, s.components.filter((x) => x.state === 'pending')) : [];
    return { reading, value, evaluation, proposal };
  }

  // ── Confirmation (FR-13) ──────────────────────────────────────────
  async confirm(): Promise<WeighingSession> {
    const s = this.require();
    const c = this.active(s);
    const { value, evaluation } = await this.live();
    if (!isConfirmable(evaluation)) {
      const u = c.target.unit;
      throw conflict(
        'OUT_OF_TOLERANCE',
        `Weight ${value.toFixed(decimals(u))} ${u} is ${evaluation.zone === 'OVER' ? 'above' : 'below'} tolerance (${evaluation.min.toFixed(decimals(u))}–${evaluation.max.toFixed(decimals(u))} ${u})`,
        { value, evaluation },
      );
    }
    return this.record(s, c, value, 'IN_TOLERANCE');
  }

  /** FR-15: authorised exception. Surplus-handling rule per Step 24 decision (ADR-001). */
  async override(supervisorId: string, reason: string): Promise<WeighingSession> {
    const s = this.require();
    const c = this.active(s);
    const sup = this.operator(supervisorId);
    if (!sup.supervisor) throw new AppError(403, 'NOT_SUPERVISOR', `${sup.name} is not authorised to override`);
    if (!reason.trim()) throw new AppError(400, 'REASON_REQUIRED', 'An override needs a reason');
    const { value, evaluation } = await this.live();
    if (isConfirmable(evaluation)) throw conflict('OVERRIDE_NOT_NEEDED', 'Weight is within tolerance — confirm normally');
    if (value <= 0) throw conflict('NO_WEIGHT', 'Nothing on the scale to accept');
    return this.record(s, c, value, 'OVERRIDE', { supervisorId, reason: reason.trim() });
  }

  private async record(
    s: WeighingSession,
    c: SessionComponent,
    value: number,
    result: WeighingTransaction['result'],
    auth?: { supervisorId: string; reason: string },
  ): Promise<WeighingSession> {
    const actual: Quantity = { value, unit: c.target.unit };
    const tx: WeighingTransaction = {
      transactionId: randomUUID(),
      batchId: s.batch.batchId,
      componentId: c.componentId,
      code: c.code,
      name: c.name,
      lot: c.lot,
      container: c.container,
      tare: c.tare,
      scaleId: c.scaleId,
      target: c.target,
      tolerance: c.tolerance,
      actual,
      result,
      operatorId: s.operatorId,
      ...auth,
      timestamp: this.now().toISOString(),
    };
    this.transactions.update((all) => [...all, tx]);
    c.state = 'done';
    c.actual = actual;
    c.result = result;

    const next = s.components.find((x) => x.state === 'pending');
    if (next) {
      next.state = 'active';
      this.save(s);
      await this.d.scales.tare(next.scaleId).catch(() => undefined);
      return s;
    }
    this.save(s);
    return this.complete();
  }

  // ── Completion & write-back (FR-18, FR-19) ────────────────────────
  async complete(): Promise<WeighingSession> {
    const s = this.require();
    const pending = s.components.filter((c) => c.state !== 'done');
    if (pending.length) {
      throw conflict('BATCH_INCOMPLETE', `${pending.length} component(s) still to weigh`, {
        pending: pending.map((c) => c.componentId),
      });
    }
    if (s.status !== 'COMPLETED') {
      const completedAt = this.now();
      s.status = 'COMPLETED';
      s.completedAt = completedAt.toISOString();
      s.batch.status = 'WEIGHED';
      s.summary = {
        componentsWeighed: s.components.length,
        componentCount: s.components.length,
        allWithinTolerance: s.components.every((c) => c.result === 'IN_TOLERANCE'),
        totalDispensedKg: Math.round(s.components.reduce((sum, c) => sum + (c.actual ? toKg(c.actual) : 0), 0) * 1000) / 1000,
        elapsedSeconds: Math.round((completedAt.getTime() - new Date(s.startedAt).getTime()) / 1000),
        operator: this.operator(s.operatorId).name,
        writeBack: { status: 'NOT_STARTED' },
      };
      s.ticket = { printed: false, ticket: this.composeTicket(s, false) };
      this.save(s);
    }
    return this.writeBack();
  }

  async writeBack(): Promise<WeighingSession> {
    const s = this.require();
    const summary = s.summary as CompletionSummary | undefined;
    if (s.status !== 'COMPLETED' || !summary) throw conflict('BATCH_INCOMPLETE', 'Batch is not complete');
    if (summary.writeBack.status === 'CONFIRMED') return s;
    const tx = this.weighings(s.batch.batchId);
    const latest = new Map(tx.map((t) => [t.componentId, t]));
    try {
      const ack = await this.d.orgatex.postConsumption({
        batchId: s.batch.batchId,
        operatorId: s.operatorId,
        completedAt: s.completedAt as string,
        lines: s.components.map((c) => {
          const t = latest.get(c.componentId);
          return {
            componentId: c.componentId,
            code: c.code,
            lot: c.lot,
            target: c.target,
            actual: c.actual as Quantity,
            scaleId: c.scaleId,
            result: t?.result ?? 'IN_TOLERANCE',
          };
        }),
      });
      summary.writeBack = { status: 'CONFIRMED', confirmedAt: ack.receivedAt, postId: ack.postId };
    } catch (e) {
      // D-3: records are kept; write-back stays pending for a manual retry.
      summary.writeBack = { status: 'PENDING', error: e instanceof Error ? e.message : String(e) };
    }
    return this.save(s);
  }

  // ── Ticket (FR-20) ────────────────────────────────────────────────
  private composeTicket(s: WeighingSession, reprint: boolean): Ticket {
    const done = s.completedAt ? new Date(s.completedAt) : this.now();
    const allOk = s.components.every((c) => c.result === 'IN_TOLERANCE');
    return {
      title: 'FCI DYEING — WEIGHING TICKET',
      batchId: s.batch.batchId,
      orderId: s.batch.orderId,
      machine: s.batch.machine,
      shade: s.batch.shade,
      // Station local time, as printed on the physical ticket ("YYYY-MM-DD HH:MM").
      date: done.toLocaleString('sv-SE', { hour12: false }).slice(0, 16),
      operator: this.operator(s.operatorId).name,
      lines: s.components.map((c) => ({
        name: c.shortName,
        target: c.target,
        actual: c.actual as Quantity,
        result: c.result ?? 'IN_TOLERANCE',
      })),
      verdict: allOk ? 'ALL WITHIN TOLERANCE' : 'INCLUDES SUPERVISOR OVERRIDE',
      barcode: s.batch.batchId,
      reprint,
    };
  }

  async print(): Promise<WeighingSession> {
    const s = this.require();
    if (s.status !== 'COMPLETED' || !s.ticket) throw conflict('BATCH_INCOMPLETE', 'Batch is not complete');
    const reprint = s.ticket.printed;
    const ticket = this.composeTicket(s, reprint);
    try {
      const job = await this.d.printer.print(ticket);
      s.ticket = { ticketId: job.ticketId, printed: true, ticket };
    } catch (e) {
      s.ticket = { ...s.ticket, ticket, printError: e instanceof Error ? e.message : String(e) };
      this.save(s);
      throw e;
    }
    return this.save(s);
  }

  // ── Next batch ────────────────────────────────────────────────────
  next(): void {
    const s = this.session.read();
    if (!s) return;
    if (s.status !== 'COMPLETED') throw conflict('BATCH_INCOMPLETE', 'Finish or abandon the current batch first');
    this.closeSession(s);
  }

  /** Leave an unfinished batch: confirmed records stay, nothing is written back. */
  abandon(): void {
    const s = this.require();
    if (s.status === 'COMPLETED') throw conflict('BATCH_COMPLETED', 'Batch is complete — use Next batch');
    this.closeSession(s);
  }

  private closeSession(s: WeighingSession) {
    this.archive.update((all) => [...all, s]);
    this.session.write(null);
  }

  reset() {
    this.session.write(null);
    this.archive.write([]);
    this.transactions.write([]);
  }
}
