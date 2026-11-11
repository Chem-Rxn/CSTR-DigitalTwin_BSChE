export const R_GAS = 8.314; // J/(mol K)
export const TC_MIN = 270;
export const TC_MAX = 420;

export interface ChemicalSystem {
  id: string;
  name: string;
  speciesA: string;
  speciesB: string;
  speciesC: string;
  CAO: number;
  Ea: number;
  k0: number;
  dH: number;
  orderA: number;
  orderB: number;
}

export const CHEMICAL_SYSTEMS: Record<string, ChemicalSystem> = {
  anhydride: {
    id: 'anhydride',
    name: 'Acetic Anhydride Hydrolysis (Highly Exothermic)',
    speciesA: 'Acetic Anhydride',
    speciesB: 'Water',
    speciesC: 'Acetic Acid',
    CAO: 1.0,
    Ea: 52800,
    k0: 3.5e7,
    dH: 58000,
    orderA: 1,
    orderB: 1,
  },
  esterification: {
    id: 'esterification',
    name: 'Esterification of Ethanol & Acetic Acid',
    speciesA: 'Acetic Acid',
    speciesB: 'Ethanol',
    speciesC: 'Ethyl Acetate',
    CAO: 1.0,
    Ea: 72747,
    k0: 7.2e10,
    dH: 28000,
    orderA: 1,
    orderB: 1,
  },
  decomposition: {
    id: 'decomposition',
    name: 'Exothermic Thermal Decomposition',
    speciesA: 'Reactant Monomer',
    speciesB: 'Inert Solvent',
    speciesC: 'Polymer Product',
    CAO: 1.0,
    Ea: 85000,
    k0: 1.2e12,
    dH: 92000,
    orderA: 2,
    orderB: 0,
  },
};

export interface Params {
  systemId: string;
  F: number;
  T0: number;
  CAO: number;
  Ea: number;
  k0: number;
  dH: number;
  rho: number;
  Cp: number;
  UA: number;
  V: number;
  orderA: number;
  orderB: number;
}

export interface PidConfig {
  Kp: number;
  Ki: number;
  Kd: number;
  auto: boolean;
  Tsp: number;
  manualTc: number;
  bias: number;
}

export interface Vec {
  CA: number;
  CB: number;
  T: number;
}

export interface Snapshot {
  t: number;
  CA: number;
  CB: number;
  T: number;
  Tc: number;
  Tsp: number;
  conversion: number;
  heatGen: number;
  damkohler: number;
  exploded: boolean;
}

export const DEFAULT_PARAMS: Params = {
  systemId: 'anhydride',
  F: 100,
  T0: 298,
  CAO: 1.0,
  Ea: 52800,
  k0: 3.5e7,
  dH: 58000,
  rho: 1000,
  Cp: 0.239,
  UA: 5e4,
  V: 100,
  orderA: 1,
  orderB: 1,
};

export const DEFAULT_PID: PidConfig = {
  Kp: 4,
  Ki: 0.8,
  Kd: 0,
  auto: true,      // Start in Auto mode so PID cooling keeps it stable!
  Tsp: 310,        // Safe operating setpoint
  manualTc: 295,
  bias: 300,
};

// Safe, stable initial start values
export const INITIAL_STATE: Vec = { CA: 0.8, CB: 0.2, T: 300 };

export const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

export const calcRateK = (T: number, p: Params) => {
  return p.k0 * Math.exp(-p.Ea / (R_GAS * T));
};

export function deriv(s: Vec, Tc: number, p: Params): Vec {
  const k = calcRateK(s.T, p);
  const r = k * Math.pow(Math.max(0, s.CA), p.orderA) * Math.pow(Math.max(0, s.CB), p.orderB);
  const q = p.F / p.V;
  const rhoCp = p.rho * p.Cp;

  return {
    CA: q * (p.CAO - s.CA) - r,
    CB: -q * s.CB + r,
    T: q * (p.T0 - s.T) + (p.dH * r) / rhoCp - (p.UA / (p.V * rhoCp)) * (s.T - Tc),
  };
}

export function rk4(s: Vec, Tc: number, p: Params, h: number): Vec {
  const add = (a: Vec, b: Vec, f: number): Vec => ({
    CA: a.CA + b.CA * f,
    CB: a.CB + b.CB * f,
    T: a.T + b.T * f,
  });

  const k1 = deriv(s, Tc, p);
  const k2 = deriv(add(s, k1, h / 2), Tc, p);
  const k3 = deriv(add(s, k2, h / 2), Tc, p);
  const k4 = deriv(add(s, k3, h), Tc, p);

  const w = h / 6;
  return {
    CA: clamp(s.CA + w * (k1.CA + 2 * k2.CA + 2 * k3.CA + k4.CA), 0, 50),
    CB: clamp(s.CB + w * (k1.CB + 2 * k2.CB + 2 * k3.CB + k4.CB), 0, 50),
    T: clamp(s.T + w * (k1.T + 2 * k2.T + 2 * k3.T + k4.T), 200, 3000),
  };
}

export class PID {
  integral = 0;
  private prevPV = NaN;

  reset() {
    this.integral = 0;
    this.prevPV = NaN;
  }

  bumpless(cfg: PidConfig, pv: number, currentTc: number) {
    const e = cfg.Tsp - pv;
    this.integral = cfg.Ki > 1e-9 ? (currentTc - cfg.bias - cfg.Kp * e) / cfg.Ki : 0;
    this.prevPV = pv;
  }

  step(cfg: PidConfig, pv: number, dt: number): number {
    const e = cfg.Tsp - pv;
    const dPV = Number.isNaN(this.prevPV) ? 0 : (pv - this.prevPV) / dt;
    this.prevPV = pv;

    const unsat = cfg.bias + cfg.Kp * e + cfg.Ki * this.integral - cfg.Kd * dPV; // derivative-on-PV opposes a rising PV (was +, which is positive feedback)
    const out = clamp(unsat, TC_MIN, TC_MAX);
    const saturated = out !== unsat;

    if (!saturated || Math.sign(e) === Math.sign(out - unsat)) {
      this.integral += e * dt;
    }
    return out;
  }
}