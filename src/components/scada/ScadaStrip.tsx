// src/components/scada/ScadaStrip.tsx 
// The control-room strip under the header: digital LED readouts, annunciator lamps, toggle switches.
import { useSimulationStore } from '@/store/useSimulationStore';
import { useControlStore } from '@/store/useControlStore';
import { useThrottled } from '@/store/hooks';
import { TC_MAX, TC_MIN, clamp } from '@/engine/physics';
import { Bezel, StatusLamp, ToggleSwitch } from './ScadaPrimitives';
import { LedReadout } from './SevenSeg';

const AGITATOR_RPM = 120;

export default function ScadaStrip() {
  const live = useThrottled((s) => s.live, 100);
  const pid = useSimulationStore((s) => s.pid);
  const setPid = useSimulationStore((s) => s.setPid);
  const limits = useSimulationStore((s) => s.limits);
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const exploded = useSimulationStore((s) => s.exploded);
  const rpm = useSimulationStore((s) => s.rpm);
  const setRpm = useSimulationStore((s) => s.setRpm);

  const esd = useControlStore((s) => s.esdActive);
  const armed = useControlStore((s) => s.autoTripArmed);
  const setArmed = useControlStore((s) => s.setAutoTripArmed);

  const warn = live.T >= limits.warnT;
  const crit = live.T >= limits.critT;
  // Jacket temperature -> how hard the cooling circuit is working (270 K = 100 %, 420 K = 0 %).
  const duty = clamp(((TC_MAX - live.Tc) / (TC_MAX - TC_MIN)) * 100, 0, 100);

  return (
    <div className="flex shrink-0 items-stretch gap-3 overflow-x-auto border-b border-slate-800 bg-slate-950 px-3 py-2">
      <Bezel title="PROCESS VARIABLES  /  R-101">
        <div className="flex gap-3">
          <LedReadout label="TT-101 reactor" unit="K" value={live.T} alarm={warn} />
          <LedReadout label="SP" unit="K" value={pid.auto ? pid.Tsp : '-----'} color="#a3e635" />
          <LedReadout label="Jacket Tc" unit="K" value={live.Tc} color="#38bdf8" />
          <LedReadout label="AT-101 CA" unit="mol/L" value={live.CA} decimals={3} color="#f59e0b" />
          <LedReadout label="Conversion" unit="%" value={live.conversion * 100} color="#10b981" />
          <LedReadout label="Cooling duty" unit="%" value={duty} decimals={0} cells={3} color="#38bdf8" />
        </div>
      </Bezel>

      <Bezel title="ANNUNCIATOR">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <StatusLamp label="RUNNING" on={running && !exploded} color="#22c55e" />
          <StatusLamp label="AUTO MODE" on={pid.auto} color="#22d3ee" />
          <StatusLamp label="HIGH TEMP" on={warn} color="#f59e0b" blink="slow" />
          <StatusLamp label="HIGH-HIGH" on={crit} color="#ef4444" blink="fast" />
          <StatusLamp label="ESD ACTIVE" on={esd} color="#ef4444" blink="fast" />
          <StatusLamp label="RUPTURE" on={exploded} color="#ef4444" blink="fast" />
        </div>
      </Bezel>

      <Bezel title="CONTROL SWITCHES">
        <div className="flex gap-2">
          <ToggleSwitch label="SIM" on={running} onChange={setRunning} onText="RUN" offText="HOLD" disabled={exploded} />
          <ToggleSwitch label="MODE" on={pid.auto} onChange={(auto) => setPid({ auto })} onText="AUTO" offText="MANUAL" color="#22d3ee" disabled={esd} />
          <ToggleSwitch label="AGITATOR" on={rpm > 0} onChange={(on) => setRpm(on ? AGITATOR_RPM : 0)} onText="ON" offText="OFF" />
          <ToggleSwitch label="AUTO-TRIP" on={armed} onChange={setArmed} onText="ARMED" offText="OFF" color="#f59e0b" />
        </div>
      </Bezel>
    </div>
  );
}
