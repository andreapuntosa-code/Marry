import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ChalkEdges, ChalkLights, OrbitCamera, clamp01, ease, useRevealPlane} from './chalk3d';
import type {ModelDef, ModelProps} from './types';

const W = 2.6;
const H = 1.8;
const D = 1.5;
const LAYERS = 22;
// portata del rubinetto in ogni "secondo": prima veloce, poi lenta, poi variabile
const FLOW = Array.from({length: LAYERS}, (_, i) => (i < 6 ? 1 : i < 11 ? 0.35 : 0.6 + 0.35 * Math.sin(i * 1.3)));
const SCALE = (H * 0.82) / FLOW.reduce((a, b) => a + b, 0);

/**
 * Vasca che si riempie a strati: ogni strato = l'acqua aggiunta in un secondo.
 * p = disegno della vasca; p2 = riempimento (campo "then").
 * props.layersOut: se true, gli strati si separano un po' alla fine (cues[0]) per farli contare.
 */
const Tank3D: React.FC<ModelProps> = ({p, p2, cues, t, colors}) => {
  const reveal = useRevealPlane(-H / 2 - 0.1 + ease(p) * (H + 1.6));
  const clip = useMemo(() => [reveal], [reveal]);
  const glass = useMemo(() => new THREE.BoxGeometry(W, H, D), []);
  const pipeH = useMemo(() => new THREE.CylinderGeometry(0.09, 0.09, 1.0, 16), []);
  const pipeV = useMemo(() => new THREE.CylinderGeometry(0.09, 0.09, 0.32, 16), []);
  const knob = useMemo(() => new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), []);
  const unit = useMemo(() => new THREE.BoxGeometry(W - 0.08, 1, D - 0.08), []);

  const water = colors.blue ?? '#8FC3E8';
  const water2 = colors.blueDark ?? '#5E9FD6';
  const spread = cues[0] ?? 0; // strati separati per contarli
  const filled = p2 * LAYERS;
  const current = Math.min(LAYERS - 1, Math.floor(filled));
  const flowing = p2 > 0 && p2 < 1;

  let y = -H / 2 + 0.04;
  const layers = FLOW.map((f, i) => {
    const k = clamp01(filled - i);
    const h = f * SCALE * k;
    const out = {i, y: y + h / 2 + i * spread * 0.022, h, k};
    y += f * SCALE;
    return out;
  });
  const surface = layers.reduce((a, l) => (l.k > 0 ? l.y + l.h / 2 : a), -H / 2 + 0.04);
  const nozzleY = H / 2 + 0.55;
  const streamR = 0.035 + 0.06 * FLOW[current];

  return (
    <>
      <OrbitCamera radius={7.2} angle={0.55 + Math.sin(t * 0.25) * 0.25} elevation={0.42} target={[0.1, 0.25, 0]} />
      <ChalkLights />
      {/* vetro */}
      <mesh geometry={glass}>
        <meshBasicMaterial color={colors.chalk} transparent opacity={0.05 * p} depthWrite={false} clippingPlanes={clip} />
      </mesh>
      <ChalkEdges geometry={glass} color={colors.chalk} width={4} clip={clip} />
      {/* rubinetto (tubi pieni + contorni) */}
      {[
        {g: pipeH, pos: [1.05, nozzleY + 0.16, 0] as [number, number, number], rot: [0, 0, Math.PI / 2] as [number, number, number]},
        {g: pipeV, pos: [0.6, nozzleY, 0] as [number, number, number], rot: [0, 0, 0] as [number, number, number]},
        {g: knob, pos: [1.2, nozzleY + 0.3, 0] as [number, number, number], rot: [0, 0, 0] as [number, number, number]},
      ].map(({g, pos, rot}, i) => (
        <group key={i} position={pos} rotation={rot}>
          <mesh geometry={g}>
            <meshLambertMaterial color={i === 2 ? colors.accent : '#cfd6d2'} clippingPlanes={clip} />
          </mesh>
          <ChalkEdges geometry={g} color={colors.chalk} width={2.5} clip={clip} threshold={40} />
        </group>
      ))}
      {/* getto d'acqua: spessore = portata attuale */}
      {flowing && (
        <mesh position={[0.6, (nozzleY - 0.16 + surface) / 2, 0]}>
          <cylinderGeometry args={[streamR, streamR * 1.1, nozzleY - 0.16 - surface, 16]} />
          <meshLambertMaterial color={water} transparent opacity={0.85} />
        </mesh>
      )}
      {/* strati d'acqua */}
      {layers.map(
        (l) =>
          l.k > 0 && (
            <group key={l.i}>
              <mesh geometry={unit} position={[0, l.y, 0]} scale={[1, Math.max(0.001, l.h - 0.012), 1]}>
                <meshLambertMaterial color={l.i % 2 ? water : water2} transparent opacity={0.72} depthWrite={false} />
              </mesh>
              <ChalkEdges geometry={unit} color={colors.chalk} width={1.6} opacity={0.55} position={[0, l.y, 0]} scale={[1, Math.max(0.001, l.h - 0.012), 1]} />
            </group>
          ),
      )}
    </>
  );
};

export default {fov: 32, component: Tank3D} satisfies ModelDef;
