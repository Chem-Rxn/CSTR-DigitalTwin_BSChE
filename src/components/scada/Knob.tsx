// src/components/scada/Knob.tsx 
// Rotary dial. Drag up/down (Shift = fine), mouse wheel while focused, arrow keys,
// double-click resets to default, or type an exact value in the box underneath.
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface KnobProps {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  defaultValue?: number;
  log?: boolean; // logarithmic travel (needs min > 0): good for gains spanning decades
  decimals?: number;
  color?: string;
  display?: string; // overrides the text in the box, e.g. "OFF"
  disabled?: boolean;
}

const A0 = -135;
const A1 = 135;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
};
const arc = (r: number, from: number, to: number) => {
  const [sx, sy] = polar(r, from);
  const [ex, ey] = polar(r, to);
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
};

export default function Knob({
  label, unit, value, min, max, onChange, defaultValue, log = false, decimals = 1, color = '#22d3ee', display, disabled = false,
}: KnobProps) {
  const v = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const toFrac = (x: number) => clamp01(log ? Math.log(x / min) / Math.log(max / min) : (x - min) / (max - min));
  const fromFrac = (f: number) => (log ? min * Math.pow(max / min, f) : min + f * (max - min));
  const frac = toFrac(v);
  const angle = A0 + frac * (A1 - A0);
  const commit = (f: number) => onChange(Number(fromFrac(clamp01(f)).toFixed(decimals)));

  // Native wheel listener must be non-passive to be allowed to preventDefault.
  const latest = useRef({ frac, commit, disabled });
  useEffect(() => {
    latest.current = { frac, commit, disabled };
  });
  const dialRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const l = latest.current;
      if (l.disabled || document.activeElement !== el) return; // only when the dial is focused, so panel scrolling still works
      e.preventDefault();
      l.commit(l.frac + (e.deltaY < 0 ? 0.02 : -0.02));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const drag = useRef<{ y: number; f: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    drag.current = { y: e.clientY, f: frac };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const travel = e.shiftKey ? 700 : 180; // px for full range
    commit(drag.current.f + (drag.current.y - e.clientY) / travel);
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const k = e.key;
    const d = k === 'ArrowUp' || k === 'ArrowRight' ? 0.01 : k === 'ArrowDown' || k === 'ArrowLeft' ? -0.01 : k === 'PageUp' ? 0.1 : k === 'PageDown' ? -0.1 : 0;
    if (d !== 0) {
      e.preventDefault();
      commit(frac + d);
    } else if (k === 'Home') {
      e.preventDefault();
      commit(0);
    } else if (k === 'End') {
      e.preventDefault();
      commit(1);
    }
  };

  // Typed entry
  const shown = display ?? v.toFixed(decimals);
  const [draft, setDraft] = useState<string | null>(null);
  const cancel = useRef(false);
  const applyDraft = () => {
    if (!cancel.current && draft !== null) {
      const n = parseFloat(draft);
      if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    }
    cancel.current = false;
    setDraft(null);
  };

  return (
    <div className={`flex w-[104px] flex-col items-center gap-1 ${disabled ? 'opacity-40' : ''}`}>
      <div
        ref={dialRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={`${shown}${unit ? ' ' + unit : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onDoubleClick={() => defaultValue !== undefined && !disabled && onChange(defaultValue)}
        className="cursor-ns-resize touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        title="Drag up/down to adjust (Shift = fine). Double-click to reset."
      >
        <svg viewBox="0 0 100 100" width={92} height={92}>
          {Array.from({ length: 11 }).map((_, i) => {
            const [x1, y1] = polar(45, A0 + i * 27);
            const [x2, y2] = polar(49, A0 + i * 27);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={i % 5 === 0 ? 1.6 : 0.9} />;
          })}
          <path d={arc(38, A0, A1)} stroke="#1e293b" strokeWidth={6} fill="none" strokeLinecap="round" />
          {frac > 0.001 && (
            <path d={arc(38, A0, angle)} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
          )}
          <circle cx={50} cy={50} r={27} fill="#0b1220" stroke="#475569" strokeWidth={2} />
          <circle cx={50} cy={50} r={22} fill="#1e293b" stroke="#334155" strokeWidth={1} />
          <g transform={`rotate(${angle} 50 50)`}>
            <line x1={50} y1={36} x2={50} y2={26} stroke={color} strokeWidth={3.2} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
          </g>
        </svg>
      </div>

      <span className="text-[10px] font-medium text-slate-300 text-center leading-tight">{label}</span>

      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={draft ?? shown}
          aria-label={`${label} value`}
          onFocus={(e) => {
            setDraft(shown);
            e.currentTarget.select();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={applyDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancel.current = true;
              e.currentTarget.blur();
            }
          }}
          className="w-14 rounded-sm border border-slate-700 bg-black px-1 py-0.5 text-right font-mono text-xs outline-none focus:border-cyan-400"
          style={{ color, textShadow: `0 0 4px ${color}88` }}
        />
        {unit && <span className="w-9 text-[9px] font-mono text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
