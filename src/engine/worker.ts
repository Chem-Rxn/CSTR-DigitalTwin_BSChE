// src/engine/simulation.worker.ts
/// <reference lib="webworker" />
import { DEFAULT_PARAMS, DEFAULT_PID, INITIAL_STATE, PID, rk4, clamp, TC_MIN, TC_MAX } from './physics';
import type { Params, PidConfig, Vec, Snapshot } from './physics';

export type ToWorker =
  | { type: 'config'; params: Params; pid: PidConfig }
  | { type: 'control'; running: boolean; speed: number }
  | { type: 'reset' };

const TICK_MS = 50;          // real-time wall clock tick (20 Hz posts)
const SIM_MIN_PER_SEC = 0.25; // simulated minutes per real second at 1×
const MAX_H = 0.002;         // max RK4 step, min (keeps k·h small even near runaway)

let params: Params = DEFAULT_PARAMS;
let cfg: PidConfig = DEFAULT_PID;
let state: Vec = { ...INITIAL_STATE };
let t = 0;
let tc = DEFAULT_PID.manualTc;
let running = true;
let speed = 1;
let wasAuto = cfg.auto;
const pid = new PID();

function step() {
  if (!running) return;
  const simDt = SIM_MIN_PER_SEC * speed * (TICK_MS / 1000);
  const n = Math.max(1, Math.ceil(simDt / MAX_H));
  const h = simDt / n;
  for (let i = 0; i < n; i++) {
    tc = cfg.auto ? pid.step(cfg, state.T, h) : clamp(cfg.manualTc, TC_MIN, TC_MAX);
    state = rk4(state, tc, params, h);
    t += h;
  }
  const snap: Snapshot = { t, CA: state.CA, CB: state.CB, T: state.T, Tc: tc, Tsp: cfg.Tsp };
  (self as DedicatedWorkerGlobalScope).postMessage(snap);
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.type === 'config') {
    params = m.params;
    if (m.pid.auto && !wasAuto) pid.bumpless(m.pid, state.T, tc); // manual → auto
    wasAuto = m.pid.auto;
    cfg = m.pid;
  } else if (m.type === 'control') {
    running = m.running; speed = m.speed;
  } else if (m.type === 'reset') {
    state = { ...INITIAL_STATE }; t = 0; tc = cfg.manualTc; pid.reset();
  }
};

setInterval(step, TICK_MS);
