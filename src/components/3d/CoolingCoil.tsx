// src/components/3d/CoolingCoil.tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import { useUIStore } from '@/store/useUIStore';

export default function CoolingCoil() {
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const pulse = useRef(0);

  const geometry = useMemo(() => {
    const turns = 6, R = 0.76, y0 = -0.85, y1 = 0.75, N = turns * 48;
    const pts: THREE.Vector3[] = [];
    // feed legs enter/exit through the top plate
    pts.push(new THREE.Vector3(R, 1.3, 0));
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * R, y0 + (i / N) * (y1 - y0), Math.sin(a) * R));
    }
    pts.push(new THREE.Vector3(Math.cos(turns * Math.PI * 2) * R, 1.3, Math.sin(turns * Math.PI * 2) * R));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, 0.04, 12, false);
  }, []);

  const cold = useMemo(() => new THREE.Color('#38bdf8'), []);
  const hot = useMemo(() => new THREE.Color('#fb923c'), []);

  useFrame((_, dt) => {
    const { live } = useSimulationStore.getState();
    pulse.current = Math.max(0, pulse.current - dt * 1.2);
    const f = THREE.MathUtils.clamp((live.Tc - 280) / 100, 0, 1);
    mat.current.color.copy(cold).lerp(hot, f);
    mat.current.emissive.copy(mat.current.color);
    mat.current.emissiveIntensity = 0.15 + pulse.current * 2.2 * (0.5 + 0.5 * Math.sin(pulse.current * 30));
  });

  return (
    <mesh
      geometry={geometry}
      onClick={(e) => { e.stopPropagation(); pulse.current = 1; useUIStore.getState().flashPid(); }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <meshPhysicalMaterial ref={mat} metalness={0.9} roughness={0.3} toneMapped={false} />
    </mesh>
  );
}
