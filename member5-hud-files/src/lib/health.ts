// src/lib/health.ts
// Pure health checks for the HUD status lights. Each returns a level plus a short reason.
import type { Snapshot } from '@/engine/physics';

export type Level = 'ok' | 'warn' | 'crit' | 'na';
export interface Health { level: Level; detail: string }

/** Solver loop heartbeat. The engine currently runs on the main thread (bridge.ts); worker.ts is not wired in. */
export function engineHealth(o: { running: boolean; exploded: boolean; hidden: boolean; lastStepAt: number; now: number }): Health {
  if (o.exploded) return { level: 'warn', detail: 'halted (rupture)' };
  if (o.hidden) return { level: 'warn', detail: 'tab hidden' };
  if (!o.running) return { level: 'warn', detail: 'paused' };
  if (o.lastStepAt === 0) return { level: 'warn', detail: 'starting' };
  const age = o.now - o.lastStepAt;
  if (age < 300) return { level: 'ok', detail: 'stepping' };
  if (age < 1000) return { level: 'warn', detail: `lagging ${Math.round(age)} ms` };
  return { level: 'crit', detail: `stalled ${(age / 1000).toFixed(1)} s` };
}

/** JS heap usage. performance.memory exists in Chromium only; other browsers get a grey light. */
export function memoryHealth(): Health & { usedMB: number | null } {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!m) return { level: 'na', detail: 'not supported', usedMB: null };
  const frac = m.usedJSHeapSize / m.jsHeapSizeLimit;
  const usedMB = m.usedJSHeapSize / 1048576;
  const detail = `${usedMB.toFixed(0)} MB · ${(frac * 100).toFixed(0)}%`;
  return { level: frac >= 0.8 ? 'crit' : frac >= 0.6 ? 'warn' : 'ok', detail, usedMB };
}

/**
 * Numerical health of the model state.
 * Red: non-finite values, rupture, or k·h beyond the RK4 stability limit (~2.78).
 * Yellow: temperature at the warning limit, k·h above 1, state pinned at a solver clamp, or a slow step.
 */
export function calcHealth(o: { live: Snapshot; warnT: number; critT: number; kh: number; costMs: number }): Health {
  const { live, warnT, critT, kh, costMs } = o;
  const vals = [live.CA, live.CB, live.T, live.Tc];
  if (vals.some((v) => !Number.isFinite(v))) return { level: 'crit', detail: 'NaN / Inf in state' };
  if (live.exploded) return { level: 'crit', detail: 'reactor ruptured' };
  if (kh > 2.5) return { level: 'crit', detail: `k·h = ${kh.toFixed(1)}, unstable` };
  if (live.T >= critT) return { level: 'crit', detail: 'T above critical limit' };
  if (live.T >= warnT) return { level: 'warn', detail: 'T above warning limit' };
  if (kh > 1) return { level: 'warn', detail: `k·h = ${kh.toFixed(2)}, stiff` };
  if (live.T >= 2999 || live.T <= 200.01 || live.CA >= 49.99) return { level: 'warn', detail: 'state at solver clamp' };
  if (costMs > 10) return { level: 'warn', detail: `slow step ${costMs.toFixed(1)} ms` };
  return { level: 'ok', detail: `k·h = ${kh.toFixed(3)}` };
}
