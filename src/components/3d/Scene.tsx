// src/components/3d/Scene.tsx
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import Reactor from './Reactor';
import LiveTags from './LiveTags';
import { useUIStore, CameraPreset } from '@/store/useUIStore';

const PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso:   { pos: [5.2, 2.6, 6.2], target: [0, 0.2, 0] },
  front: { pos: [0, 0.4, 8],     target: [0, 0.2, 0] },
  top:   { pos: [0.01, 8.5, 0.01], target: [0, 0, 0] },
  coil:  { pos: [2.2, -0.1, 2.6], target: [0, -0.1, 0] },
};

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null!);
  const goal = useRef({ pos: new THREE.Vector3(...PRESETS.iso.pos), target: new THREE.Vector3(...PRESETS.iso.target), active: true });

  useUIStore.subscribe((s) => s.camera, (c) => {
    goal.current.pos.set(...PRESETS[c].pos);
    goal.current.target.set(...PRESETS[c].target);
    goal.current.active = true;
  });

  useFrame(({ camera }) => {
    const g = goal.current;
    if (!g.active || !controls.current) return;
    camera.position.lerp(g.pos, 0.07);
    controls.current.target.lerp(g.target, 0.07);
    if (camera.position.distanceTo(g.pos) < 0.02) g.active = false;
    controls.current.update();
  });

  return <OrbitControls ref={controls} enableDamping makeDefault minDistance={3} maxDistance={14} onStart={() => (goal.current.active = false)} />;
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: PRESETS.iso.pos, fov: 38 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#020617']} />
      {/* drei has no "industrial" preset; "warehouse" is the closest */}
      <Environment preset="warehouse" />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <Reactor />
      <LiveTags />
      <ContactShadows position={[0, -2.26, 0]} opacity={0.5} scale={10} blur={2.5} far={3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.27, 0]}>
        <planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0b1220" roughness={0.9} />
      </mesh>
      <CameraRig />
      <EffectComposer enableNormalPass multisampling={0}>
        <SSAO samples={16} radius={0.12} intensity={14} luminanceInfluence={0.6} distanceThreshold={1} distanceFalloff={0.1} rangeThreshold={0.5} rangeFalloff={0.1} />
        <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.25} intensity={1.1} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
