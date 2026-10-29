import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Batch, Operator, Quantity, SessionComponent, Unit, WeighingSession } from '../shared/types';
import { api, ApiError, type Health, type Live, type StationConfigView } from './api';

const dp = (u: Unit) => (u === 'kg' ? 3 : 1);
const fmt = (v: number, u: Unit) => v.toFixed(dp(u));
const fmtQ = (q: Quantity) => `${fmt(q.value, q.unit)} ${q.unit}`;
const toUnit = (v: number, from: Unit, to: Unit) => (from === to ? v : from === 'g' ? v / 1000 : v * 1000);
const clock = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour12: false }) : '');
const elapsed = (s: number) => `${Math.floor(s / 60)} min ${s % 60} s`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type ZoneAttr = 'under' | 'near' | 'ok' | 'over';

function zoneAttr(live: Live | null): ZoneAttr {
  if (!live) return 'under';
  const z = live.evaluation.zone;
  if (z === 'OVER') return 'over';
  if (z === 'IN_RANGE' || z === 'TARGET') return 'ok';
  return live.evaluation.near ? 'near' : 'under';
}

export function App() {
  const [config, setConfig] = useState<StationConfigView | null>(null);
  const [operatorId, setOperatorId] = useState<string>('');
  const [session, setSession] = useState<WeighingSession | null | undefined>(undefined);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);

  useEffect(() => {
    api.config().then((c) => {
      setConfig(c);
      setOperatorId((id) => id || c.defaultOperatorId);
    });
    api.session().then((s) => {
      setSession(s);
      if (s) setOperatorId(s.operatorId);
    });
  }, []);

  useEffect(() => {
    const tick = () => api.health().then(setHealth).catch(() => setHealth(null));
    tick();
    const t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }, []);

  const run = useCallback(async (fn: () => Promise<WeighingSession | void>) => {
    setError(null);
    try {
      const s = await fn();
      if (s !== undefined) setSession(s);
      return true;
    } catch (e) {
      setError(errMsg(e));
      return false;
    }
  }, []);

  const startBatch = useCallback(
    (batchId: string) => run(() => api.start(batchId, operatorId)),
    [run, operatorId],
  );

  // Dummy Scanner: batch cards on screen 1, dyestuff codes on screen 2 (FR-2, FR-4).
  const sessionRef = useRef(session);
  sessionRef.current = session;
  useEffect(() => {
    const t = setInterval(async () => {
      const scan = await api.nextScan().catch(() => undefined);
      if (!scan) return;
      const s = sessionRef.current;
      if (!s) {
        setScanNote(`Scanned ${scan.code}`);
        startBatch(scan.code);
      } else if (s.status === 'WEIGHING') {
        const active = s.components.find((c) => c.state === 'active');
        setScanNote(
          active && scan.code === active.code
            ? `Dyestuff verified — ${scan.code}`
            : `Wrong dyestuff — scanned ${scan.code}, expected ${active?.code ?? '—'}`,
        );
      }
    }, 600);
    return () => clearInterval(t);
  }, [startBatch]);

  const operator = config?.operators.find((o) => o.operatorId === operatorId);
  const view = session === undefined ? 'loading' : !session ? 'queue' : session.status === 'COMPLETED' ? 'done' : 'weigh';

  return (
    <div className="wrap">
      <div className="device">
        <div className="screen">
          <Topbar
            stationId={config?.stationId ?? 'STATION 01'}
            session={session ?? null}
            operators={config?.operators ?? []}
            operator={operator}
            canChange={!session}
            onOperator={setOperatorId}
          />
          <div>
            {error && (
              <div className="notice err" role="alert" style={{ margin: '14px 24px 0' }}>
                {error}
              </div>
            )}
            {view === 'queue' && <QueueView onSelect={startBatch} scanNote={scanNote} scannerUp={health?.scanner === 'READY'} />}
            {view === 'weigh' && session && (
              <WeighView session={session} run={run} setError={setError} operators={config?.operators ?? []} scanNote={scanNote} />
            )}
            {view === 'done' && session && <DoneView session={session} run={run} />}
          </div>
          <StatusStrip health={health} />
        </div>
      </div>
    </div>
  );
}

function Topbar(p: {
  stationId: string;
  session: WeighingSession | null;
  operators: Operator[];
  operator?: Operator;
  canChange: boolean;
  onOperator: (id: string) => void;
}) {
  const b = p.session?.batch;
  return (
    <div className="topbar">
      <span className="brandmark">
        <span className="n">WeighingMS</span>
        <span className="s">{p.stationId}</span>
      </span>
      {b && (
        <span className="crumb">
          BATCH <b>{b.batchId}</b> · ORDER <b>{b.orderId}</b> · MACHINE <b>{b.machine}</b>
        </span>
      )}
      <span className="spacer" />
      <span className="op-chip">
        <span className="dot" />
        Operator&nbsp;
        {p.canChange ? (
          <select aria-label="Operator" value={p.operator?.operatorId ?? ''} onChange={(e) => p.onOperator(e.target.value)}>
            {p.operators.map((o) => (
              <option key={o.operatorId} value={o.operatorId}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          <b>{p.operator?.name}</b>
        )}{' '}
        · {p.operator?.shift ?? ''}
      </span>
    </div>
  );
}

function StatusStrip({ health }: { health: Health | null }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dot = (up: boolean | undefined) => <span className={`dot ${up ? 'up' : 'down'}`} />;
  const s3 = health?.scales.find((s) => s.scaleId === 'scale-3kg');
  const s32 = health?.scales.find((s) => s.scaleId === 'scale-32kg');
  const otxUp = health?.orgatex.status === 'LINKED';
  return (
    <div className="strip" data-testid="status-strip">
      <span className="stat" data-testid="stat-scale-3kg">
        {dot(s3?.status === 'READY')}SCALE 3 kg · {s3?.status ?? '—'}
      </span>
      <span className="stat" data-testid="stat-scale-32kg">
        {dot(s32?.status === 'READY')}SCALE 32 kg · {s32?.status ?? '—'}
      </span>
      <span className="stat">
        {dot(health?.scanner === 'READY')}SCANNER{health?.scanner === 'OFFLINE' ? ' · OFFLINE' : ''}
      </span>
      <span className="stat" data-testid="stat-printer">
        {dot(health?.printer === 'READY')}PRINTER{health?.printer === 'OFFLINE' ? ' · OFFLINE' : ''}
      </span>
      <span className="stat" data-testid="stat-orgatex">
        <span className={`dot ${otxUp ? 'warnd' : 'down'}`} />
        ORGATEX · {otxUp ? `LINKED ${clock(health?.orgatex.linkedAt).slice(0, 5)}` : 'OFFLINE'}
      </span>
      <span className="spacer" />
      <span className="stat">EN</span>
      <span className="stat">{now.toLocaleTimeString('en-GB', { hour12: false })}</span>
    </div>
  );
}

// ── 1 · Select batch ────────────────────────────────────────────────
function QueueView({ onSelect, scanNote, scannerUp }: { onSelect: (id: string) => void; scanNote: string | null; scannerUp: boolean }) {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<string>('');

  const load = useCallback(() => {
    setErr(null);
    api
      .batches()
      .then((b) => {
        setBatches(b);
        setReceivedAt(new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5));
      })
      .catch((e) => setErr(e instanceof ApiError && e.code === 'ORGATEX_UNAVAILABLE' ? 'OrgaTEX unavailable — batch queue cannot be loaded.' : errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const selectable = (b: Batch) => b.status === 'RELEASED' || b.status === 'WEIGHING';

  return (
    <div className="view active" id="v-queue">
      <div className="queue">
        <div className="scan-prompt">
          <div className="beam" aria-hidden="true" />
          <div>
            <div className="big">Scan a batch card to begin</div>
            <div className="sm">
              Or touch a row below.{receivedAt && ` Queue received from OrgaTEX at ${receivedAt}.`}
              {!scannerUp && ' Scanner offline — use touch.'}
            </div>
          </div>
        </div>
        {scanNote && <div className="notice">{scanNote}</div>}
        {err ? (
          <div className="notice err" role="alert">
            {err}{' '}
            <button type="button" className="key" style={{ minHeight: 44, marginLeft: 12 }} onClick={load}>
              Retry
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="q">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Order</th>
                  <th>Machine</th>
                  <th>Fabric / lot</th>
                  <th>Shade</th>
                  <th>Comp.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(batches ?? []).map((b) => (
                  <tr
                    key={b.batchId}
                    data-testid={`batch-${b.batchId}`}
                    aria-disabled={!selectable(b)}
                    tabIndex={selectable(b) ? 0 : -1}
                    onClick={() => selectable(b) && onSelect(b.batchId)}
                    onKeyDown={(e) => e.key === 'Enter' && selectable(b) && onSelect(b.batchId)}
                  >
                    <td className="mono">{b.batchId}</td>
                    <td className="mono">{b.orderId}</td>
                    <td className="mono">{b.machine}</td>
                    <td>{b.fabric}</td>
                    <td>{b.shade}</td>
                    <td className="mono">{b.componentCount}</td>
                    <td>
                      <span className={`tag ${b.status === 'WEIGHED' ? 'done' : b.status === 'WEIGHING' ? 'now' : ''}`}>
                        {b.status === 'RELEASED' ? 'QUEUED' : b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 2 · Weigh ───────────────────────────────────────────────────────
function WeighView(p: {
  session: WeighingSession;
  run: (fn: () => Promise<WeighingSession | void>) => Promise<boolean>;
  setError: (e: string | null) => void;
  operators: Operator[];
  scanNote: string | null;
}) {
  const { session, run } = p;
  const active = session.components.find((c) => c.state === 'active');
  const done = session.components.filter((c) => c.state === 'done').length;
  const [live, setLive] = useState<Live | null>(null);
  const [scaleDown, setScaleDown] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  useEffect(() => {
    setLive(null);
    if (!active) return;
    let stop = false;
    const tick = async () => {
      try {
        const l = await api.live();
        if (!stop) {
          setLive(l);
          setScaleDown(false);
        }
      } catch (e) {
        if (!stop && e instanceof ApiError && e.code === 'SCALE_UNAVAILABLE') setScaleDown(true);
      }
    };
    tick();
    const t = setInterval(tick, 200);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [active?.componentId]);

  return (
    <div className="view active" id="v-weigh">
      <div className="stage">
        <aside className="rail">
          <div className="rail-head">
            <span className="t">Recipe · {session.batch.shade}</span>
            <span className="v">{session.batch.batchId}</span>
            <span className="m">
              <span data-testid="rail-done">{done}</span> of {session.components.length} components weighed
            </span>
          </div>
          <ul className="comps">
            {session.components.map((c) => (
              <li key={c.componentId}>
                <button
                  type="button"
                  className="comp"
                  data-state={c.state}
                  data-testid={`comp-${c.componentId}`}
                  onClick={() => c.state === 'pending' && run(() => api.activate(c.componentId))}
                >
                  <span className="swatch" style={{ background: c.colour }} />
                  <span>
                    <span className="nm">{c.name}</span>
                    <br />
                    <span className="sub">
                      {c.code} · {c.scaleLabel.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </span>
                  <span>
                    <span className="qty">{fmtQ(c.target)}</span>
                    <br />
                    <span className="st">
                      {c.state === 'done' && c.actual ? `✓ ${fmt(c.actual.value, c.actual.unit)}` : c.state === 'active' ? 'WEIGHING' : 'PENDING'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {active ? (
          <WeighPanel
            c={active}
            live={live}
            scaleDown={scaleDown}
            run={run}
            onOverride={() => setOverrideOpen(true)}
            scanNote={p.scanNote}
          />
        ) : (
          <section className="weigh">
            <div className="empty">Touch a pending component in the recipe to weigh it.</div>
            <div className="actions">
              <button type="button" className="key ghost" onClick={() => run(async () => { await api.abandon(); return null as unknown as WeighingSession; })}>
                Leave batch
              </button>
            </div>
          </section>
        )}
      </div>
      {overrideOpen && active && (
        <OverrideDialog
          supervisors={p.operators.filter((o) => o.supervisor)}
          onCancel={() => setOverrideOpen(false)}
          onSubmit={async (sup, reason) => {
            if (await run(() => api.override(sup, reason))) setOverrideOpen(false);
          }}
        />
      )}
    </div>
  );
}

function WeighPanel(p: {
  c: SessionComponent;
  live: Live | null;
  scaleDown: boolean;
  run: (fn: () => Promise<WeighingSession | void>) => Promise<boolean>;
  onOverride: () => void;
  scanNote: string | null;
}) {
  const { c, live } = p;
  const u = c.target.unit;
  const now = live?.value ?? 0;
  const zone = p.scaleDown ? 'under' : zoneAttr(live);
  const ev = live?.evaluation;
  const tol = toUnit(c.tolerance.value, c.tolerance.unit, u);
  const min = c.target.value - tol;
  const max = c.target.value + tol;
  const pct = Math.min(100, (now / c.displayMax) * 100);
  const canConfirm = !p.scaleDown && (zone === 'ok');
  const scaleUnit: Unit = c.scaleId === 'scale-32kg' ? 'kg' : 'g';
  const sim = (landing: number) => api.simPour(c.scaleId, toUnit(landing, u, scaleUnit), toUnit(c.target.value, u, scaleUnit));

  let status: string;
  if (p.scaleDown) status = 'SCALE OFFLINE — WEIGHING PAUSED';
  else if (zone === 'over') status = `OVER TOLERANCE — SURPLUS +${fmt(ev?.surplus ?? 0, u)} ${u}`;
  else if (zone === 'ok') status = 'WITHIN TOLERANCE — PRESS OK TO CONFIRM';
  else status = `DISPENSE — ${fmt(Math.max(0, c.target.value - now), u)} ${u} REMAINING`;

  return (
    <section className="weigh">
      <div className="controls" aria-label="Training simulator">
        <span className="sim-tag">Training simulator · Dummy scale</span>
        <span className="spacer" />
        <button type="button" className="btn primary" data-testid="sim-ok" onClick={() => sim(c.target.value + tol * 0.4)}>
          ▶ Simulate dispense
        </button>
        <button type="button" className="btn" data-testid="sim-over" onClick={() => sim(c.target.value + tol * 4.8)}>
          ▶ Simulate overshoot
        </button>
        <button type="button" className="btn" data-testid="sim-reset" onClick={() => api.simWeight(c.scaleId, 0)}>
          Reset
        </button>
      </div>

      <div className="weigh-head">
        <div className="who">
          <span className="nm" data-testid="w-name">{c.name}</span>
          <span className="meta">
            {c.code} · LOT {c.lot} · CONTAINER {c.container} · TARE {fmt(toUnit(c.tare.value, c.tare.unit, u), u)} {u}
          </span>
        </div>
        <div className="scale-badge">
          <span className="k">Scale selected</span>
          <span className="v" data-testid="w-scale">{c.scaleLabel}</span>
          <span className="auto">automatic</span>
        </div>
      </div>

      {p.scanNote && <div className={`notice ${p.scanNote.startsWith('Wrong') ? 'err' : 'good'}`}>{p.scanNote}</div>}

      <div className="readout">
        <div className="cell live" data-zone={zone} data-testid="cell-live">
          <span className="k">Weighed now</span>
          <span className="v">
            <span data-testid="w-now">{p.scaleDown ? '----' : fmt(now, u)}</span> <span className="u">{u}</span>
          </span>
        </div>
        <div className="cell">
          <span className="k">Still to weigh</span>
          <span className="v">
            <span data-testid="w-left">{fmt(Math.max(0, c.target.value - now), u)}</span> <span className="u">{u}</span>
          </span>
        </div>
        <div className="cell">
          <span className="k">Target</span>
          <span className="v">
            <span data-testid="w-target">{fmt(c.target.value, u)}</span> <span className="u">{u}</span>
          </span>
        </div>
      </div>

      <div className="bar-block">
        <div className="bar" data-zone={zone} role="progressbar" aria-label="Weighing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="fill" style={{ width: `${pct}%` }} />
          <div className="band" style={{ left: `${(min / c.displayMax) * 100}%`, width: `${Math.max(0.6, ((max - min) / c.displayMax) * 100)}%` }} />
          <div className="target-line" style={{ left: `${(c.target.value / c.displayMax) * 100}%` }} />
        </div>
        <div className="bar-caption">
          <span>0</span>
          <span data-testid="cap-band">
            TOLERANCE ±{fmt(tol, u)} {u}&nbsp; ({fmt(min, u)} – {fmt(max, u)})
          </span>
          <span>
            {fmt(c.displayMax, u)} {u}
          </span>
        </div>
        <div className="status-line" data-zone={p.scaleDown ? 'over' : zone} data-testid="status" aria-live="polite">
          {status}
        </div>
      </div>

      <div className={`surplus ${zone === 'over' ? 'on' : ''}`} data-testid="surplus">
        <span className="h">
          Surplus +{fmt(ev?.surplus ?? 0, u)} {u} (+{(ev?.surplusPct ?? 0).toFixed(1)}%) — over tolerance
        </span>
        {(live?.proposal.length ?? 0) > 0 && (
          <table data-testid="surplus-proposal">
            <tbody>
              {live!.proposal.map((l) => (
                <tr key={l.componentId}>
                  <td>{l.name}</td>
                  <td className="n">{fmtQ(l.current)}</td>
                  <td className="arrow">→</td>
                  <td className="n">{fmtQ(l.proposed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <span className="hint">
          Shade-ratio targets shown for information only — not applied (ADR-001). Confirmation is blocked: re-tare to
          discard and re-weigh, or request a supervisor override.
        </span>
      </div>

      <div className="actions">
        <button type="button" className="key ok" data-testid="btn-ok" disabled={!canConfirm} onClick={() => p.run(() => api.confirm())}>
          OK · Confirm<span className="fn">F1</span>
        </button>
        <button type="button" className="key" data-testid="btn-retare" onClick={() => p.run(async () => { await api.retare(); })}>
          Re-tare<span className="fn">F2</span>
        </button>
        <button type="button" className="key ghost" data-testid="btn-quit" onClick={() => p.run(() => api.quit())}>
          Quit<span className="fn">F4</span>
        </button>
        <button type="button" className="key ghost" data-testid="btn-override" style={{ marginLeft: 'auto' }} disabled={zone !== 'over'} onClick={p.onOverride}>
          Supervisor override
        </button>
      </div>
    </section>
  );
}

function OverrideDialog(p: { supervisors: Operator[]; onCancel: () => void; onSubmit: (sup: string, reason: string) => void }) {
  const [sup, setSup] = useState(p.supervisors[0]?.operatorId ?? '');
  const [reason, setReason] = useState('');
  return (
    <div className="dialog-back" role="dialog" aria-modal="true" aria-label="Supervisor override">
      <div className="dialog">
        <h2>Supervisor override</h2>
        <label>
          Supervisor
          <select value={sup} onChange={(e) => setSup(e.target.value)} data-testid="ov-supervisor">
            {p.supervisors.map((s) => (
              <option key={s.operatorId} value={s.operatorId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason (required)
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="ov-reason" />
        </label>
        <div className="actions">
          <button type="button" className="key ok" disabled={!reason.trim() || !sup} data-testid="ov-submit" onClick={() => p.onSubmit(sup, reason)}>
            Accept with override
          </button>
          <button type="button" className="key ghost" onClick={p.onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3 · Confirm & print ─────────────────────────────────────────────
function DoneView({ session, run }: { session: WeighingSession; run: (fn: () => Promise<WeighingSession | void>) => Promise<boolean> }) {
  const sm = session.summary;
  const t = session.ticket;
  const [printNote, setPrintNote] = useState<string | null>(null);
  if (!sm || !t) return null;
  const wb = sm.writeBack;

  const print = async () => {
    setPrintNote(null);
    try {
      const s = await api.printTicket();
      await run(async () => s);
      setPrintNote(`Sent to printer — ticket ${s.ticket?.ticketId ?? ''}`);
      setTimeout(() => window.print(), 50);
    } catch (e) {
      setPrintNote(`Printer unavailable — ${errMsg(e)}. Ticket kept in preview; retry when the printer is back.`);
    }
  };

  return (
    <div className="view active" id="v-done">
      <div className="done-stage">
        <div className="done-msg">
          <span className="h" data-testid="done-title">Batch {session.batch.batchId} weighed</span>
          <div className="summary">
            <Row k="Components weighed" v={`${sm.componentsWeighed} of ${sm.componentCount}`} />
            <Row k="All within tolerance" v={sm.allWithinTolerance ? 'YES' : 'NO — OVERRIDE'} cls={sm.allWithinTolerance ? 'good' : 'bad'} />
            <Row k="Total dispensed" v={`${sm.totalDispensedKg.toFixed(3)} kg`} />
            <Row k="Elapsed" v={elapsed(sm.elapsedSeconds)} />
            <Row k="Operator" v={sm.operator} />
            <Row
              k="Written to OrgaTEX"
              v={wb.status === 'CONFIRMED' ? `CONFIRMED ${clock(wb.confirmedAt)}` : 'PENDING — not written'}
              cls={wb.status === 'CONFIRMED' ? 'good' : 'bad'}
              testId="writeback"
            />
          </div>
          {wb.status === 'CONFIRMED' ? (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--hmi-muted)' }}>
              Actual consumption posted against the batch. Container released for transport to {session.batch.machine}.
            </p>
          ) : (
            <div className="notice">
              OrgaTEX unreachable — weighing records are saved locally. {wb.error}{' '}
              <button type="button" className="key" style={{ minHeight: 44, marginLeft: 8 }} onClick={() => run(() => api.retryWriteBack())} data-testid="btn-retry-wb">
                Retry write-back
              </button>
            </div>
          )}
          {printNote && <div className={`notice ${printNote.startsWith('Printer') ? 'err' : 'good'}`} data-testid="print-note">{printNote}</div>}
          <div className="actions">
            <button type="button" className="key ok" data-testid="btn-print" onClick={print}>
              {t.printed ? 'Reprint ticket' : 'Print ticket'}
              <span className="fn">F1</span>
            </button>
            <button type="button" className="key" data-testid="btn-next" onClick={() => run(async () => { await api.next(); return null as unknown as WeighingSession; })}>
              Next batch<span className="fn">F3</span>
            </button>
          </div>
        </div>
        <TicketPreview session={session} />
      </div>
    </div>
  );
}

function Row({ k, v, cls, testId }: { k: string; v: string; cls?: string; testId?: string }) {
  return (
    <div className="r">
      <span className="k">{k}</span>
      <span className={`v ${cls ?? ''}`} data-testid={testId}>
        {v}
      </span>
    </div>
  );
}

function TicketPreview({ session }: { session: WeighingSession }) {
  const t = session.ticket!.ticket;
  const bars = useMemo(() => {
    let seed = [...t.barcode].reduce((a, ch) => a + ch.charCodeAt(0), 7);
    return Array.from({ length: 52 }, (_, i) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return { w: 1 + (seed % 3), on: i % 2 === 0 };
    });
  }, [t.barcode]);
  const pad = (s: string, n: number) => s.padEnd(n, ' ');
  return (
    <div>
      <div className="ticket" data-testid="ticket">
        <div className="c bold">{t.title}</div>
        {t.reprint && <div className="c bold">*** REPRINT ***</div>}
        <hr />
        {pad('BATCH', 8)}{t.batchId}<br />
        {pad('ORDER', 8)}{t.orderId}<br />
        {pad('MACHINE', 8)}{t.machine}<br />
        {pad('SHADE', 8)}{t.shade}<br />
        {pad('DATE', 8)}{t.date}<br />
        {pad('OPER.', 8)}{t.operator}
        <hr />
        <span className="bold">{pad('COMPONENT', 12)}{pad('TGT', 7)}ACT</span>
        <br />
        {t.lines.map((l) => (
          <span key={l.name}>
            {pad(l.name, 12)}
            {pad(fmt(l.target.value, l.target.unit), 7)}
            {fmt(l.actual.value, l.actual.unit)} {l.actual.unit}
            {l.result === 'OVERRIDE' ? ' *OVR' : ''}
            <br />
          </span>
        ))}
        <hr />
        <div className="c">{t.verdict}</div>
        <div className="barcode" aria-hidden="true">
          {bars.map((b, i) => (
            <i key={i} style={{ width: b.w, background: b.on ? undefined : 'transparent' }} />
          ))}
        </div>
        <div className="c">{t.barcode}</div>
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--hmi-muted)', fontFamily: 'var(--mono)' }}>
        Label content per prototype (not yet defined by FCI).
      </p>
    </div>
  );
}
