// src/lib/scenarios.ts
import { supabase } from './supabase';
import { useSimulationStore } from '@/store/useSimulationStore';
import type { Params, PidConfig } from '@/engine/physics';

export interface ScenarioRow {
  id: string; name: string; author: string | null;
  payload: { params: Params; pid: PidConfig }; created_at: string;
}

export async function saveScenario(name: string, author = 'anonymous') {
  if (!supabase) throw new Error('Supabase is not configured (missing VITE_SUPABASE_* env vars).');
  const { params, pid } = useSimulationStore.getState();
  const payload = { params, pid }; // kinetics, thermo, feed conditions, PID tunings
  const { data, error } = await supabase.from('saved_simulations').insert({ name, author, payload }).select().single();
  if (error) throw error;
  return data as ScenarioRow;
}

export async function listScenarios(limit = 50): Promise<ScenarioRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_simulations').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as ScenarioRow[];
}
