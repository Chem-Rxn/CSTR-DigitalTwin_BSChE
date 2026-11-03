import Field from './Field';
import ScenarioBar from './ScenarioBar';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useUIStore, TabId } from '@/store/useUIStore';
import { CHEMICAL_SYSTEMS } from '@/engine/physics';

const TABS: { id: TabId | 'chem'; label: string }[] = [
  { id: 'flow', label: 'Flow & Feed' },
  { id: 'thermo', label: 'Thermodynamics' },
  { id: 'chem', label: 'Chemical System' },
  { id: 'pid', label: 'PID Control' },
];

function Flow() {
  const p = useSimulationStore((s) => s.params);
  const set = useSimulationStore((s) => s.setParam);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Operating Feed Conditions</div>
      <Field label="Feed Rate (F)" unit="L/min" value={p.F} min={10} max={300} step={1} digits={1} onChange={(v) => set('F', v)} />
      <Field label="Feed Temperature (T0)" unit="K" value={p.T0} min={250} max={450} step={1} digits={1} onChange={(v) => set('T0', v)} />
      <Field label="Feed Concentration (CA0)" unit="mol/L" value={p.CAO} min={0.1} max={5} step={0.01} digits={2} onChange={(v) => set('CAO', v)} />
    </div>
  );
}

function Thermo() {
  const p = useSimulationStore((s) => s.params);
  const set = useSimulationStore((s) => s.setParam);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Kinetic & Thermal Constants</div>
      <Field label="Activation Energy (Ea)" unit="J/mol" value={p.Ea} min={20000} max={120000} step={500} digits={0} onChange={(v) => set('Ea', v)} />
      <Field label="Pre-exponential Factor (k0)" unit="1/min" value={p.k0} min={1e6} max={1e14} step={1e7} sci onChange={(v) => set('k0', v)} />
      <Field label="Heat of Reaction (-ΔH)" unit="J/mol" value={p.dH} min={5000} max={150000} step={500} digits={0} onChange={(v) => set('dH', v)} />
      <Field label="Solution Density (ρ)" unit="g/L" value={p.rho} min={500} max={2000} step={5} digits={0} onChange={(v) => set('rho', v)} />
      <Field label="Heat Capacity (Cp)" unit="J/g·K" value={p.Cp} min={0.1} max={2} step={0.001} digits={3} onChange={(v) => set('Cp', v)} />
      <Field label="Heat Transfer Coeff (UA)" unit="J/min·K" value={p.UA} min={1000} max={200000} step={500} digits={0} onChange={(v) => set('UA', v)} />
    </div>
  );
}

function ChemSystemSelector() {
  const params = useSimulationStore((s) => s.params);
  const setSystem = useSimulationStore((s) => s.setSystem);
  const setParam = useSimulationStore((s) => s.setParam);

  const currentSys = CHEMICAL_SYSTEMS[params.systemId] || CHEMICAL_SYSTEMS['anhydride'];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Chemical Reaction System</div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">Select Reaction Recipe:</label>
        <select
          value={params.systemId}
          onChange={(e) => setSystem(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded p-2 outline-none focus:border-cyan-400 font-mono"
        >
          {Object.values(CHEMICAL_SYSTEMS).map((sys) => (
            <option key={sys.id} value={sys.id}>
              {sys.name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded text-xs font-mono text-slate-300 flex flex-col gap-1">
        <div className="text-cyan-400 font-bold">Stoichiometry & Species:</div>
        <div>Reactant A: <span className="text-amber-400">{currentSys.speciesA}</span></div>
        <div>Reactant B: <span className="text-amber-400">{currentSys.speciesB}</span></div>
        <div>Product C: <span className="text-teal-400">{currentSys.speciesC}</span></div>
      </div>

      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mt-2">Reaction Orders (Kinetic Rate Law)</div>
      <Field label="Reaction Order α (Species A)" unit="mol order" value={params.orderA} min={0.5} max={3} step={0.1} digits={1} onChange={(v) => setParam('orderA', v)} />
      <Field label="Reaction Order β (Species B)" unit="mol order" value={params.orderB} min={0} max={2} step={0.1} digits={1} onChange={(v) => setParam('orderB', v)} />
    </div>
  );
}

function Pid() {
  const pid = useSimulationStore((s) => s.pid);
  const set = useSimulationStore((s) => s.setPid);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Temperature Jacket Control</div>
      <div className="flex flex-col gap-1.5 p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
        <span className="text-xs font-medium text-slate-300">Controller Mode</span>
        <div className="flex rounded overflow-hidden border border-slate-700 w-fit">
          {(['Manual', 'Auto'] as const).map((m) => (
            <button
              key={m}
              onClick={() => set({ auto: m === 'Auto' })}
              className={`px-4 py-1 text-xs font-mono ${pid.auto === (m === 'Auto') ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-950'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {pid.auto ? (
        <Field label="Temperature Setpoint (Tsp)" unit="K" value={pid.Tsp} min={280} max={420} step={0.5} digits={1} onChange={(v) => set({ Tsp: v })} />
      ) : (
        <Field label="Manual Jacket Temp (Tc)" unit="K" value={pid.manualTc} min={270} max={420} step={0.5} digits={1} onChange={(v) => set({ manualTc: v })} />
      )}
      <Field label="Proportional Gain (Kp)" unit="K/K" value={pid.Kp} min={0} max={30} step={0.1} digits={2} onChange={(v) => set({ Kp: v })} />
      <Field label="Integral Gain (Ki)" unit="K/(K·min)" value={pid.Ki} min={0} max={10} step={0.05} digits={2} onChange={(v) => set({ Ki: v })} />
      <Field label="Derivative Gain (Kd)" unit="K·min/K" value={pid.Kd} min={0} max={5} step={0.01} digits={2} onChange={(v) => set({ Kd: v })} />
      <Field label="Output Bias" unit="K" value={pid.bias} min={280} max={360} step={0.5} digits={1} onChange={(v) => set({ bias: v })} />
    </div>
  );
}

export default function InputsPanel() {
  const tab = useUIStore((s) => s.tab);
  const setTab = useUIStore((s) => s.setTab);
  const highlight = useUIStore((s) => s.pidHighlight);

  return (
    <section className="h-full min-h-0 flex flex-col bg-slate-950 border-t border-r border-slate-800">
      <header className="flex items-center justify-between gap-2 px-3 pt-2 border-b border-slate-800 shrink-0 bg-slate-900/50">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabId)}
              className={`px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors ${tab === t.id ? 'border-cyan-400 text-cyan-300 bg-slate-950' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <div className={`flex-1 min-h-0 overflow-y-auto p-4 transition-shadow ${highlight && tab === 'pid' ? 'shadow-[inset_0_0_0_2px_#22d3ee] animate-pulse' : ''}`}>
        {tab === 'flow' && <Flow />}
        {tab === 'thermo' && <Thermo />}
        {tab === 'chem' && <ChemSystemSelector />}
        {tab === 'pid' && <Pid />}
      </div>
    </section>
  );
}