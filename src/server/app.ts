import express, { Router } from 'express';
import { z } from 'zod';
import { dummyOrgatexAdapter, dummyPrinterAdapter, dummyScaleAdapter } from './adapters/dummy-adapters.js';
import { StationService } from './application/station.js';
import { defaultConfig, type StationConfig } from './config.js';
import { DummyPrinter, DummyScales, DummyScanner, devicesRouter } from './dummy/devices.js';
import { DummyOrgatex, orgatexRouter } from './dummy/orgatex.js';
import { errorMiddleware } from './errors.js';

export interface AppOptions {
  dataDir: string;
  config?: StationConfig;
}

export function createApp({ dataDir, config = defaultConfig }: AppOptions) {
  const orgatex = new DummyOrgatex(dataDir);
  const scales = new DummyScales(config.scales);
  const scanner = new DummyScanner();
  const printer = new DummyPrinter(dataDir);
  const station = new StationService({
    config,
    dataDir,
    orgatex: dummyOrgatexAdapter(orgatex),
    scales: dummyScaleAdapter(scales),
    printer: dummyPrinterAdapter(printer),
  });

  const app = express();
  app.use(express.json());

  // Dummy external systems (training contracts)
  app.use('/api', orgatexRouter(orgatex));
  app.use('/api', devicesRouter(scales, scanner, printer));

  // WeighingMS station API
  app.use('/api', stationRouter(station, config));

  // Aggregate device / integration health for the status strip
  app.get('/api/health', (_req, res) => {
    res.json({
      scales: scales.list(),
      scanner: scanner.online ? 'READY' : 'OFFLINE',
      printer: printer.online ? 'READY' : 'OFFLINE',
      orgatex: { status: orgatex.online ? 'LINKED' : 'OFFLINE', linkedAt: orgatex.linkedAt },
    });
  });

  // Training-only controls — NOT part of the product boundary
  app.use('/api/_dummy', controlRouter({ orgatex, scales, scanner, printer, station }));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route' } });
  });
  app.use(errorMiddleware);
  return { app, orgatex, scales, scanner, printer, station };
}

function stationRouter(station: StationService, config: StationConfig): Router {
  const r = Router();
  r.get('/station/config', (_req, res) =>
    res.json({ stationId: config.stationId, operators: station.operators(), defaultOperatorId: config.defaultOperatorId, scaleThresholdKg: config.scaleThresholdKg }),
  );
  r.get('/station/session', (_req, res) => res.json(station.current()));
  r.post('/station/session', async (req, res) => {
    const { batchId, operatorId } = z.object({ batchId: z.string().min(1), operatorId: z.string().min(1) }).parse(req.body);
    res.status(201).json(await station.start(batchId, operatorId));
  });
  r.post('/station/session/abandon', (_req, res) => {
    station.abandon();
    res.status(204).end();
  });
  r.post('/station/session/next', (_req, res) => {
    station.next();
    res.status(204).end();
  });
  r.post('/station/components/:componentId/activate', async (req, res) => res.json(await station.activate(req.params.componentId)));
  r.get('/station/live', async (_req, res) => res.json(await station.live()));
  r.post('/station/retare', async (_req, res) => res.json(await station.retare()));
  r.post('/station/quit', (_req, res) => res.json(station.quit()));
  r.post('/station/confirm', async (_req, res) => res.json(await station.confirm()));
  r.post('/station/override', async (req, res) => {
    const { supervisorId, reason } = z.object({ supervisorId: z.string().min(1), reason: z.string() }).parse(req.body);
    res.json(await station.override(supervisorId, reason));
  });
  r.post('/station/complete', async (_req, res) => res.json(await station.complete()));
  r.post('/station/writeback/retry', async (_req, res) => res.json(await station.writeBack()));
  r.post('/station/ticket', async (_req, res) => res.json(await station.print()));
  r.get('/weighings', (req, res) => res.json(station.weighings(typeof req.query.batchId === 'string' ? req.query.batchId : undefined)));
  return r;
}

function controlRouter(d: {
  orgatex: DummyOrgatex;
  scales: DummyScales;
  scanner: DummyScanner;
  printer: DummyPrinter;
  station: StationService;
}): Router {
  const r = Router();
  const online = z.enum(['online', 'offline']);
  r.post('/scales/:scaleId/weight', (req, res) => {
    const { value } = z.object({ value: z.number() }).parse(req.body);
    d.scales.setWeight(req.params.scaleId, value);
    res.json(d.scales.info(req.params.scaleId));
  });
  r.post('/scales/:scaleId/pour', (req, res) => {
    const { landing, reference } = z.object({ landing: z.number().nonnegative(), reference: z.number().positive().optional() }).parse(req.body);
    d.scales.pour(req.params.scaleId, landing, reference ?? landing);
    res.json(d.scales.info(req.params.scaleId));
  });
  r.post('/scales/:scaleId/:state', (req, res) => {
    d.scales.setOnline(req.params.scaleId, online.parse(req.params.state) === 'online');
    res.json(d.scales.info(req.params.scaleId));
  });
  r.post('/orgatex/:state', (req, res) => {
    d.orgatex.online = online.parse(req.params.state) === 'online';
    if (d.orgatex.online) d.orgatex.linkedAt = new Date().toISOString();
    res.json({ online: d.orgatex.online });
  });
  r.post('/printer/:state', (req, res) => {
    d.printer.online = online.parse(req.params.state) === 'online';
    res.json({ online: d.printer.online });
  });
  r.post('/scanner/scan', (req, res) => {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    d.scanner.inject(code);
    res.status(202).json({ queued: code });
  });
  r.post('/scanner/:state', (req, res) => {
    d.scanner.online = online.parse(req.params.state) === 'online';
    res.json({ online: d.scanner.online });
  });
  r.post('/reset', (_req, res) => {
    d.orgatex.reset();
    d.scales.reset();
    d.scanner.reset();
    d.printer.reset();
    d.station.reset();
    res.json({ reset: true });
  });
  return r;
}
