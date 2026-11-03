import { useThrottled } from '@/store/hooks';
import { useSimulationStore } from '@/store/useSimulationStore';

function Tag({ x, y, label, value, hot }: { x: number; y: number; label: string; value: string; hot?: boolean }) {
  return (
    <g transform={`translate(${x},${y})`} className="font-mono">
      <circle r="14" fill="#020617" stroke={hot ? '#ef4444' : '#22d3ee'} strokeWidth="1.5" />
      <text textAnchor="middle" y="-2" fontSize="7" fill="#94a3b8">{label}</text>
      <text textAnchor="middle" y="8" fontSize="6.5" fill={hot ? '#ef4444' : '#22d3ee'}>{value}</text>
    </g>
  );
}

export default function PidPanel() {
  const live = useThrottled((s) => s.live, 250);
  const limits = useSimulationStore((s) => s.limits);
  const hot = live.T >= limits.warnT;
  const stroke = '#475569';

  return (
    <section className="h-full min-h-0 grid grid-cols-[1.1fr_1fr] bg-slate-950 border-t border-slate-800">
      <div className="min-w-0 p-2 border-r border-slate-800">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-1">P&ID R-101</div>
        <svg viewBox="0 0 320 190" className="w-full h-[calc(100%-1rem)]">
          <line x1="10" y1="30" x2="125" y2="30" stroke={stroke} strokeWidth="3" />
          <line x1="125" y1="30" x2="125" y2="55" stroke={stroke} strokeWidth="3" />
          <polygon points="50,23 50,37 62,30" fill="#22d3ee" />
          <text x="12" y="22" fontSize="8" fill="#94a3b8">FEED A</text>
          
          <rect x="100" y="55" width="80" height="90" rx="14" fill={hot ? '#450a0a' : '#0c1a2b'} stroke={hot ? '#ef4444' : '#22d3ee'} strokeWidth="2" />
          <line x1="140" y1="40" x2="140" y2="120" stroke={stroke} strokeWidth="2" />
          
          <Tag x={140} y={95} label="TT-101" value={`${live.T.toFixed(1)}K`} hot={hot} />
          <Tag x={140} y={125} label="AT-101" value={`${live.CA.toFixed(2)}`} />
        </svg>
      </div>

      <div className="p-3 flex flex-col justify-center text-xs gap-2">
        <div className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Reactor Diagnostics</div>
        <div className="flex justify-between border-b border-slate-900 py-1">
          <span className="text-slate-500">Jacket Temp (Tc):</span>
          <span className="font-mono text-cyan-400">{live.Tc.toFixed(1)} K</span>
        </div>
        <div className="flex justify-between border-b border-slate-900 py-1">
          <span className="text-slate-500">Conversion (CA):</span>
          <span className="font-mono text-amber-400">{live.CA.toFixed(3)} M</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Product (CB):</span>
          <span className="font-mono text-teal-400">{live.CB.toFixed(3)} M</span>
        </div>
      </div>
    </section>
  );
}