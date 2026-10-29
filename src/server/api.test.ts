import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

let ctx: ReturnType<typeof createApp>;
let api: ReturnType<typeof request>;
const dummyWeight = (scaleId: string, value: number) => api.post(`/api/_dummy/scales/${scaleId}/weight`).send({ value });

beforeEach(() => {
  ctx = createApp({ dataDir: mkdtempSync(join(tmpdir(), 'wms-')) });
  api = request(ctx.app);
});

describe('Dummy OrgaTEX API', () => {
  it('GET /api/batches returns the prototype queue', async () => {
    const res = await api.get('/api/batches').expect(200);
    expect(res.body.map((b: { batchId: string }) => b.batchId)).toEqual(['B-24187', 'B-24188', 'B-24190', 'B-24191']);
  });

  it('GET /api/batches/B-24187 returns batch context', async () => {
    const res = await api.get('/api/batches/B-24187').expect(200);
    expect(res.body).toMatchObject({ orderId: 'SO-9931', machine: 'JET-04', shade: 'Teal 4C', componentCount: 5 });
  });

  it('GET /api/batches/B-24187/recipe returns five components', async () => {
    const res = await api.get('/api/batches/B-24187/recipe').expect(200);
    expect(res.body.components.map((c: { name: string }) => c.name)).toEqual([
      'Remazol Brill. Blue RSPL',
      'Remazol Red RB',
      'Remazol Yellow RGB',
      'Sodium Sulphate',
      'Soda Ash',
    ]);
  });

  it('unknown batch → 404', async () => {
    const res = await api.get('/api/batches/B-00000').expect(404);
    expect(res.body.error.code).toBe('BATCH_NOT_FOUND');
  });

  it('rejects an invalid consumption payload → 400', async () => {
    await api.post('/api/batches/B-24187/consumption').send({ lines: [] }).expect(400);
  });

  it('OrgaTEX offline → 503', async () => {
    await api.post('/api/_dummy/orgatex/offline').expect(200);
    const res = await api.get('/api/batches').expect(503);
    expect(res.body.error.code).toBe('ORGATEX_UNAVAILABLE');
  });
});

describe('Dummy Scale / Scanner / Printer API', () => {
  it('lists both scales', async () => {
    const res = await api.get('/api/scales').expect(200);
    expect(res.body).toMatchObject([
      { scaleId: 'scale-3kg', label: '3 kg precision', unit: 'g', status: 'READY' },
      { scaleId: 'scale-32kg', label: '32 kg floor', unit: 'kg', status: 'READY' },
    ]);
  });

  it('reads weight at scale resolution and tares to zero', async () => {
    await dummyWeight('scale-3kg', 93.54);
    expect((await api.get('/api/scales/scale-3kg/weight').expect(200)).body).toMatchObject({ value: 93.5, unit: 'g' });
    expect((await api.post('/api/scales/scale-3kg/tare').expect(200)).body.value).toBe(0);
  });

  it('offline scale → 503, unknown scale → 404', async () => {
    await api.post('/api/_dummy/scales/scale-3kg/offline');
    expect((await api.get('/api/scales/scale-3kg/weight').expect(503)).body.error.code).toBe('SCALE_UNAVAILABLE');
    await api.get('/api/scales/nope/weight').expect(404);
  });

  it('scanner delivers injected scans once', async () => {
    await api.get('/api/scanner/next').expect(204);
    await api.post('/api/_dummy/scanner/scan').send({ code: 'B-24187' }).expect(202);
    expect((await api.get('/api/scanner/next').expect(200)).body.code).toBe('B-24187');
    await api.get('/api/scanner/next').expect(204);
  });

  it('printer offline → 503', async () => {
    await api.post('/api/_dummy/printer/offline');
    const t = { title: 't', batchId: 'B', orderId: 'O', machine: 'M', shade: 'S', date: 'd', operator: 'o', lines: [], verdict: 'v', barcode: 'B', reprint: false };
    expect((await api.post('/api/tickets').send(t).expect(503)).body.error.code).toBe('PRINTER_UNAVAILABLE');
  });
});

describe('Station workflow — B-24187', () => {
  const start = () => api.post('/api/station/session').send({ batchId: 'B-24187', operatorId: 'OP-017' }).expect(201);
  const weighActive = async (value: number) => {
    const s = (await api.get('/api/station/session')).body;
    const c = s.components.find((x: { state: string }) => x.state === 'active');
    await dummyWeight(c.scaleId, value);
    return c;
  };

  it('opens a session with auto-selected scales and first component active', async () => {
    const s = (await start()).body;
    expect(s.components.map((c: { scaleLabel: string }) => c.scaleLabel)).toEqual([
      '3 kg precision', '3 kg precision', '3 kg precision', '32 kg floor', '32 kg floor',
    ]);
    expect(s.components[0].state).toBe('active');
  });

  it('refuses confirmation out of tolerance (409) and records nothing', async () => {
    await start();
    await weighActive(1233.9); // Blue RSPL 1240 ±6 → below
    const res = await api.post('/api/station/confirm').expect(409);
    expect(res.body.error.code).toBe('OUT_OF_TOLERANCE');
    expect((await api.get('/api/weighings?batchId=B-24187')).body).toHaveLength(0);
  });

  it('records a full traceability set on confirmation and activates the next component', async () => {
    await start();
    await weighActive(1241.5);
    const s = (await api.post('/api/station/confirm').expect(200)).body;
    expect(s.components[0]).toMatchObject({ state: 'done', actual: { value: 1241.5, unit: 'g' } });
    expect(s.components[1].state).toBe('active');
    const [tx] = (await api.get('/api/weighings?batchId=B-24187')).body;
    expect(tx).toMatchObject({
      batchId: 'B-24187', componentId: 'DYE-4471-B', lot: '2026-0341', container: 'C-09',
      tare: { value: 214, unit: 'g' }, scaleId: 'scale-3kg', target: { value: 1240, unit: 'g' },
      actual: { value: 1241.5, unit: 'g' }, result: 'IN_TOLERANCE', operatorId: 'OP-017',
    });
    expect(tx.timestamp).toMatch(/Z$/);
  });

  it('cannot complete an incomplete batch (409)', async () => {
    await start();
    expect((await api.post('/api/station/complete').expect(409)).body.error.code).toBe('BATCH_INCOMPLETE');
  });

  it('scale offline blocks confirmation (503)', async () => {
    await start();
    await weighActive(1240);
    await api.post('/api/_dummy/scales/scale-3kg/offline');
    expect((await api.post('/api/station/confirm').expect(503)).body.error.code).toBe('SCALE_UNAVAILABLE');
  });

  it('re-tare zeroes, quit returns the component to pending', async () => {
    await start();
    await weighActive(500);
    expect((await api.post('/api/station/retare').expect(200)).body.value).toBe(0);
    const s = (await api.post('/api/station/quit').expect(200)).body;
    expect(s.components[0].state).toBe('pending');
  });

  it('completes all five components, writes back to OrgaTEX and prints the ticket', async () => {
    await start();
    for (const v of [1241.5, 385.4, 94.2, 23.98, 9.621]) {
      await weighActive(v);
      await api.post('/api/station/confirm').expect(200);
    }
    const s = (await api.get('/api/station/session')).body;
    expect(s.status).toBe('COMPLETED');
    expect(s.summary).toMatchObject({ componentsWeighed: 5, allWithinTolerance: true, totalDispensedKg: 35.322, operator: 'R. Karim' });
    expect(s.summary.writeBack.status).toBe('CONFIRMED');
    const posts = (await api.get('/api/batches/B-24187/consumption')).body;
    expect(posts[0].lines).toHaveLength(5);

    const printed = (await api.post('/api/station/ticket').expect(200)).body;
    expect(printed.ticket.printed).toBe(true);
    expect(printed.ticket.ticket.verdict).toBe('ALL WITHIN TOLERANCE');
    const reprint = (await api.post('/api/station/ticket').expect(200)).body;
    expect(reprint.ticket.ticket.reprint).toBe(true);
  });

  it('keeps records and marks write-back PENDING when OrgaTEX is down, then retries', async () => {
    await start();
    await api.post('/api/_dummy/orgatex/offline');
    for (const v of [1240, 386, 94, 24, 9.6]) {
      await weighActive(v);
      await api.post('/api/station/confirm').expect(200);
    }
    const s = (await api.get('/api/station/session')).body;
    expect(s.summary.writeBack.status).toBe('PENDING');
    expect((await api.get('/api/weighings?batchId=B-24187')).body).toHaveLength(5);
    await api.post('/api/_dummy/orgatex/online');
    const retried = (await api.post('/api/station/writeback/retry').expect(200)).body;
    expect(retried.summary.writeBack.status).toBe('CONFIRMED');
  });

  it('rejects override by a non-supervisor or without reason', async () => {
    await start();
    await weighActive(1260);
    await api.post('/api/station/override').send({ supervisorId: 'OP-017', reason: 'x' }).expect(403);
    await api.post('/api/station/override').send({ supervisorId: 'SV-003', reason: ' ' }).expect(400);
  });
});
