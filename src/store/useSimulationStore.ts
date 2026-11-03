import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_PARAMS, DEFAULT_PID, INITIAL_STATE, CHEMICAL_SYSTEMS } from '@/engine/physics';
import type { Params, PidConfig, Snapshot } from '@/engine/physics';

export const HISTORY_LEN = 100;

export interface Alarm {
  id: number;
  ts: string;
  level: 'info' | 'warn' | 'crit';
  msg: string;
}

export interface Limits {
  warnT: number;
  critT: number;
}

const initPoint: Snapshot = {
  t: 0,
  ...INITIAL_STATE,
  Tc: DEFAULT_PID.manualTc,
  Tsp: DEFAULT_PID.Tsp,
  conversion: 0,
  heatGen: 0,
  damkohler: 0,
  exploded: false,
};

const blankHistory = (): Snapshot[] => Array.from({ length: HISTORY_LEN }, () => ({ ...initPoint }));

interface SimState {
  params: Params;
  pid: PidConfig;
  limits: Limits;
  live: Snapshot;
  history: Snapshot[];
  alarms: Alarm[];
  running: boolean;
  speed: number;
  rpm: number;
  resetToken: number;
  exploded: boolean;

  setParam: <K extends keyof Params>(k: K, v: Params[K]) => void;
  setPid: (p: Partial<PidConfig>) => void;
  setRunning: (r: boolean) => void;
  setSpeed: (s: number) => void;
  setRpm: (r: number) => void;
  setSystem: (systemId: string) => void;
  reset: () => void;
  applySnapshot: (s: Snapshot) => void;
  loadScenario: (p: { params: Params; pid: PidConfig }) => void;
}

let alarmSeq = 0;
let level: 'ok' | 'warn' | 'crit' = 'ok';
const stamp = () => new Date().toLocaleTimeString([], { hour12: false });

export const useSimulationStore = create<SimState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      params: DEFAULT_PARAMS,
      pid: DEFAULT_PID,
      limits: { warnT: 380, critT: 430 },
      live: initPoint,
      history: blankHistory(),
      alarms: [{ id: 0, ts: stamp(), level: 'info', msg: 'System initialized with real chemical kinetics' }],
      running: true,
      speed: 1,
      rpm: 120,
      resetToken: 0,
      exploded: false,

      setParam: (k, v) => set((s) => ({ params: { ...s.params, [k]: v } }), false, 'setParam'),
      setPid: (p) => set((s) => ({ pid: { ...s.pid, ...p } }), false, 'setPid'),
      setRunning: (running) => set({ running }, false, 'setRunning'),
      setSpeed: (speed) => set({ speed }, false, 'setSpeed'),
      setRpm: (rpm) => set({ rpm }, false, 'setRpm'),
      
      setSystem: (systemId) => {
        const sys = CHEMICAL_SYSTEMS[systemId];
        if (!sys) return;
        set((s) => ({
          params: {
            ...s.params,
            systemId: sys.id,
            CAO: sys.CAO,
            Ea: sys.Ea,
            k0: sys.k0,
            dH: sys.dH,
            orderA: sys.orderA,
            orderB: sys.orderB,
          },
          alarms: [{ id: ++alarmSeq, ts: stamp(), level: 'info', msg: `Switched system: ${sys.name}` }, ...s.alarms].slice(0, 50),
        }), false, 'setSystem');
      },

      reset: () => {
        level = 'ok';
        set((s) => ({
          resetToken: s.resetToken + 1,
          live: initPoint,
          history: blankHistory(),
          exploded: false,
          running: true,
          alarms: [{ id: ++alarmSeq, ts: stamp(), level: 'info', msg: 'Simulation reset to safe state' }, ...s.alarms].slice(0, 50),
        }), false, 'reset');
      },

      applySnapshot: (snap) => {
        const { history, limits, alarms } = get();
        const nextHistory = [...history.slice(1), snap];
        let nextAlarms = alarms;
        const T = snap.T;

        const next: typeof level = snap.exploded ? 'crit' : T >= limits.critT ? 'crit' : T >= limits.warnT ? 'warn' : 'ok';
        if (next !== level) {
          const msg = snap.exploded ? 'THERMAL EXPLOSION: Reactor Ruptured!' : next === 'crit' ? `CRITICAL RUNAWAY: T = ${T.toFixed(1)} K` : `High Temperature Warning: T = ${T.toFixed(1)} K`;
          nextAlarms = [{ id: ++alarmSeq, ts: stamp(), level: next === 'ok' ? 'info' : next, msg }, ...alarms].slice(0, 50);
          level = next;
        }

        set({
          live: snap,
          history: nextHistory,
          alarms: nextAlarms,
          exploded: snap.exploded,
        });
      },

      loadScenario: ({ params, pid }) => {
        set((s) => ({
          params: { ...s.params, ...params },
          pid: { ...s.pid, ...pid },
          alarms: [{ id: ++alarmSeq, ts: stamp(), level: 'info', msg: 'Scenario loaded' }, ...s.alarms].slice(0, 50),
        }), false, 'loadScenario');
      },
    })),
    { name: 'simulation' }
  )
);