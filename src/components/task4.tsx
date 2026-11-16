import { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// --- Unified Telemetry & Snapshot Interfaces ---
interface TelemetryPoint {
  t: number;
  timestamp: string;
  T: number;
  Tc: number;
  Tsp: number;
  CA: number;
  CB: number;
  conversion: number;
  heatGen: number;
  flowRate: number;
}

interface Snapshot {
  id: number;
  timestamp: string;
  temp: string;
  coolingTemp: string;
  flowRate: string;
  status: 'Normal' | 'Warning';
}

const commonChartProps = { isAnimationActive: false, dot: false, strokeWidth: 1.6 as const };
const chartTooltip = {
  contentStyle: { background: '#020617', border: '1px solid #1e293b', fontSize: 11 },
  labelFormatter: (v: number) => `t = ${Number(v).toFixed(2)} min`,
};

export default function App() {
  // 1. Core Reactor Simulation State
  const [temperature, setTemperature] = useState<number>(350);
  const [flowRate, setFlowRate] = useState<number>(12.5);
  const [coolingTemp, setCoolingTemp] = useState<number>(298);

  // 2. Live Telemetry History & Historical Snapshots State
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // 3. Scenario Switcher Handler
  const handleApplyPreset = (presetParams: {
    temperature: number;
    flowRate: number;
    coolingTemp: number;
  }) => {
    setTemperature(presetParams.temperature);
    setFlowRate(presetParams.flowRate);
    setCoolingTemp(presetParams.coolingTemp);
  };

  // 4. Real-Time Telemetry & Snapshot Generator Loop
  useEffect(() => {
    let simTime = 0;

    const interval = setInterval(() => {
      simTime += 0.5;
      const nowStr = new Date().toLocaleTimeString();

      // Calculate approximate CSTR kinetic/thermodynamic outputs from current inputs
      const tempDelta = Math.max(0, temperature - coolingTemp);
      const kRate = 0.08 * Math.exp((temperature - 350) * 0.025);
      const tau = 100 / Math.max(flowRate, 1);
      const conversion = Math.min(0.99, (kRate * tau) / (1 + kRate * tau));
      const CA0 = 2.0;
      const CA = Number((CA0 * (1 - conversion)).toFixed(3));
      const CB = Number((CA0 * conversion).toFixed(3));
      const heatGen = Number(((tempDelta * flowRate * 41.84) + conversion * 1200).toFixed(1));

      const newPoint: TelemetryPoint = {
        t: simTime,
        timestamp: nowStr,
        T: Number(temperature.toFixed(2)),
        Tc: Number(coolingTemp.toFixed(2)),
        Tsp: 350,
        CA,
        CB,
        conversion: Number(conversion.toFixed(3)),
        heatGen,
        flowRate: Number(flowRate.toFixed(1)),
      };

      const newSnapshot: Snapshot = {
        id: Date.now(),
        timestamp: nowStr,
        temp: temperature.toFixed(2),
        coolingTemp: coolingTemp.toFixed(2),
        flowRate: flowRate.toFixed(1),
        status: Math.abs(temperature - coolingTemp) > 65 ? 'Warning' : 'Normal',
      };

      setHistory((prev) => [...prev, newPoint].slice(-60));
      setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 50));
    }, 1000);

    return () => clearInterval(interval);
  }, [temperature, flowRate, coolingTemp]);

  // 5. CSV Export Handler
  const exportToCSV = () => {
    const items =
      history.length > 0
        ? history
        : [
            {
              t: 0,
              timestamp: new Date().toLocaleTimeString(),
              T: temperature,
              Tc: coolingTemp,
              Tsp: 350,
              CA: 1.0,
              CB: 1.0,
              conversion: 0.5,
              heatGen: 2500,
              flowRate,
            },
          ];

    const headers =
      'SimTime_min,Timestamp,Reactor_Temp_K,Cooling_Temp_K,FlowRate_L_min,Reactant_CA,Product_CB,Conversion_XA,HeatGen_J_min\n';
    const rows = items
      .map(
        (log) =>
          `${log.t.toFixed(1)},${log.timestamp},${log.T},${log.Tc},${log.flowRate},${log.CA},${log.CB},${log.conversion},${log.heatGen}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cstr_telemetry_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const tempDelta = Math.abs(temperature - coolingTemp);
  const reactorStatus =
    tempDelta > 75 ? 'Critical' : tempDelta > 35 ? 'Watch' : 'Stable';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Header + Quick Scenario Presets */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">CSTR Digital Twin</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Process Control Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset({ temperature: 345, flowRate: 12.5, coolingTemp: 300 })}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-emerald-700 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer"
            >
              Preset: Steady State
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset({ temperature: 395, flowRate: 16.0, coolingTemp: 310 })}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-700 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 cursor-pointer"
            >
              Preset: High Throughput
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset({ temperature: 465, flowRate: 8.5, coolingTemp: 335 })}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-rose-700 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 cursor-pointer"
            >
              Preset: Thermal Runaway
            </button>
          </div>
        </header>

        {/* Control Sliders */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Reactor Temperature</span>
              <span className="text-lg font-semibold text-cyan-300">{temperature.toFixed(1)} K</span>
            </div>
            <input
              type="range"
              min={250}
              max={500}
              step={1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Feed Flow Rate</span>
              <span className="text-lg font-semibold text-emerald-300">{flowRate.toFixed(1)} L/min</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={0.5}
              value={flowRate}
              onChange={(e) => setFlowRate(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/30">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Cooling Temperature</span>
              <span className="text-lg font-semibold text-violet-300">{coolingTemp.toFixed(1)} K</span>
            </div>
            <input
              type="range"
              min={260}
              max={340}
              step={1}
              value={coolingTemp}
              onChange={(e) => setCoolingTemp(Number(e.target.value))}
              className="w-full accent-violet-400"
            />
          </div>
        </section>

        {/* Key Metrics Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Temperature Gap</p>
            <p className="mt-2 text-2xl font-bold text-white">{tempDelta.toFixed(1)} K</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Thermal Load</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {(((temperature - coolingTemp) / Math.max(flowRate, 1)) * 5.5).toFixed(2)} kW
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">System Status</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                reactorStatus === 'Critical'
                  ? 'text-rose-400'
                  : reactorStatus === 'Watch'
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {reactorStatus}
            </p>
          </div>
        </section>

        {/* Analytics & Live Telemetry Section */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-4 gap-4">
          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2">
            <span className="text-xs uppercase tracking-wider font-mono font-bold text-cyan-400">
              CSTR Analytics & Live Telemetry
            </span>

            <button
              type="button"
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 text-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              Export Session CSV
            </button>
          </div>

          {/* 2x2 Chart Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Chart 1: Concentrations CA & CB */}
            <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-2 h-56">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono mb-1">
                Species Concentration (mol/L)
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area {...commonChartProps} type="monotone" dataKey="CA" name="Reactant (CA)" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} />
                    <Area {...commonChartProps} type="monotone" dataKey="CB" name="Product (CB)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Temperatures T, Tc, Tsp */}
            <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-2 h-56">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono mb-1">
                Temperatures (K)
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis domain={['auto', 'auto']} tickFormatter={(v) => Number(v).toFixed(0)} />
                    <Tooltip {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area {...commonChartProps} type="monotone" dataKey="T" name="Reactor (T)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} />
                    <Area {...commonChartProps} type="monotone" dataKey="Tc" name="Jacket (Tc)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.08} />
                    <Area {...commonChartProps} type="stepAfter" dataKey="Tsp" name="Setpoint" stroke="#a3e635" fill="none" strokeDasharray="5 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Conversion */}
            <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-2 h-56">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono mb-1">
                Conversion (XA)
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis domain={[0, 1.2]} />
                    <Tooltip {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area {...commonChartProps} type="monotone" dataKey="conversion" name="Conversion (XA)" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Heat Generation Rate (Q_gen) */}
            <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-2 h-56">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 px-2 font-mono mb-1">
                Heat Generation Rate Q_gen (J/min)
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} syncId="sim" margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tickFormatter={(v) => Number(v).toFixed(1)} type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area {...commonChartProps} type="monotone" dataKey="heatGen" name="Qgen (J/min)" stroke="#ec4899" fill="#ec4899" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Expandable Historical Data Table */}
          <div className="w-full border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-left text-xs font-mono font-semibold flex justify-between items-center transition-colors text-cyan-400 cursor-pointer"
            >
              <span>Historical Data Table View ({snapshots.length} Snapshots)</span>
              <span>{isHistoryOpen ? '▲ Collapse' : '▼ Expand'}</span>
            </button>

            {isHistoryOpen && (
              <div className="max-h-60 overflow-y-auto border-t border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 font-mono">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Reactor Temp (K)</th>
                      <th className="p-2.5">Cooling Temp (K)</th>
                      <th className="p-2.5">Flow (L/min)</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          Waiting for data snapshots...
                        </td>
                      </tr>
                    ) : (
                      snapshots.map((row) => (
                        <tr key={row.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 text-slate-200">
                          <td className="p-2.5 font-mono text-slate-400">{row.timestamp}</td>
                          <td className="p-2.5">{row.temp}</td>
                          <td className="p-2.5">{row.coolingTemp}</td>
                          <td className="p-2.5">{row.flowRate}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.status === 'Normal'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}