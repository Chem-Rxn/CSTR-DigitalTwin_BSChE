import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useThrottled } from '@/store/hooks';

const common = { isAnimationActive: false, dot: false, strokeWidth: 1.6 as const };
const tip = {
  contentStyle: { background: '#020617', border: '1px solid #1e293b', fontSize: 11 },
  labelFormatter: (v: number) => `t = ${Number(v).toFixed(2)} min`,
};

export default function AnalyticsPanel() {
  const data = useThrottled((s) => s.history, 100);

  return (
    <section className="h-full min-h-0 grid grid-cols-2 gap-2 bg-slate-950 p-2 overflow-hidden">
      
      {/* Chart 1: Concentrations CA & CB */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded p-1">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono">Species Concentration (mol/L)</div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis domain={[0, 'auto']} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area {...common} type="monotone" dataKey="CA" name="Reactant (CA)" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} />
              <Area {...common} type="monotone" dataKey="CB" name="Product (CB)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Temperatures T, Tc, Tsp */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded p-1">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono">Temperatures (K)</div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(0)} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area {...common} type="monotone" dataKey="T" name="Reactor (T)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} />
              <Area {...common} type="monotone" dataKey="Tc" name="Jacket (Tc)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.08} />
              <Area {...common} type="stepAfter" dataKey="Tsp" name="Setpoint" stroke="#a3e635" fill="none" strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Conversion & Damköhler Number */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded p-1">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono">Conversion (XA) & Damköhler (Da)</div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis domain={[0, 1.2]} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area {...common} type="monotone" dataKey="conversion" name="Conversion (XA)" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Heat Generation Rate (Q_gen) */}
      <div className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded p-1">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono">Heat Generation Rate Q_gen (J/min)</div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip {...tip} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area {...common} type="monotone" dataKey="heatGen" name="Qgen (J/min)" stroke="#ec4899" fill="#ec4899" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}