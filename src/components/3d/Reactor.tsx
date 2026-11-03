import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Agitator, { steel } from './Agitator';
import CoolingCoil from './CoolingCoil';
import { useFluidMaterial } from './FluidMaterial';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function Reactor() {
  const surfaceMat = useFluidMaterial(0);
  const wallMat = useFluidMaterial(1);
  const live = useSimulationStore((s) => s.live);
  const limits = useSimulationStore((s) => s.limits);
  const exploded = useSimulationStore((s) => s.exploded);

  const groupRef = useRef<THREE.Group>(null!);
  const shardsRef = useRef<THREE.Group>(null!);
  const fireRef = useRef<THREE.Group>(null!);

  const isWarning = live.T >= limits.warnT && !exploded;

  // Pre-calculate flying glass shards for the explosion debris
  const shardData = useMemo(() => {
    return Array.from({ length: 24 }).map(() => ({
      pos: [
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.4,
      ] as [number, number, number],
      vel: [
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8,
      ] as [number, number, number],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
    }));
  }, []);

  useFrame((state, dt) => {
    // Early warning pre-failure vibration
    if (isWarning && groupRef.current) {
      const intensity = live.T >= limits.critT ? 0.04 : 0.015;
      groupRef.current.position.x = (Math.random() - 0.5) * intensity;
      groupRef.current.position.z = (Math.random() - 0.5) * intensity;
    } else if (groupRef.current && !exploded) {
      groupRef.current.position.set(0, 0, 0);
    }

    // Exploded debris scatter animation
    if (exploded && shardsRef.current) {
      shardsRef.current.children.forEach((child, i) => {
        const d = shardData[i];
        child.position.x += d.vel[0] * dt;
        child.position.y += d.vel[1] * dt;
        child.position.z += d.vel[2] * dt;
        // Gravity drop
        d.vel[1] -= 9.8 * dt;
        // Floor collision stop
        if (child.position.y < -1.8) {
          child.position.y = -1.8;
          d.vel[0] *= 0.2;
          d.vel[1] = 0;
          d.vel[2] *= 0.2;
        }
        child.rotation.x += 2 * dt;
        child.rotation.y += 3 * dt;
      });
    }

    // Swirling internal fire animation
    if (exploded && fireRef.current) {
      fireRef.current.rotation.y += dt * 4;
    }
  });

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      transmission: 0.9,
      roughness: 0.1,
      thickness: 2.0,
      ior: 1.45,
      color: isWarning ? '#ff4500' : '#ffffff',
      emissive: isWarning ? '#ff2200' : '#000000',
      emissiveIntensity: isWarning ? 0.6 : 0,
      side: THREE.DoubleSide,
    });
  }, [isWarning]);

  return (
    <group ref={groupRef}>
      {/* NORMAL REACTOR STATE (Hidden once exploded) */}
      {!exploded && (
        <>
          {/* Glass Shell */}
          <mesh material={glassMat}>
            <cylinderGeometry args={[1, 1, 2.4, 96, 1, true]} />
          </mesh>

          {/* Bottom Dished Plate */}
          <mesh position={[0, -1.24, 0]}>
            <cylinderGeometry args={[1.05, 0.9, 0.1, 64]} />
            <meshPhysicalMaterial {...steel} />
          </mesh>

          {/* Fluid inside */}
          <mesh material={wallMat}>
            <cylinderGeometry args={[0.95, 0.95, 2, 96, 1, true]} />
          </mesh>

          <CoolingCoil />
          <Agitator />
        </>
      )}

      {/* EXPLOSION & POST-BLAST DEBRIS STATE */}
      {exploded && (
        <group>
          {/* Intense Blast Flash / PointLight */}
          <pointLight color="#ff4400" intensity={35} distance={15} position={[0, 0, 0]} />

          {/* Swirling Realistic Fire Core */}
          <group ref={fireRef} position={[0, -0.2, 0]}>
            <mesh>
              <sphereGeometry args={[1.2, 32, 32]} />
              <meshBasicMaterial color="#ff3300" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <coneGeometry args={[1.4, 3, 16]} />
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
            </mesh>
          </group>

          {/* Shattered Glass Shards Flying Outward */}
          <group ref={shardsRef}>
            {shardData.map((d, i) => (
              <mesh key={i} position={d.pos} rotation={d.rot}>
                <boxGeometry args={[0.2, 0.3, 0.05]} />
                <meshPhysicalMaterial
                  color="#a5f3fc"
                  transmission={0.8}
                  roughness={0.2}
                  ior={1.5}
                />
              </mesh>
            ))}
          </group>

          {/* Destroyed / Charred Reactor Base & Support Skeleton */}
          <group position={[0, -1.24, 0]}>
            <mesh>
              <cylinderGeometry args={[1.05, 0.9, 0.1, 64]} />
              <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
          </group>

          {/* Support Legs (Twisted / Scorched) */}
          {[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.85, -1.75, Math.sin(a) * 0.85]}
                rotation={[0.2, 0, (i % 2 === 0 ? 0.1 : -0.1)]}
              >
                <cylinderGeometry args={[0.05, 0.05, 1, 12]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}