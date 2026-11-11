// src/store/useControlStore.ts  (Member 3)
// Owns everything about the Emergency Shutdown (ESD) interlock and the auto-trip.
// It drives the existing simulation store through its public actions only,
// so no physics/bridge code needs to know ESD exists.
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useSimulationStore } from './useSimulationStore';
import type { Alarm } from './useSimulationStore';
import { TC_MIN } from '@/engine/physics';

export interface EsdSnapshot {
  F: number;
  auto: boolean;
  manualTc: number;
}

interface ControlState {
  esdActive: boolean;
  esdReason: string | null;
  esdAt: string | null;
  esdPrev: EsdSnapshot | null;
  autoTripArmed: boolean;
  autoTripT: number;
  setAutoTripArmed: (v: boolean) => void;
  setAutoTripT: (v: number) => void;
  engageEsd: (reason: string) => void;
  releaseEsd: () => void;
}

const stamp = () => new Date().toLocaleTimeString([], { hour12: false });

// Alarm ids from the simulation store start at 0; ours start high so keys never collide.
let alarmSeq = 1_000_000;
export function logAlarm(level: Alarm['level'], msg: string) {
  useSimulationStore.setState((s) => ({
    alarms: [{ id: ++alarmSeq, ts: stamp(), level, msg }, ...s.alarms].slice(0, 50),
  }));
}

export const useControlStore = create<ControlState>()(
  subscribeWithSelector((set, get) => ({
    esdActive: false,
    esdReason: null,
    esdAt: null,
    esdPrev: null,
    autoTripArmed: false, // off by default so the "Cooling Failure Runaway" demo still ends in the explosion
    // Tested against the Cooling Failure case: the ESD stops feed and heat input, but reactant already in the
    // vessel keeps reacting, so a trip at 410 K was too late (ruptured anyway); trips at or below ~395 K held.
    autoTripT: 370,

    setAutoTripArmed: (autoTripArmed) => {
      set({ autoTripArmed });
      logAlarm('info', autoTripArmed ? `Auto-trip ARMED at ${get().autoTripT} K` : 'Auto-trip DISARMED');
    },
    setAutoTripT: (autoTripT) => set({ autoTripT }),

    engageEsd: (reason) => {
      if (get().esdActive) return;
      const sim = useSimulationStore.getState();
      const prev: EsdSnapshot = { F: sim.params.F, auto: sim.pid.auto, manualTc: sim.pid.manualTc };

      set({ esdActive: true, esdReason: reason, esdAt: stamp(), esdPrev: prev });

      sim.setParam('F', 0); // cut feed
      sim.setPid({ auto: false, manualTc: TC_MIN }); // max cooling: jacket at its coldest
      if (!sim.exploded && !sim.running) sim.setRunning(true); // let the operator watch it respond

      logAlarm('crit', `EMERGENCY SHUTDOWN (${reason}): feed cut, cooling at maximum`);
    },

    releaseEsd: () => {
      const { esdActive, esdPrev } = get();
      if (!esdActive) return;
      set({ esdActive: false, esdReason: null, esdAt: null, esdPrev: null });

      const sim = useSimulationStore.getState();
      if (esdPrev) {
        sim.setParam('F', esdPrev.F);
        sim.setPid({ auto: esdPrev.auto, manualTc: esdPrev.manualTc });
      }
      logAlarm('info', 'ESD interlock reset by operator: feed and controller mode restored');
    },
  }))
);
