// src/components/3d/Agitator.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';

export const steel = { color: '#9aa4ae', metalness: 1, roughness: 0.35, anisotropy: 0.8, anisotropyRotation: 0.6, clearcoat: 0.1 } as const;

function Impeller({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh><cylinderGeometry args={[0.07, 0.07, 0.1, 24]} /><meshPhysicalMaterial {...steel} /></mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0.28, 0, 0]} rotation={[0.8, 0, 0]}>{/* pitched blade */}
            <boxGeometry args={[0.45, 0.2, 0.025]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Agitator() {
  const spin = useRef<THREE.Group>(null!);
  const lamp = useRef<THREE.MeshStandardMaterial>(null!);
  const lampLight = useRef<THREE.PointLight>(null!);

  useFrame((state, dt) => {
    const { rpm, live, limits, running } = useSimulationStore.getState();
    if (running) spin.current.rotation.y -= (rpm / 60) * Math.PI * 2 * dt * 0.3; // visual scale
    const alarm = live.T >= limits.warnT;
    const blink = alarm ? (Math.sin(state.clock.elapsedTime * (live.T >= limits.critT ? 14 : 6)) > 0 ? 1 : 0.1) : 0;
    lamp.current.emissiveIntensity = alarm ? 4 * blink : 0.15;
    lamp.current.color.set(alarm ? '#ff2a2a' : '#14532d');
    lamp.current.emissive.set(alarm ? '#ff1a1a' : '#22c55e');
    lampLight.current.intensity = alarm ? 2 * blink : 0;
  });

  return (
    <group>
      {/* top plate + motor */}
      <mesh position={[0, 1.24, 0]}><cylinderGeometry args={[1.08, 1.08, 0.08, 64]} /><meshPhysicalMaterial {...steel} /></mesh>
      <mesh position={[0, 1.55, 0]}><cylinderGeometry args={[0.34, 0.34, 0.55, 32]} /><meshPhysicalMaterial {...steel} color="#334155" roughness={0.45} /></mesh>
      <mesh position={[0, 1.88, 0]}><cylinderGeometry args={[0.28, 0.34, 0.12, 32]} /><meshPhysicalMaterial {...steel} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 1.55, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
          <boxGeometry args={[0.72, 0.4, 0.02]} /><meshPhysicalMaterial {...steel} color="#475569" />
        </mesh>
      ))}
      {/* warning lamp (emissive, untonemapped → blooms) */}
      <mesh position={[0.2, 1.97, 0.1]}>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshStandardMaterial ref={lamp} toneMapped={false} emissiveIntensity={0.15} />
      </mesh>
      <pointLight ref={lampLight} position={[0.2, 2.05, 0.1]} color="#ff2a2a" distance={3} intensity={0} />
      {/* rotating shaft + impellers */}
      <group ref={spin}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.04, 2.8, 20]} /><meshPhysicalMaterial {...steel} /></mesh>
        <Impeller y={-0.55} />
        <Impeller y={0.2} />
      </group>
    </group>
  );
}
