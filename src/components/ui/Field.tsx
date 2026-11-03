interface Props {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  digits?: number;
  sci?: boolean;
}

export default function Field({ label, unit, value, min, max, step, onChange, digits = 2, sci }: Props) {
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : min;
  const displayValue = sci ? Number(safeValue.toPrecision(4)) : Number(safeValue.toFixed(digits));

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-300 tracking-wide">{label}</span>
        {unit && <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">{unit}</span>}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <input
          type="range"
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) {
              onChange(Math.min(max, Math.max(min, v)));
            }
          }}
          className="w-28 bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none rounded px-2 py-1 font-mono text-xs text-cyan-300 text-right shadow-inner"
        />
      </div>
    </div>
  );
}