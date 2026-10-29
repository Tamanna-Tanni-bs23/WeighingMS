import type {
  Batch,
  ConsumptionAck,
  ConsumptionPost,
  PrintJob,
  Recipe,
  ScaleInfo,
  Ticket,
  WeightReading,
} from '../shared/types.js';

// Ports: the only way the WeighingMS core reaches external systems (IR-07).
// Training adapters wrap the Dummy services; a real integration replaces one adapter.

export interface OrgatexPort {
  listBatches(): Promise<Batch[]>;
  getBatch(batchId: string): Promise<Batch>;
  getRecipe(batchId: string): Promise<Recipe>;
  postConsumption(post: ConsumptionPost): Promise<ConsumptionAck>;
}

export interface ScalePort {
  info(scaleId: string): Promise<ScaleInfo>;
  read(scaleId: string): Promise<WeightReading>;
  tare(scaleId: string): Promise<WeightReading>;
}

export interface PrinterPort {
  print(ticket: Ticket): Promise<PrintJob>;
}
