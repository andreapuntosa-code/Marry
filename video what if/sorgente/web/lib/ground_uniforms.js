// Shared uniforms for the settlement ground overlay (no imports -> no cycles).
import * as THREE from 'three';
export const GM = { x0: -460, z0: -500, size: 1000 };
export const GROUND_UNIFORMS = {
  uGround: { value: null }, uGroundOn: { value: 0 },
  uGroundBounds: { value: new THREE.Vector4(GM.x0, GM.z0, GM.size, GM.size) },
};

// global snow cover (0..1), set per shot by the director
export const SNOW = { uSnow: { value: 0 }, uSnowCol: { value: new THREE.Color(0xeef4ff) } };
