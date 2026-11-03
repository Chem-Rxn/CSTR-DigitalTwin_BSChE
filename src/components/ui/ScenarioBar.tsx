// src/components/ui/ScenarioBar.tsx
import { useEffect, useState } from 'react';
import { saveScenario, listScenarios, ScenarioRow } from '@/lib/scenarios';
import { cloudEnabled } from '@/lib/supabase';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function ScenarioBar() {
  const [rows, setRows] = useState<ScenarioRow[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    try { setRows(await listScenarios()); } catch (e) { setMsg((e as Error).message); }
  };
  useEffect(() => { if (cloudEnabled) void refresh(); }, []);

  const save = async () => {
    if (!name.trim()) return setMsg('Enter a scenario name');
    setBusy(true); setMsg(null);
    try { await saveScenario(name.trim()); setName(''); setMsg('Saved ✓'); await refresh(); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  const load = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (row) { useSimulationStore.getState().loadScenario(row.payload); setMsg(`Loaded "${row.name}"`); }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scenario name"
        className="w-36 bg-slate-900 border border-slate-800 rounded px-2 py-1 outline-none focus:border-cyan-400" />
      <button disabled={busy || !cloudEnabled} onClick={save}
        className="px-2 py-1 rounded border border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40">
        {busy ? 'Saving…' : 'Save Scenario'}
      </button>
      <select defaultValue="" onChange={(e) => load(e.target.value)} onFocus={() => cloudEnabled && void refresh()} disabled={!cloudEnabled}
        className="max-w-[10rem] bg-slate-900 border border-slate-800 rounded px-2 py-1 outline-none disabled:opacity-40">
        <option value="" disabled>Load Scenario…</option>
        {rows.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.author ?? 'anon'}</option>)}
      </select>
      {!cloudEnabled && <span className="text-amber-400">cloud off (no env)</span>}
      {msg && <span className="text-slate-400 truncate max-w-[10rem]">{msg}</span>}
    </div>
  );
}
