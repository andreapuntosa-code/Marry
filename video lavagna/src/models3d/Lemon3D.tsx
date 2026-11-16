import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ChalkEdges, ChalkLights, ChalkLine, OrbitCamera, ease, useRevealPlane} from './chalk3d';
import type {ModelDef, ModelProps} from './types';

const L = 3.2; // lunghezza del limone (asse x)
/** raggio del limone alla posizione x (forma a "limone" con le punte) */
const radius = (x: number) => {
  const u = Math.min(1, Math.abs(x) / (L / 2));
  return 0.92 * Math.pow(1 - u * u, 0.85) + 0.1 * Math.exp(-Math.pow((1 - u) / 0.07, 2));
};

const Slices: React.FC<{n: number; spread: number; opacity: number; colors: Record<string, string>}> = ({n, spread, opacity, colors}) => {
  const geos = useMemo(() => {
    const w = L / n;
    return Array.from({length: n}, (_, i) => {
      const x = -L / 2 + (i + 0.5) * w;
      const r = Math.max(0.05, radius(x));
      const g = new THREE.CylinderGeometry(r, r, w * 0.9, 48);
      g.rotateZ(Math.PI / 2);
      return {x, g, r};
    });
  }, [n]);
  if (opacity <= 0.01) return null;
  const peel = colors.accent;
  const flesh = colors.lemonFlesh ?? '#FFF3B8';
  return (
    <>
      {geos.map(({x, g}, i) => (
        <group key={i} position={[x * (1 + spread), 0, 0]}>
          <mesh geometry={g}>
            <meshLambertMaterial attach="material-0" color={peel} transparent opacity={opacity} />
            <meshLambertMaterial attach="material-1" color={flesh} transparent opacity={opacity} />
            <meshLambertMaterial attach="material-2" color={flesh} transparent opacity={opacity} />
          </mesh>
          <ChalkEdges geometry={g} color={colors.chalk} width={n > 12 ? 1.5 : 2.6} opacity={opacity} threshold={30} />
        </group>
      ))}
    </>
  );
};

/**
 * Limone che si taglia a fette (ogni fetta ≈ una moneta).
 * p = comparsa del limone intero; cues[0] = fette spesse e separate; cues[1] = tante fette sottili, quasi unite.
 */
const Lemon3D: React.FC<ModelProps> = ({p, cues, t, colors}) => {
  const c0 = ease(cues[0] ?? 0);
  const c1 = ease(cues[1] ?? 0);
  const reveal = useRevealPlane(-1.1 + ease(p) * 2.4);
  const clip = useMemo(() => [reveal], [reveal]);
  const whole = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = -L / 2 + (L * i) / 60;
      pts.push(new THREE.Vector2(Math.max(0.001, radius(x)), x));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, []);
  const rings = useMemo(
    () =>
      [-1.0, -0.5, 0, 0.5, 1.0].map((x) =>
        Array.from({length: 65}, (_, k): [number, number, number] => {
          const a = (k / 64) * Math.PI * 2;
          const r = radius(x) + 0.008;
          return [x, Math.cos(a) * r, Math.sin(a) * r];
        }),
      ),
    [],
  );
  const wholeOpacity = 1 - c0;
  const thick = c0 * (1 - c1);
  const thin = c1;

  return (
    <>
      <OrbitCamera radius={6.6} angle={1.0 + Math.sin(t * 0.22) * 0.18} elevation={0.38} />
      <ChalkLights />
      {wholeOpacity > 0.01 && (
        <group>
          <mesh geometry={whole}>
            <meshLambertMaterial color={colors.accent} transparent opacity={wholeOpacity} clippingPlanes={clip} side={THREE.DoubleSide} />
          </mesh>
          {rings.map((pts, i) => (
            <ChalkLine key={i} points={pts} color={colors.chalk} width={2} opacity={wholeOpacity * 0.6} clip={clip} />
          ))}
        </group>
      )}
      <Slices n={7} spread={0.45 * c0} opacity={thick} colors={colors} />
      <Slices n={26} spread={0.45 * (1 - c1) + 0.06 * c1} opacity={thin} colors={colors} />
    </>
  );
};

export default {fov: 30, component: Lemon3D} satisfies ModelDef;
