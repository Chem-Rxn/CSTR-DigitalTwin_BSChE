import Scene from '@/components/3d/Scene';

export default function Viewport() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      <Scene />
    </div>
  );
}