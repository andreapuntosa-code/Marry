import {useThree} from '@react-three/fiber';
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

/** Utilità per oggetti 3D in stile gesso: contorni bianchi spessi + riempimenti tenui. */

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Piano di taglio che mostra solo ciò che sta sotto `level` (effetto "disegnato dal basso"). */
export const useRevealPlane = (level: number) => {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  plane.constant = level;
  return plane;
};

/** Contorni (spigoli) di una geometria con linee spesse in pixel. */
export const ChalkEdges: React.FC<{
  geometry: THREE.BufferGeometry;
  color: string;
  width?: number;
  opacity?: number;
  threshold?: number;
  clip?: THREE.Plane[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}> = ({geometry, color, width = 3, opacity = 1, threshold = 25, clip, position, rotation, scale}) => {
  const size = useThree((s) => s.size);
  const geo = useMemo(() => new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geometry, threshold)), [geometry, threshold]);
  const mat = useMemo(() => new LineMaterial({linewidth: width, transparent: true}), [width]);
  mat.color.set(color);
  mat.opacity = opacity;
  mat.resolution.set(size.width, size.height);
  mat.clippingPlanes = clip ?? null;
  mat.visible = opacity > 0.01;
  const obj = useMemo(() => new LineSegments2(geo, mat), [geo, mat]);
  return <primitive object={obj} position={position} rotation={rotation} scale={scale} />;
};

/** Linea spezzata spessa (percorsi, frecce, profili). */
export const ChalkLine: React.FC<{points: [number, number, number][]; color: string; width?: number; opacity?: number; clip?: THREE.Plane[]}> = ({
  points,
  color,
  width = 3,
  opacity = 1,
  clip,
}) => {
  const size = useThree((s) => s.size);
  const geo = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < points.length - 1; i++) arr.push(...points[i], ...points[i + 1]);
    return new LineSegmentsGeometry().setPositions(arr);
  }, [points]);
  const mat = useMemo(() => new LineMaterial({linewidth: width, transparent: true}), [width]);
  mat.color.set(color);
  mat.opacity = opacity;
  mat.resolution.set(size.width, size.height);
  mat.clippingPlanes = clip ?? null;
  mat.visible = opacity > 0.01;
  const obj = useMemo(() => new LineSegments2(geo, mat), [geo, mat]);
  return <primitive object={obj} />;
};

/** Camera che gira lentamente attorno a un punto. angle/elevation in radianti. */
export const OrbitCamera: React.FC<{radius: number; angle: number; elevation: number; target?: [number, number, number]}> = ({
  radius,
  angle,
  elevation,
  target = [0, 0, 0],
}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(
      target[0] + radius * Math.cos(elevation) * Math.sin(angle),
      target[1] + radius * Math.sin(elevation),
      target[2] + radius * Math.cos(elevation) * Math.cos(angle),
    );
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Luci standard: ambiente morbido + una luce dall'alto. */
export const ChalkLights: React.FC = () => (
  <>
    <ambientLight intensity={1.6} />
    <directionalLight position={[3, 6, 4]} intensity={2.2} />
    <directionalLight position={[-4, 2, -3]} intensity={0.6} />
  </>
);
