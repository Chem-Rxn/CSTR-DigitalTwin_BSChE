// src/lib/dimensionless.ts
// Pure engineering calculations for the telemetry HUD (Member 5). No React, no store access.
import { calcRateK } from '@/engine/physics';
import type { Params } from '@/engine/physics';

/** Assumed feed-pipe inner diameter (m). The model has no piping data, so this is a fixed 1" line. */
export const PIPE_D = 0.025;

/** Water viscosity (Pa·s) from the Vogel equation, valid ~273-373 K. Clamped outside that range. */
export function waterViscosity(T: number): number {
  const Tc = Math.min(373, Math.max(273, T));
  return 2.414e-5 * Math.pow(10, 247.8 / (Tc - 140));
}

export type Regime = 'laminar' | 'transitional' | 'turbulent';

export function flowRegime(Re: number): Regime {
  return Re < 10 ? 'laminar' : Re < 1e4 ? 'transitional' : 'turbulent';
}

export interface Dimensionless {
  tau: number;      // residence time V/F, min
  k: number;        // rate constant at current T, 1/min (units vary with order)
  Da: number;       // Damköhler number
  ReImp: number;    // stirred-tank (impeller) Reynolds number
  RePipe: number;   // feed-pipe Reynolds number
  mu: number;       // viscosity used, Pa·s
  kh: number;       // k·h, the stiffness check against the RK4 step
}

/**
 * Live dimensionless groups.
 *
 * Units follow the app: V in L, F in L/min, rho in g/L (= kg/m3), rpm from the agitator.
 *
 * Da = k · tau · CA0^(n-1), with n = alpha + beta (Fogler's nth-order form). For a
 * first-order reaction this is the usual k·tau. It differs from `live.damkohler` in the
 * store (plain k·tau), which is not dimensionless for second-order systems.
 *
 * Re_impeller = rho · N · D_i^2 / mu, with the tank sized as H = D_t from V and D_i = D_t/3.
 * Viscosity is that of water at the reactor temperature (the app has no viscosity input).
 */
export function computeDimensionless(
  p: Params, T: number, rpm: number, hStep: number,
): Dimensionless {
  const tau = p.F > 0 ? p.V / p.F : Infinity;
  const k = calcRateK(T, p);
  const n = p.orderA + p.orderB;
  const Da = k * tau * Math.pow(p.CAO, n - 1);

  const mu = waterViscosity(T);
  const Dt = Math.cbrt((4 * (p.V / 1000)) / Math.PI);
  const Di = Dt / 3;
  const ReImp = (p.rho * (rpm / 60) * Di * Di) / mu;

  const Q = p.F / 1000 / 60; // m3/s
  const RePipe = (4 * p.rho * Q) / (Math.PI * PIPE_D * waterViscosity(p.T0));

  return { tau, k, Da, ReImp, RePipe, mu, kh: k * hStep };
}
