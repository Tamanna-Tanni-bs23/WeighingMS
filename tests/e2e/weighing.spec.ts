import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// Deterministic weights through the Dummy Scale control endpoint (training-only).
const setWeight = (request: APIRequestContext, scaleId: string, value: number) =>
  request.post(`/api/_dummy/scales/${scaleId}/weight`, { data: { value } });

async function selectBatch(page: Page) {
  await page.goto('/');
  await page.getByTestId('batch-B-24187').click();
  await expect(page.getByTestId('w-name')).toHaveText('Remazol Brill. Blue RSPL');
}

async function weighAndConfirm(page: Page, request: APIRequestContext, name: string, scaleId: string, value: number, shown: string) {
  await expect(page.getByTestId('w-name')).toHaveText(name);
  await setWeight(request, scaleId, value);
  await expect(page.getByTestId('w-now')).toHaveText(shown);
  await expect(page.getByTestId('btn-ok')).toBeEnabled();
  await page.getByTestId('btn-ok').click();
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/_dummy/reset');
});

test('full B-24187 workflow: 5 components → OrgaTEX write-back → ticket', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByTestId('batch-B-24187')).toBeVisible();
  await expect(page.locator('table.q tbody tr')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/evidence/screen-1-select-batch.png' });

  await page.getByTestId('batch-B-24187').click();
  await expect(page.getByTestId('w-scale')).toHaveText('3 kg precision');
  await page.screenshot({ path: 'test-results/evidence/screen-2-weigh.png' });

  await weighAndConfirm(page, request, 'Remazol Brill. Blue RSPL', 'scale-3kg', 1241.5, '1241.5');
  await weighAndConfirm(page, request, 'Remazol Red RB', 'scale-3kg', 385.4, '385.4');
  await expect(page.getByTestId('rail-done')).toHaveText('2');
  await weighAndConfirm(page, request, 'Remazol Yellow RGB', 'scale-3kg', 94.2, '94.2');

  // Scale switch: Sodium Sulphate goes to the 32 kg floor scale, units change to kg.
  await expect(page.getByTestId('w-scale')).toHaveText('32 kg floor');
  await expect(page.getByTestId('w-target')).toHaveText('24.000');
  await page.screenshot({ path: 'test-results/evidence/scale-switch-32kg.png' });
  await weighAndConfirm(page, request, 'Sodium Sulphate', 'scale-32kg', 23.98, '23.980');
  await weighAndConfirm(page, request, 'Soda Ash', 'scale-32kg', 9.621, '9.621');

  await expect(page.getByTestId('done-title')).toHaveText('Batch B-24187 weighed');
  await expect(page.getByTestId('writeback')).toContainText('CONFIRMED');
  await expect(page.getByText('35.322 kg')).toBeVisible();

  const consumption = await (await request.get('/api/batches/B-24187/consumption')).json();
  expect(consumption[0].lines).toHaveLength(5);

  await page.evaluate(() => (window.print = () => {}));
  await page.getByTestId('btn-print').click();
  await expect(page.getByTestId('print-note')).toContainText('Sent to printer');
  await expect(page.getByTestId('ticket')).toContainText('ALL WITHIN TOLERANCE');
  await page.screenshot({ path: 'test-results/evidence/screen-3-confirm-print.png' });
});

test('tolerance: confirm blocked below and above, allowed on boundaries (Yellow RGB 94.0 ±0.5 g)', async ({ page, request }) => {
  await selectBatch(page);
  await page.getByTestId('comp-DYE-4471-Y').click();
  await expect(page.getByTestId('cap-band')).toContainText('TOLERANCE ±0.5 g');
  await expect(page.getByTestId('cap-band')).toContainText('(93.5 – 94.5)');
  for (const [w, enabled] of [[93.4, false], [93.5, true], [94.0, true], [94.5, true], [94.6, false]] as const) {
    await setWeight(request, 'scale-3kg', w);
    await expect(page.getByTestId('w-now')).toHaveText(w.toFixed(1));
    if (enabled) await expect(page.getByTestId('btn-ok')).toBeEnabled();
    else await expect(page.getByTestId('btn-ok')).toBeDisabled();
  }
});

test('overshoot shows surplus and blocks confirmation', async ({ page, request }) => {
  await selectBatch(page);
  await page.getByTestId('comp-DYE-4471-Y').click();
  await setWeight(request, 'scale-3kg', 96.4);
  await expect(page.getByTestId('status')).toHaveText('OVER TOLERANCE — SURPLUS +2.4 g');
  await expect(page.getByTestId('surplus')).toContainText('+2.4 g (+2.6%)');
  await expect(page.getByTestId('btn-ok')).toBeDisabled();
  // ADR-001 option 2: proportional targets shown for information, not applied.
  await expect(page.getByTestId('surplus-proposal')).toContainText('24.000 kg→24.624 kg');
  await expect(page.getByTestId('surplus-proposal')).toContainText('9.600 kg→9.850 kg');
  await expect(page.getByTestId('comp-AUX-0101')).toContainText('24.000 kg');
  await page.screenshot({ path: 'test-results/evidence/overshoot.png' });
});

test('supervisor override accepts an overshoot with a logged reason', async ({ page, request }) => {
  await selectBatch(page);
  await setWeight(request, 'scale-3kg', 1250);
  await expect(page.getByTestId('btn-override')).toBeEnabled();
  await page.getByTestId('btn-override').click();
  await page.getByTestId('ov-reason').fill('Surplus within shade-correction limit per lab');
  await page.getByTestId('ov-submit').click();
  await expect(page.getByTestId('comp-DYE-4471-B')).toHaveAttribute('data-state', 'done');
  const [tx] = await (await request.get('/api/weighings?batchId=B-24187')).json();
  expect(tx).toMatchObject({ result: 'OVERRIDE', supervisorId: 'SV-003', reason: 'Surplus within shade-correction limit per lab' });
});

test('simulated pour rises into tolerance', async ({ page }) => {
  await selectBatch(page);
  await page.getByTestId('comp-DYE-4471-Y').click();
  await page.getByTestId('sim-ok').click();
  await expect(page.getByTestId('btn-ok')).toBeEnabled({ timeout: 10_000 });
  await expect(page.getByTestId('status')).toHaveText('WITHIN TOLERANCE — PRESS OK TO CONFIRM');
});

test.describe('failure scenarios', () => {
  test('scale unavailable → safe failure', async ({ page, request }) => {
    await selectBatch(page);
    await setWeight(request, 'scale-3kg', 1240);
    await request.post('/api/_dummy/scales/scale-3kg/offline');
    await expect(page.getByTestId('status')).toHaveText('SCALE OFFLINE — WEIGHING PAUSED');
    await expect(page.getByTestId('btn-ok')).toBeDisabled();
    await expect(page.getByTestId('stat-scale-3kg')).toContainText('OFFLINE');
    expect(await (await request.get('/api/weighings?batchId=B-24187')).json()).toHaveLength(0);
  });

  test('OrgaTEX unavailable → queue error with retry', async ({ page, request }) => {
    await request.post('/api/_dummy/orgatex/offline');
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('OrgaTEX unavailable');
    await request.post('/api/_dummy/orgatex/online');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByTestId('batch-B-24187')).toBeVisible();
  });

  test('OrgaTEX unavailable at completion → write-back pending, retry succeeds', async ({ page, request }) => {
    await selectBatch(page);
    await request.post('/api/_dummy/orgatex/offline');
    for (const [scale, v] of [['scale-3kg', 1240], ['scale-3kg', 386], ['scale-3kg', 94], ['scale-32kg', 24], ['scale-32kg', 9.6]] as const) {
      await setWeight(request, scale, v);
      await expect(page.getByTestId('btn-ok')).toBeEnabled();
      await page.getByTestId('btn-ok').click();
    }
    await expect(page.getByTestId('writeback')).toHaveText('PENDING — not written');
    await request.post('/api/_dummy/orgatex/online');
    await page.getByTestId('btn-retry-wb').click();
    await expect(page.getByTestId('writeback')).toContainText('CONFIRMED');
  });

  test('printer unavailable → defined behaviour', async ({ page, request }) => {
    await selectBatch(page);
    for (const [scale, v] of [['scale-3kg', 1240], ['scale-3kg', 386], ['scale-3kg', 94], ['scale-32kg', 24], ['scale-32kg', 9.6]] as const) {
      await setWeight(request, scale, v);
      await expect(page.getByTestId('btn-ok')).toBeEnabled();
      await page.getByTestId('btn-ok').click();
    }
    await request.post('/api/_dummy/printer/offline');
    await page.getByTestId('btn-print').click();
    await expect(page.getByTestId('print-note')).toContainText('Printer unavailable');
    await expect(page.getByTestId('writeback')).toContainText('CONFIRMED');
  });

  test('re-tare resets the weight; quit abandons the component', async ({ page, request }) => {
    await selectBatch(page);
    await setWeight(request, 'scale-3kg', 500);
    await expect(page.getByTestId('w-now')).toHaveText('500.0');
    await page.getByTestId('btn-retare').click();
    await expect(page.getByTestId('w-now')).toHaveText('0.0');
    await page.getByTestId('btn-quit').click();
    await expect(page.getByText('Touch a pending component')).toBeVisible();
    await expect(page.getByTestId('comp-DYE-4471-B')).toHaveAttribute('data-state', 'pending');
  });

  test('incomplete batch cannot complete', async ({ request, page }) => {
    await selectBatch(page);
    const res = await request.post('/api/station/complete');
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe('BATCH_INCOMPLETE');
  });
});
