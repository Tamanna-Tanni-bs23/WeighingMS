import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { Batch, ConsumptionAck, ConsumptionPost, Recipe } from '../../shared/types.js';
import { notFound, unavailable } from '../errors.js';
import { JsonFile } from '../store/json-file.js';
import seedBatches from './data/batches.json' with { type: 'json' };
import seedRecipes from './data/recipes.json' with { type: 'json' };

// DUMMY OrgaTEX — training contract only. Not a claim about the real SETEX interface (A-01, A-02).

export interface StoredConsumption extends ConsumptionPost, ConsumptionAck {}

export class DummyOrgatex {
  online = true;
  linkedAt = new Date().toISOString();
  private readonly consumption: JsonFile<StoredConsumption[]>;
  private batches: Batch[];

  constructor(dataDir: string) {
    this.consumption = new JsonFile(dataDir, 'orgatex-consumption.json', () => []);
    this.batches = structuredClone(seedBatches as Batch[]);
    // A batch whose consumption has already been received is no longer weighable.
    for (const post of this.consumption.read()) this.setStatus(post.batchId, 'WEIGHED');
  }

  private ensureOnline() {
    if (!this.online) throw unavailable('ORGATEX_UNAVAILABLE', 'OrgaTEX is not reachable');
  }

  private setStatus(batchId: string, status: Batch['status']) {
    const b = this.batches.find((x) => x.batchId === batchId);
    if (b) b.status = status;
  }

  listBatches(): Batch[] {
    this.ensureOnline();
    return structuredClone(this.batches);
  }

  getBatch(batchId: string): Batch {
    this.ensureOnline();
    const b = this.batches.find((x) => x.batchId === batchId);
    if (!b) throw notFound('BATCH_NOT_FOUND', `Batch ${batchId} not found`);
    return structuredClone(b);
  }

  getRecipe(batchId: string): Recipe {
    this.getBatch(batchId);
    const r = (seedRecipes as Record<string, Recipe>)[batchId];
    if (!r) throw notFound('RECIPE_NOT_FOUND', `No recipe for batch ${batchId}`);
    return structuredClone(r);
  }

  postConsumption(post: ConsumptionPost): ConsumptionAck {
    this.getBatch(post.batchId);
    const ack: ConsumptionAck = { postId: randomUUID(), batchId: post.batchId, receivedAt: new Date().toISOString() };
    this.consumption.update((all) => [...all, { ...post, ...ack }]);
    this.setStatus(post.batchId, 'WEIGHED');
    return ack;
  }

  listConsumption(batchId?: string): StoredConsumption[] {
    return this.consumption.read().filter((p) => !batchId || p.batchId === batchId);
  }

  reset() {
    this.online = true;
    this.consumption.write([]);
    this.batches = structuredClone(seedBatches as Batch[]);
  }
}

const quantity = z.object({ value: z.number(), unit: z.enum(['g', 'kg']) });
const consumptionSchema = z.object({
  operatorId: z.string().min(1),
  completedAt: z.string().min(1),
  lines: z
    .array(
      z.object({
        componentId: z.string(),
        code: z.string(),
        lot: z.string(),
        target: quantity,
        actual: quantity,
        scaleId: z.string(),
        result: z.enum(['IN_TOLERANCE', 'OVERRIDE']),
      }),
    )
    .min(1),
});

export function orgatexRouter(otx: DummyOrgatex): Router {
  const r = Router();
  r.get('/batches', (_req, res) => res.json(otx.listBatches()));
  r.get('/batches/:batchId', (req, res) => res.json(otx.getBatch(req.params.batchId)));
  r.get('/batches/:batchId/recipe', (req, res) => res.json(otx.getRecipe(req.params.batchId)));
  r.post('/batches/:batchId/consumption', (req, res) => {
    const body = consumptionSchema.parse(req.body);
    res.status(200).json(otx.postConsumption({ batchId: req.params.batchId, ...body }));
  });
  r.get('/batches/:batchId/consumption', (req, res) => res.json(otx.listConsumption(req.params.batchId)));
  return r;
}
