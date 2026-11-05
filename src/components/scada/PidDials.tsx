// src/components/scada/PidDials.tsx 
// Replaces the old "PID Control" tab body. Operators think in Kp / Ti / Td, the engine stores
// the parallel form (Kp, Ki, Kd), so this panel converts:  Ki = Kp / Ti   Kd = Kp * Td.
// Every dial writes straight to the store, and the bridge reads the store each step,
// so the charts react immediately.
import { useSimulationStore } from '@/store/useSimulationStore';
import { useThrottled } from '@/store/hooks';
import { DEFAULT_PID } from '@/engine/physics';
import Knob from './Knob';
import { ToggleSwitch } from './ScadaPrimitives';
import { LedReadout } from './SevenSeg';

const TI_OFF = 60; // min; the far end of the Ti dial means "integral action off"
const DEF_TI = DEFAULT_PID.Ki > 0 ? DEFAULT_PID.Kp / DEFAULT_PID.Ki : TI_OFF;
const DEF_TD = DEFAULT_PID.Kp > 0 ? DEFAULT_PID.Kd / DEFAULT_PID.Kp : 0;

const PRESETS = [
  { name: 'Gentle', Kp: 2, Ti: 10, Td: 0 },
  { name: 'Balanced', Kp: 4, Ti: 5, Td: 0 },
  { name: 'Aggressive', Kp: 10, Ti: 1.5, Td: 0.3 },
] as const;

export default function PidDials() {
  const pid = useSimulationStore((s) => s.pid);
  const setPid = useSimulationStore((s) => s.setPid);
  const live = useThrottled((s) => s.live, 100);

  const Kp = pid.Kp;
  const Ti = pid.Ki > 1e-9 && Kp > 1e-9 ? Math.min(TI_OFF, Kp / pid.Ki) : TI_OFF;
  const Td = Kp > 1e-9 ? pid.Kd / Kp : 0;
  const tiOff = Ti >= TI_OFF;

  // Changing Kp keeps Ti and Td where they are (as on a real controller faceplate).
  const setKp = (v: number) => setPid({ Kp: v, Ki: tiOff ? 0 : v / Ti, Kd: v * Td });
  const setTi = (v: number) => setPid({ Ki: v >= TI_OFF ? 0 : Kp / v });
  const setTd = (v: number) => setPid({ Kd: Kp * v });
  const applyPreset = (p: (typeof PRESETS)[number]) => setPid({ Kp: p.Kp, Ki: p.Kp / p.Ti, Kd: p.Kp * p.Td });

  const error = pid.Tsp - live.T;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">TIC-101 Controller Faceplate</div>

      {/* Digital readouts */}
      <div className="grid grid-cols-4 gap-2 rounded border border-slate-800 bg-slate-900/60 p-2">
        <LedReadout label="PV" unit="K" value={live.T} cells={5} height={20} />
        <LedReadout label="SP" unit="K" value={pid.auto ? pid.Tsp : '-----'} cells={5} height={20} color="#a3e635" />
        <LedReadout label="OUT" unit="K" value={live.Tc} cells={5} height={20} color="#38bdf8" />
        <LedReadout label="ERR" unit="K" value={pid.auto ? error : '-----'} cells={5} height={20} color="#f59e0b" />
      </div>

      {/* Mode + presets */}
      <div className="flex items-center justify-between gap-3 rounded border border-slate-800 bg-slate-900/60 p-2">
        <ToggleSwitch label="MODE" on={pid.auto} onChange={(auto) => setPid({ auto })} onText="AUTO" offText="MANUAL" color="#22d3ee" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-mono tracking-wider text-slate-400">TUNING PRESET</span>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-mono text-slate-300 hover:border-cyan-500 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tuning dials */}
      <div className="flex justify-between rounded border border-slate-800 bg-slate-900/60 px-2 py-3">
        <Knob label="Proportional gain (Kp)" unit="K/K" value={Kp} min={0.1} max={30} log decimals={2} defaultValue={DEFAULT_PID.Kp} onChange={setKp} />
        <Knob
          label="Integral time (Ti)"
          unit="min"
          value={Ti}
          min={0.1}
          max={TI_OFF}
          log
          decimals={1}
          color="#a3e635"
          display={tiOff ? 'OFF' : undefined}
          defaultValue={DEF_TI}
          onChange={setTi}
        />
        <Knob label="Derivative time (Td)" unit="min" value={Td} min={0} max={2} decimals={2} color="#f59e0b" defaultValue={DEF_TD} onChange={setTd} />
      </div>

      {/* Setpoint / manual output + bias */}
      <div className="flex justify-around rounded border border-slate-800 bg-slate-900/60 px-2 py-3">
        {pid.auto ? (
          <Knob label="Setpoint (SP)" unit="K" value={pid.Tsp} min={280} max={420} decimals={1} color="#a3e635" defaultValue={DEFAULT_PID.Tsp} onChange={(v) => setPid({ Tsp: v })} />
        ) : (
          <Knob label="Manual output (Tc)" unit="K" value={pid.manualTc} min={270} max={420} decimals={1} color="#38bdf8" defaultValue={DEFAULT_PID.manualTc} onChange={(v) => setPid({ manualTc: v })} />
        )}
        <Knob label="Output bias" unit="K" value={pid.bias} min={280} max={360} decimals={1} color="#94a3b8" defaultValue={DEFAULT_PID.bias} onChange={(v) => setPid({ bias: v })} />
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        Drag a dial up or down (hold Shift for fine steps), scroll while it is focused, or type a value. Double-click resets it. Ti at the far end turns integral action off.
      </p>
    </div>
  );
}
