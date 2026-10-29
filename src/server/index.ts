import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import express from 'express';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 5180);
const host = '127.0.0.1';
const root = resolve(import.meta.dirname, '../..');
const dataDir = process.env.DATA_DIR ?? join(root, 'data/runtime');

const { app } = createApp({ dataDir });

if (process.env.NODE_ENV === 'production') {
  const dist = join(root, 'dist/client');
  if (!existsSync(dist)) throw new Error('Run `npm run build` first');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
} else {
  // Single origin in dev: Vite runs as Express middleware, so UI and API share one port.
  const { createServer } = await import('vite');
  const vite = await createServer({ configFile: join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, host, () => {
  console.log(`WeighingMS running at http://localhost:${port}`);
  console.log(`Data directory: ${dataDir}`);
});
