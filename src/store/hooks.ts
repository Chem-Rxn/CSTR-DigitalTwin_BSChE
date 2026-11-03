// src/store/hooks.ts
import { useEffect, useState } from 'react';
import { useSimulationStore } from './useSimulationStore';

type S = ReturnType<typeof useSimulationStore.getState>;

/** Reads a store slice via subscribe(), re-rendering at most every `ms` — no per-tick React churn. */
export function useThrottled<T>(selector: (s: S) => T, ms = 200): T {
  const [value, setValue] = useState<T>(() => selector(useSimulationStore.getState()));
  useEffect(() => {
    let last = 0;
    return useSimulationStore.subscribe(selector, (v) => {
      const now = performance.now();
      if (now - last >= ms) { last = now; setValue(v); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return value;
}
