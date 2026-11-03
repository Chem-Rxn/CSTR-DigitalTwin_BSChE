import React from 'react';
import InputsPanel from './InputsPanel';
import PidPanel from './PidPanel';
import ScenarioBar from './ScenarioBar';
import AnalyticsPanel from './AnalyticsPanel';
import Viewport from './Viewport';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useUIStore } from '@/store/useUIStore';

export default function Dashboard() {
  const running = useSimulationStore((s) => s.running);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const reset = useSimulationStore((s) => s.reset);
  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const live = useSimulationStore((s) => s.live);
  const limits = useSimulationStore((s) => s.limits);

  const camera = useUIStore((s) => s.camera);
  const setCamera = useUIStore((s) => s.setCamera);

  const isWarning = live.T >= limits.warnT;
  const isCritical = live.T >= limits.critT;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      
      {/* TOP HEADER / SCADA BANNER */}
      <header className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${running ? (isCritical ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]') : 'bg-slate-600'}`} />
            <h1 className="text-base font-bold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              CSTR DIGITAL TWIN <span className="text-xs font-mono font-normal text-slate-400 ml-2 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">R-101</span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Scenarios */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setRunning(!running)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${running ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}
            >
              {running ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => reset()}
              className="px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono">
            <span className="text-slate-500">Speed:</span>
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${speed === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800" />
          <ScenarioBar />
        </div>
      </header>

      {/* MAIN WORKSPACE GRID */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: Configuration & PID Panels */}
        <aside className="w-[400px] flex flex-col border-r border-slate-800 bg-slate-950 shrink-0 z-10 overflow-hidden">
          <InputsPanel />
        </aside>

        {/* RIGHT COLUMN: 3D Viewport + P&ID Schematics + Live Analytics Graphs */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
          
          {/* Top Half: 3D Reactor Viewport & P&ID Split */}
          <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-b border-slate-800">
            
            {/* 3D Scene Viewport */}
            <div className="flex-1 relative min-h-[250px] bg-slate-950 flex flex-col">
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-lg p-1 shadow-lg">
                {(['iso', 'front', 'top', 'coil'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCamera(preset)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all ${camera === preset ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_#22d3ee88]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Viewport />
            </div>

            {/* Right Sub-pane: P&ID Schematics */}
            <div className="w-full xl:w-[380px] border-t xl:border-t-0 xl:border-l border-slate-800 bg-slate-950 flex flex-col shrink-0">
              <PidPanel />
            </div>

          </div>

          {/* Bottom Half: Real-time Recharts Analytics Graphs */}
          <div className="h-56 bg-slate-950 p-2 shrink-0 border-t border-slate-800">
            <AnalyticsPanel />
          </div>

        </section>

      </main>
    </div>
  );
}