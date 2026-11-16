// src/components/scada/ScadaPrimitives.tsx
import type { ReactNode } from 'react';
import './scada.css';

/** Metal-faced control-room panel with a title plate. */
export function Bezel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col shrink-0 rounded border border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}>
      <div className="px-2 py-0.5 text-[9px] font-mono tracking-[0.18em] text-slate-400 bg-slate-950/70 border-b border-slate-700 rounded-t">
        {title}
      </div>
      <div className="p-2 flex-1">{children}</div>
    </div>
  );
}

/** Round indicator lamp. `blink` makes it flash (slow = warning, fast = critical). */
export function StatusLamp({ label, on, color, blink }: { label: string; on: boolean; color: string; blink?: 'slow' | 'fast' }) {
  const blinkClass = on && blink ? (blink === 'fast' ? 'scada-blink-fast' : 'scada-blink') : '';
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full border border-black/60 ${blinkClass}`}
        style={{
          background: on ? `radial-gradient(circle at 35% 30%, #ffffff99, ${color} 55%)` : '#1e293b',
          boxShadow: on ? `0 0 8px 1px ${color}` : 'inset 0 1px 2px #000',
        }}
      />
      <span className={`text-[10px] font-mono whitespace-nowrap ${on ? 'text-slate-200' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}

interface ToggleProps {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  onText?: string;
  offText?: string;
  color?: string; // lamp colour while ON
  disabled?: boolean;
}

/** Physical-style toggle switch: metal plate, screws, and a lever that flips up (ON) or down (OFF). */
export function ToggleSwitch({ label, on, onChange, onText = 'ON', offText = 'OFF', color = '#22c55e', disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex w-[72px] flex-col items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-[9px] font-mono tracking-wider text-slate-400">{label}</span>

      <span className="relative block h-11 w-8 rounded-md border border-slate-600 bg-gradient-to-b from-slate-600 to-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.6)]">
        <span className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-slate-400" />
        <span className="absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-400" />
        <span className="absolute inset-x-[10px] top-2.5 bottom-2.5 rounded-full bg-black/80 shadow-inner" />
        {/* lever pivots on the plate centre; rotating 180deg flips it from up to down */}
        <span
          className="absolute left-1/2 top-1/2 block h-0 w-0"
          style={{ transform: `rotate(${on ? 0 : 180}deg)`, transition: 'transform 140ms ease-out' }}
        >
          <span className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center">
            <span className="block h-3 w-3 rounded-full border border-slate-500 bg-gradient-to-br from-white to-slate-400 shadow" />
            <span className="block h-2 w-1.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500" />
          </span>
        </span>
      </span>

      <span className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: on ? color : '#64748b' }}>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: on ? color : '#334155', boxShadow: on ? `0 0 6px ${color}` : 'none' }}
        />
        {on ? onText : offText}
      </span>
    </button>
  );
}
