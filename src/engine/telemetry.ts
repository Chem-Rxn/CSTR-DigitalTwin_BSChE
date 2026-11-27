// src/engine/telemetry.ts
// Lightweight solver telemetry. The engine loop writes here; the HUD polls it.
// Plain mutable object on purpose: updating it costs nothing and never triggers a React render.

export interface SolverTelemetry {
  simDt: number;       // outer step, simulated min
  h: number;           // RK4 sub-step, simulated min
  substeps: number;    // RK4 sub-steps per outer step
  costMs: number;      // wall-clock cost of the last outer step, ms
  stepsPerSec: number; // outer steps completed per real second (updated ~2x/s)
  lastStepAt: number;  // performance.now() of the last step, 0 = none yet
}

export const telemetry: SolverTelemetry = {
  simDt: 0.05, h: 0.01, substeps: 5, costMs: 0, stepsPerSec: 0, lastStepAt: 0,
};

let windowStart = 0;
let windowCount = 0;

export function recordSolverStep(simDt: number, h: number, substeps: number, costMs: number) {
  const now = performance.now();
  telemetry.simDt = simDt;
  telemetry.h = h;
  telemetry.substeps = substeps;
  telemetry.costMs = costMs;
  telemetry.lastStepAt = now;

  windowCount++;
  if (windowStart === 0) windowStart = now;
  if (now - windowStart >= 500) {
    telemetry.stepsPerSec = (windowCount * 1000) / (now - windowStart);
    windowStart = now;
    windowCount = 0;
  }
}
