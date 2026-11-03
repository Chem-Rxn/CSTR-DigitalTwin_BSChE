// src/components/3d/FluidMaterial.tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';

const vertex = /* glsl */ `
uniform float uTime, uRpm, uMode;
varying vec3 vWorld; varying vec3 vNormalW;
void main() {
  vec3 p = position;
  float r = length(p.xz);
  float w = clamp(uRpm / 300.0, 0.0, 1.0);
  float vortex = w * w * 0.75 * exp(-pow(r / 0.45, 2.0));
  float rise   = w * 0.16 * smoothstep(0.35, 0.95, r);
  float swirl  = sin(atan(p.z, p.x) * 3.0 + uTime * (1.0 + uRpm * 0.03) - r * 9.0) * 0.025 * w * r;
  float ripple = sin(r * 16.0 - uTime * 2.5) * 0.008 * (1.0 - w * 0.5);
  float dy = -vortex + rise + swirl + ripple;
  p.y += dy * mix(1.0, step(0.0, position.y), uMode); // side wall: only the top rim follows the surface
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const fragment = /* glsl */ `
uniform float uCA, uCA0, uTemp, uTime, uMode;
varying vec3 vWorld; varying vec3 vNormalW;
void main() {
  float c = clamp(uCA / max(uCA0, 0.001), 0.0, 1.0);
  vec3 amber = vec3(0.70, 0.28, 0.02);
  vec3 blue  = vec3(0.05, 0.60, 1.00);
  vec3 col = mix(amber, blue, smoothstep(0.0, 1.0, c));
  float heat = smoothstep(375.0, 450.0, uTemp);
  col = mix(col, vec3(1.7, 0.35, 0.08), heat * 0.75);
  col *= 1.0 + heat * 1.6; // HDR > 0.8 → picked up by Bloom
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - abs(dot(normalize(vNormalW), V)), 2.5);
  col += fres * 0.25;
  float shimmer = 0.04 * sin(vWorld.y * 30.0 + uTime * 2.0);
  gl_FragColor = vec4(col + shimmer * (1.0 - uMode), mix(0.92, 0.62, uMode));
}`;

/** Both surface (mode 0) and wall (mode 1) share this; uniforms are fed from the store each frame (no React re-render). */
export function useFluidMaterial(mode: 0 | 1) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, transparent: true, side: THREE.DoubleSide,
      depthWrite: mode === 0,
      uniforms: {
        uTime: { value: 0 }, uRpm: { value: 0 }, uMode: { value: mode },
        uCA: { value: 0.5 }, uCA0: { value: 1 }, uTemp: { value: 350 },
      },
    }),
    [mode]
  );
  const ref = useRef(mat);
  useFrame((state) => {
    const { live, rpm, params } = useSimulationStore.getState();
    const u = ref.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uRpm.value += (rpm - u.uRpm.value) * 0.05; // spin-up inertia
    u.uCA.value = live.CA; u.uCA0.value = params.CA0; u.uTemp.value = live.T;
  });
  return mat;
}
