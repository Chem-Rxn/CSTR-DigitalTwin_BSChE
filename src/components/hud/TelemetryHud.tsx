// src/components/hud/TelemetryHud.tsx
// Member 5: performance HUD, dimensionless readout and system-health lights.
// Polls at 4 Hz from the store and the telemetry module, so it adds no per-tick React work.
import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { telemetry } from '@/engine/telemetry';
import { computeDimensionless, flowRegime } from '@/lib/dimensionless';
import type { Dimensionless } from '@/lib/dimensionless';
import { engineHealth, memoryHealth, calcHealth } from '@/lib/health';
import type { Health, Level } from '@/lib/health';

const POLL_MS = 250;
const SPARK_LEN = 40;

const LIGHT: Record<Level, { color: string; label: string }> = {
  ok: { color: '#22c55e', label: 'OK' },
  warn: { color: '#facc15', label: 'WARN' },
  crit: { color: '#ef4444', label: 'FAULT' },
  na: { color: '#475569', label: 'N/A' },
};

interface View {
  fps: number;
  frameMs: number;
  fpsHist: number[];
  solver: { simDt: number; h: number; substeps: number; costMs: number; stepsPerSec: number };
  dim: Dimensionless;
  engine: Health;
  memory: Health;
  calc: Health;
}

function fpsLevel(fps: number): Level {
  return fps >= 50 ? 'ok' : fps >= 25 ? 'warn' : 'crit';
}

function Light({ level, pulse }: { level: Level; pulse?: boolean }) {
  const c = LIGHT[level].color;
  const on = level !== 'na';
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black/60 ${pulse && level === 'crit' ? 'animate-pulse' : ''}`}
      style={{
        background: on ? `radial-gradient(circle at 35% 30%, #ffffffaa, ${c} 55%)` : '#1e293b',
        boxShadow: on ? `0 0 7px 1px ${c}` : 'inset 0 1px 2px #000',
      }}
      aria-label={LIGHT[level].label}
    />
  );
}

function Row({ k, v, unit, hint }: { k: string; v: string; unit?: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 leading-[1.35]">
      <span className="text-slate-500">{k}</span>
      <span className="text-right text-slate-100 tabular-nums">
        {v}
        {unit && <span className="ml-1 text-slate-500">{unit}</span>}
        {hint && <span className="ml-1.5 text-[9px] uppercase tracking-wide text-cyan-400/80">{hint}</span>}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-700/60 px-2.5 py-1.5">
      <div className="mb-0.5 text-[9px] tracking-[0.18em] text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = 70;
  const pts = data.map((v, i) => `${(i / (SPARK_LEN - 1)) * 100},${20 - (Math.min(v, max) / max) * 18}`).join(' ');
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-5 w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const fmt = (x: number) => {
  if (!Number.isFinite(x)) return '—';
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e5 || a < 1e-2)) return x.toExponential(2);
  return a >= 100 ? x.toFixed(0) : a >= 10 ? x.toFixed(1) : x.toFixed(2);
};

const daHint = (Da: number) => (Da < 0.1 ? 'low conv.' : Da > 10 ? 'near-full' : 'balanced');

export default function TelemetryHud() {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<View | null>(null);

  // FPS: count animation frames in a 500 ms window
  const frames = useRef({ n: 0, start: performance.now(), fps: 60, hist: [] as number[] });

  useEffect(() => {
    let raf = 0;
    const f = frames.current;
    const tick = (now: number) => {
      f.n++;
      if (now - f.start >= 500) {
        f.fps = (f.n * 1000) / (now - f.start);
        f.n = 0;
        f.start = now;
        f.hist = [...f.hist, f.fps].slice(-SPARK_LEN);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const poll = () => {
      const s = useSimulationStore.getState();
      const dim = computeDimensionless(s.params, s.live.T, s.rpm, telemetry.h);
      const hist = f.hist.length ? f.hist : [f.fps];
      setView({
        fps: f.fps,
        frameMs: f.fps > 0 ? 1000 / f.fps : 0,
        fpsHist: hist,
        solver: { ...telemetry },
        dim,
        engine: engineHealth({
          running: s.running, exploded: s.exploded, hidden: document.hidden,
          lastStepAt: telemetry.lastStepAt, now: performance.now(),
        }),
        memory: memoryHealth(),
        calc: calcHealth({ live: s.live, warnT: s.limits.warnT, critT: s.limits.critT, kh: dim.kh, costMs: telemetry.costMs }),
      });
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { cancelAnimationFrame(raf); clearInterval(id); };
  }, []);

  if (!view) return null;
  const { fps, dim, solver } = view;
  const perf = fpsLevel(fps);
  const levels: Level[] = [view.engine.level, view.memory.level, view.calc.level];
  const worst: Level = levels.includes('crit') ? 'crit' : levels.includes('warn') ? 'warn' : 'ok';

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-20 w-[236px] select-none rounded-lg border border-slate-700/80 bg-slate-900/80 font-mono text-[10px] text-slate-300 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <Light level={worst} pulse />
        <span className="tracking-[0.18em] text-slate-400">TELEMETRY</span>
        <span className="ml-auto tabular-nums" style={{ color: LIGHT[perf].color }}>{fps.toFixed(0)} FPS</span>
        <span className="text-slate-500">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <>
          <Section title="PERFORMANCE">
            <Row k="Frame rate" v={fps.toFixed(0)} unit="fps" />
            <Row k="Frame time" v={view.frameMs.toFixed(1)} unit="ms" />
            <Spark data={view.fpsHist} color={LIGHT[perf].color} />
            <Row k="Outer step Δt" v={solver.simDt.toFixed(3)} unit="min" />
            <Row k="RK4 sub-step h" v={solver.h.toFixed(4)} unit="min" hint={`×${solver.substeps}`} />
            <Row k="Step cost" v={solver.costMs.toFixed(2)} unit="ms" />
            <Row k="Solver rate" v={solver.stepsPerSec.toFixed(0)} unit="steps/s" />
          </Section>

          <Section title="DIMENSIONLESS">
            <Row k="Damköhler Da" v={fmt(dim.Da)} hint={daHint(dim.Da)} />
            <Row k="Residence τ" v={fmt(dim.tau)} unit="min" />
            <Row k="Re impeller" v={fmt(dim.ReImp)} hint={flowRegime(dim.ReImp)} />
            <Row k="Re feed pipe" v={fmt(dim.RePipe)} hint={flowRegime(dim.RePipe)} />
          </Section>

          <Section title="SYSTEM HEALTH">
            {([
              ['Solver loop', view.engine],
              ['Memory', view.memory],
              ['Calculation', view.calc],
            ] as [string, Health][]).map(([name, h]) => (
              <div key={name} className="flex items-center gap-2 py-[1px]">
                <Light level={h.level} pulse />
                <span className="text-slate-300">{name}</span>
                <span className="ml-auto truncate text-right text-slate-500" title={h.detail}>{h.detail}</span>
              </div>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
