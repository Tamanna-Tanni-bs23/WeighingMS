// API contract types shared by client and server.
// Dummy OrgaTEX / device shapes are TRAINING CONTRACTS, not the real OrgaTEX interface.

export type Unit = 'g' | 'kg';

export interface Quantity {
  value: number;
  unit: Unit;
}

export type BatchStatus = 'RELEASED' | 'WEIGHING' | 'WEIGHED' | 'ON_HOLD';

export interface Batch {
  batchId: string;
  orderId: string;
  machine: string;
  fabric: string;
  shade: string;
  componentCount: number;
  status: BatchStatus;
  queuedAt: string;
  trainingData?: boolean;
}

export interface RecipeComponent {
  componentId: string;
  sequence: number;
  code: string;
  name: string;
  shortName: string;
  colour: string;
  target: Quantity;
  tolerance: Quantity;
  lot: string;
  container: string;
  tare: Quantity;
}

export interface Recipe {
  batchId: string;
  shade: string;
  components: RecipeComponent[];
}

export interface ConsumptionLine {
  componentId: string;
  code: string;
  lot: string;
  target: Quantity;
  actual: Quantity;
  scaleId: string;
  result: WeighResult;
}

export interface ConsumptionPost {
  batchId: string;
  operatorId: string;
  completedAt: string;
  lines: ConsumptionLine[];
}

export interface ConsumptionAck {
  postId: string;
  batchId: string;
  receivedAt: string;
}

export type ScaleStatus = 'READY' | 'OFFLINE';

export interface ScaleInfo {
  scaleId: string;
  label: string;
  unit: Unit;
  resolution: number;
  capacity: number;
  status: ScaleStatus;
}

export interface WeightReading {
  scaleId: string;
  value: number;
  unit: Unit;
  stable: boolean;
  timestamp: string;
}

export interface TicketLine {
  name: string;
  target: Quantity;
  actual: Quantity;
  result: WeighResult;
}

export interface Ticket {
  title: string;
  batchId: string;
  orderId: string;
  machine: string;
  shade: string;
  date: string;
  operator: string;
  lines: TicketLine[];
  verdict: string;
  barcode: string;
  reprint: boolean;
}

export interface PrintJob {
  ticketId: string;
  printedAt: string;
  ticket: Ticket;
}

export type Zone = 'UNDER' | 'IN_RANGE' | 'TARGET' | 'OVER';
export type WeighResult = 'IN_TOLERANCE' | 'OVERRIDE';

export interface Operator {
  operatorId: string;
  name: string;
  shift: string;
  supervisor: boolean;
}

export type ComponentState = 'pending' | 'active' | 'done';

export interface WeighingTransaction {
  transactionId: string;
  batchId: string;
  componentId: string;
  code: string;
  name: string;
  lot: string;
  container: string;
  tare: Quantity;
  scaleId: string;
  target: Quantity;
  tolerance: Quantity;
  actual: Quantity;
  result: WeighResult;
  operatorId: string;
  supervisorId?: string;
  reason?: string;
  timestamp: string;
}

export interface SessionComponent extends RecipeComponent {
  state: ComponentState;
  scaleId: string;
  scaleLabel: string;
  displayMax: number;
  actual?: Quantity;
  result?: WeighResult;
}

export type WriteBackStatus = 'NOT_STARTED' | 'CONFIRMED' | 'PENDING';

export interface CompletionSummary {
  componentsWeighed: number;
  componentCount: number;
  allWithinTolerance: boolean;
  totalDispensedKg: number;
  elapsedSeconds: number;
  operator: string;
  writeBack: { status: WriteBackStatus; confirmedAt?: string; postId?: string; error?: string };
}

export interface WeighingSession {
  sessionId: string;
  batch: Batch;
  operatorId: string;
  startedAt: string;
  completedAt?: string;
  status: 'WEIGHING' | 'COMPLETED';
  components: SessionComponent[];
  summary?: CompletionSummary;
  ticket?: { ticketId?: string; printed: boolean; printError?: string; ticket: Ticket };
}

export interface Evaluation {
  zone: Zone;
  near: boolean;
  min: number;
  max: number;
  surplus: number;
  surplusPct: number;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
