// src/components/scada/InterlockBanner.tsx 
// Rendered in normal flow (not fixed) so it never covers the header's Pause / Reset buttons.
import { useControlStore } from '@/store/useControlStore';
import './scada.css';

export default function InterlockBanner() {
  const esd = useControlStore((s) => s.esdActive);
  const reason = useControlStore((s) => s.esdReason);
  const at = useControlStore((s) => s.esdAt);

  if (!esd) return null;

  return (
    <>
      <div className="esd-vignette" aria-hidden="true" />
      <div role="alert" className="esd-banner flex shrink-0 items-center justify-between gap-4 border-b-2 border-red-300/60 px-6 py-1.5 font-mono">
        <div className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <path d="M12 2 1 21h22L12 2Z" fill="#facc15" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="11" y="9" width="2" height="6" fill="#000" />
            <rect x="11" y="16.5" width="2" height="2" fill="#000" />
          </svg>
          <div>
            <div className="text-sm font-black tracking-[0.2em]">EMERGENCY SHUTDOWN: INTERLOCK ACTIVE</div>
            <div className="text-[10px] tracking-wider opacity-90">
              Feed isolated (XV-101 closed). Cooling water at maximum. Controller locked in manual.
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right text-[10px] tracking-wider">
          <div>{reason}</div>
          <div className="opacity-80">{at}</div>
        </div>
      </div>
    </>
  );
}
