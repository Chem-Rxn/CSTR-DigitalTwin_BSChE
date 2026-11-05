// src/components/scada/EsdPanel.tsx 
import { useState } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useControlStore } from '@/store/useControlStore';
import { useThrottled } from '@/store/hooks';
import { StatusLamp } from './ScadaPrimitives';
import './scada.css';

function Row({ label, value, on, color, blink }: { label: string; value: string; on: boolean; color: string; blink?: 'slow' | 'fast' }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-900 py-1">
      <StatusLamp label={label} on={on} color={color} blink={blink} />
      <span className="truncate font-mono text-[10px] text-slate-400">{value}</span>
    </div>
  );
}

/** Small numeric box that only commits on Enter/blur, so half-typed numbers never get clamped mid-keystroke. */
function TripInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const n = parseFloat(draft ?? '');
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
    setDraft(null);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="Auto-trip temperature setpoint in kelvin"
      value={draft ?? String(value)}
      onFocus={(e) => {
        setDraft(String(value));
        e.currentTarget.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-14 rounded-sm border border-slate-700 bg-black px-1 py-0.5 text-right font-mono text-xs text-amber-300 outline-none focus:border-amber-400"
    />
  );
}

export default function EsdPanel() {
  const esd = useControlStore((s) => s.esdActive);
  const reason = useControlStore((s) => s.esdReason);
  const at = useControlStore((s) => s.esdAt);
  const armed = useControlStore((s) => s.autoTripArmed);
  const tripT = useControlStore((s) => s.autoTripT);
  const setTripT = useControlStore((s) => s.setAutoTripT);
  const engage = useControlStore((s) => s.engageEsd);
  const release = useControlStore((s) => s.releaseEsd);

  const F = useSimulationStore((s) => s.params.F);
  const auto = useSimulationStore((s) => s.pid.auto);
  const warnT = useSimulationStore((s) => s.limits.warnT);
  const T = useThrottled((s) => s.live.T, 200);

  // Permissive: the operator may only reset the interlock once the reactor is back below the high-temperature alarm.
  const canRelease = T < warnT;

  return (
    <section className="shrink-0 border-t-2 border-red-900/70 bg-slate-950 p-3" aria-label="Emergency shutdown panel">
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="esd-plate">
            <button className="esd-button" disabled={esd} onClick={() => engage('OPERATOR PUSHBUTTON')} aria-label="Emergency shutdown">
              E-STOP
            </button>
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-red-400">EMERGENCY SHUTDOWN</span>
        </div>

        <div className="min-w-0 flex-1">
          <Row label="XV-101 FEED" value={esd ? 'CLOSED  F = 0' : `OPEN  F = ${F.toFixed(0)} L/min`} on color={esd ? '#ef4444' : '#22c55e'} blink={esd ? 'slow' : undefined} />
          <Row label="CV-101 COOLING" value={esd ? 'MAXIMUM' : 'NORMAL'} on color={esd ? '#38bdf8' : '#22c55e'} />
          <Row label="TIC-101" value={esd ? 'LOCKED / MANUAL' : auto ? 'AUTO' : 'MANUAL'} on color={esd ? '#ef4444' : '#22d3ee'} />
          <div className="flex items-center justify-between gap-2 py-1">
            <StatusLamp label="AUTO-TRIP" on={armed} color="#f59e0b" />
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
              {armed ? 'ARMED' : 'OFF'} @ <TripInput value={tripT} min={340} max={420} onChange={setTripT} /> K
            </span>
          </div>
        </div>
      </div>

      {esd && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded border border-red-900/70 bg-red-950/40 px-2 py-1.5">
          <div className="min-w-0 font-mono text-[10px] text-red-300">
            <div className="truncate">{reason}</div>
            <div className="text-red-400/70">since {at}</div>
          </div>
          <button
            onClick={release}
            disabled={!canRelease}
            title={canRelease ? 'Restore feed and controller mode' : `Reset is blocked until reactor temperature is below ${warnT} K`}
            className="shrink-0 rounded border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-mono font-bold text-emerald-300 hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          >
            {canRelease ? 'RESET ESD' : `INHIBITED  T ≥ ${warnT} K`}
          </button>
        </div>
      )}
    </section>
  );
}
