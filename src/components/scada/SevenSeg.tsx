// src/components/scada/SevenSeg.tsx 
// Real seven-segment digits drawn in SVG: unlit segments stay faintly visible like a physical LED display.
import './scada.css';

const SEG_MAP: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg',
  '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  '-': 'g', '_': 'd', ' ': '',
  A: 'abcefg', b: 'cdefg', C: 'adef', d: 'bcdeg', E: 'adefg', F: 'aefg', H: 'bcefg',
  L: 'def', n: 'ceg', O: 'abcdef', o: 'cdeg', P: 'abefg', r: 'eg', S: 'acdfg',
  t: 'defg', U: 'bcdef', u: 'cde',
};
const segsFor = (ch: string) => SEG_MAP[ch] ?? SEG_MAP[ch.toUpperCase()] ?? '';

const T = 1.8; // segment thickness
const pts = (p: number[][]) => p.map((q) => q.join(',')).join(' ');
const horiz = (cx: number, cy: number, len: number) => {
  const a = len / 2, t = T / 2;
  return pts([[cx - a, cy], [cx - a + t, cy - t], [cx + a - t, cy - t], [cx + a, cy], [cx + a - t, cy + t], [cx - a + t, cy + t]]);
};
const vert = (cx: number, cy: number, len: number) => {
  const a = len / 2, t = T / 2;
  return pts([[cx, cy - a], [cx + t, cy - a + t], [cx + t, cy + a - t], [cx, cy + a], [cx - t, cy + a - t], [cx - t, cy - a + t]]);
};
const SEG_POLY: Record<string, string> = {
  a: horiz(5, 1.2, 6.4),
  g: horiz(5, 9, 6.4),
  d: horiz(5, 16.8, 6.4),
  f: vert(1.4, 5.1, 6.4),
  b: vert(8.6, 5.1, 6.4),
  e: vert(1.4, 12.9, 6.4),
  c: vert(8.6, 12.9, 6.4),
};
const SEG_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

interface Cell { ch: string; dp: boolean }

function toCells(text: string, cells: number): Cell[] {
  const out: Cell[] = [];
  for (const ch of text) {
    if (ch === '.' && out.length > 0) out[out.length - 1].dp = true;
    else out.push({ ch, dp: false });
  }
  if (out.length > cells) return Array.from({ length: cells }, () => ({ ch: '-', dp: false })); // overflow
  while (out.length < cells) out.unshift({ ch: ' ', dp: false });
  return out;
}

function Digit({ ch, dp, color, h }: Cell & { color: string; h: number }) {
  const lit = segsFor(ch);
  return (
    <svg viewBox="0 0 12 18" height={h} width={(h * 12) / 18} aria-hidden="true">
      <g transform="translate(1.2 0) skewX(-5)">
        {SEG_IDS.map((s) => {
          const on = lit.includes(s);
          return (
            <polygon
              key={s}
              points={SEG_POLY[s]}
              fill={color}
              fillOpacity={on ? 1 : 0.07}
              style={on ? { filter: `drop-shadow(0 0 1.4px ${color})` } : undefined}
            />
          );
        })}
        <circle cx="10.8" cy="16.8" r="1" fill={color} fillOpacity={dp ? 1 : 0.07} style={dp ? { filter: `drop-shadow(0 0 1.4px ${color})` } : undefined} />
      </g>
    </svg>
  );
}

export function SevenSeg({ text, cells = 5, color = '#22d3ee', height = 26 }: { text: string; cells?: number; color?: string; height?: number }) {
  return (
    <span className="inline-flex items-center" role="img" aria-label={text}>
      {toCells(text, cells).map((c, i) => (
        <Digit key={i} ch={c.ch} dp={c.dp} color={color} h={height} />
      ))}
    </span>
  );
}

interface LedReadoutProps {
  label: string;
  value: number | string;
  unit?: string;
  cells?: number;
  decimals?: number;
  color?: string;
  alarm?: boolean;
  height?: number;
}

/** Labelled, recessed LED panel meter. Pass a string (e.g. "OFF", "----") to show text instead of a number. */
export function LedReadout({ label, value, unit, cells = 5, decimals = 1, color = '#22d3ee', alarm = false, height = 26 }: LedReadoutProps) {
  const text = typeof value === 'number' ? (Number.isFinite(value) ? value.toFixed(decimals) : '----') : value;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <span className="text-[9px] font-mono tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
        {unit && <span className="text-[9px] font-mono text-slate-500">{unit}</span>}
      </div>
      <div className={`rounded-sm border bg-black px-1.5 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] ${alarm ? 'border-red-700' : 'border-slate-700'}`}>
        <SevenSeg text={text} cells={cells} color={alarm ? '#ef4444' : color} height={height} />
      </div>
    </div>
  );
}
