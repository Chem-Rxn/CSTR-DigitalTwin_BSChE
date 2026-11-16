// src/engine/interlocks.ts  (Member 3)
import { useSimulationStore } from '@/store/useSimulationStore';
import { useControlStore } from '@/store/useControlStore';
import { TC_MIN } from './physics';

/**
 * Two safety functions, both event-driven (no polling):
 *  1. ESD latch    - while ESD is active, any attempt to reopen the feed or take the
 *                    controller out of full-cooling is undone immediately.
 *  2. Auto-trip    - if armed, a high-high reactor temperature engages the ESD by itself.
 * Call once at start-up; returns a cleanup function.
 */
export function startInterlocks(): () => void {
  const sim = useSimulationStore;
  const ctl = useControlStore;

  const enforce = () => {
    if (!ctl.getState().esdActive) return;
    const { params, pid, setParam, setPid } = sim.getState();
    if (params.F !== 0) setParam('F', 0);
    if (pid.auto || pid.manualTc !== TC_MIN) setPid({ auto: false, manualTc: TC_MIN });
  };

  const stopLatch = sim.subscribe((s) => `${s.params.F}|${s.pid.auto}|${s.pid.manualTc}`, enforce);

  const stopTrip = sim.subscribe(
    (s) => s.live.T,
    (T) => {
      const c = ctl.getState();
      if (c.autoTripArmed && !c.esdActive && T >= c.autoTripT) {
        c.engageEsd(`AUTO-TRIP: T = ${T.toFixed(1)} K >= ${c.autoTripT} K`);
      }
    }
  );

  return () => {
    stopLatch();
    stopTrip();
  };
}
