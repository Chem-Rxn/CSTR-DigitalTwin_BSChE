// src/components/3d/LiveTags.tsx
import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useSimulationStore } from '@/store/useSimulationStore';

/** Floating tags: DOM nodes are mutated via subscribe() → zero React re-renders. */
export default function LiveTags() {
  const tRef = useRef<HTMLSpanElement>(null);
  const cRef = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = (s = useSimulationStore.getState()) => {
      if (tRef.current) tRef.current.textContent = `${s.live.T.toFixed(1)} K`;
      if (cRef.current) cRef.current.textContent = `${s.live.CA.toFixed(3)} mol/L`;
      box.current?.classList.toggle('border-red-500', s.live.T >= s.limits.warnT);
    };
    paint();
    return useSimulationStore.subscribe((s) => s.live, () => paint());
  }, []);

  return (
    <Html position={[0, 2.5, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={box} className="font-mono text-xs bg-slate-950/80 border border-cyan-500/60 rounded px-2 py-1 whitespace-nowrap shadow-[0_0_12px_#22d3ee55]">
        <div>TT-101 <span ref={tRef} className="text-cyan-300 font-bold" /></div>
        <div>AT-101 <span ref={cRef} className="text-cyan-300 font-bold" /></div>
      </div>
    </Html>
  );
}
