// Custom sky dome: artist-controlled gradient, sun disc + glow, baked fbm clouds with
// parallax projection, stars handled separately. Cheap enough for software rendering.
import * as THREE from 'three';
import { Simplex, clamp } from './noise.js';

let CLOUD_TEX = null;
export function cloudTexture() {
  if (CLOUD_TEX) return CLOUD_TEX;
  const S = 1024, n1 = new Simplex(31), n2 = new Simplex(77);
  const data = new Uint8Array(S * S * 4);
  // tileable fbm via 4D-ish trick: sample on a torus mapped from 2D
  const TAU = Math.PI * 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S * TAU, v = y / S * TAU;
    const cx = Math.cos(u), sx = Math.sin(u), cy = Math.cos(v), sy = Math.sin(v);
    let f = 0, a = 0.5, fr = 1.2;
    for (let o = 0; o < 6; o++) {
      f += a * n1.noise(cx * fr + sy * fr * 0.37 + o * 7.1, sx * fr + cy * fr * 0.61 + o * 3.3);
      a *= 0.5; fr *= 2.03;
    }
    const w = 0.5 + 0.5 * n2.noise(cx * 0.7 + 3.0, sy * 0.7 + 1.0);   // large-scale coverage variation
    const val = clamp(0.5 + f * 0.9);
    const i = (y * S + x) * 4;
    data[i] = Math.floor(val * 255); data[i + 1] = Math.floor(w * 255); data[i + 2] = 0; data[i + 3] = 255;
  }
  CLOUD_TEX = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  CLOUD_TEX.wrapS = CLOUD_TEX.wrapT = THREE.RepeatWrapping;
  CLOUD_TEX.magFilter = THREE.LinearFilter; CLOUD_TEX.minFilter = THREE.LinearMipmapLinearFilter;
  CLOUD_TEX.generateMipmaps = true; CLOUD_TEX.needsUpdate = true;
  return CLOUD_TEX;
}

export function makeSkyDome() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(0x2f6fd0) }, uHorizon: { value: new THREE.Color(0xbcd6ef) },
      uGround: { value: new THREE.Color(0x6b7a7f) }, uSunDir: { value: new THREE.Vector3(0, 0.5, 1).normalize() },
      uSunCol: { value: new THREE.Color(1, 0.95, 0.85) }, uSunSize: { value: 1.0 }, uGlow: { value: 1.0 },
      uClouds: { value: cloudTexture() }, uCover: { value: 0.45 }, uCloudCol: { value: new THREE.Color(1, 1, 1) },
      uCloudShade: { value: new THREE.Color(0.62, 0.68, 0.78) }, uTime: { value: 0 }, uCloudSpeed: { value: 0.004 },
      uCamXZ: { value: new THREE.Vector2() }, uDark: { value: 0.0 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunCol, uCloudCol, uCloudShade;
      uniform float uSunSize, uGlow, uCover, uTime, uCloudSpeed, uDark; uniform sampler2D uClouds; uniform vec2 uCamXZ;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        float e = clamp(h, 0.0, 1.0);
        vec3 col = mix(uHorizon, uZenith, pow(e, 0.42));
        col = mix(col, uGround, clamp(-h * 6.0, 0.0, 1.0));
        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunCol * (pow(sd, 8.0) * 0.28 + pow(sd, 64.0) * 0.5) * uGlow;          // sun halo (mie)
        col += uSunCol * smoothstep(0.99955 - 0.0004 * uSunSize, 0.99985, sd) * 14.0;   // sun disc
        // clouds on a plane, parallax
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.09) * 0.22 + uCamXZ * 0.00002 + vec2(uTime * uCloudSpeed, uTime * uCloudSpeed * 0.4);
          vec4 c1 = texture2D(uClouds, uv);
          vec4 c2 = texture2D(uClouds, uv * 2.7 + 0.31);
          float cov = uCover * (0.75 + 0.5 * c1.g);
          float dens = smoothstep(1.0 - cov, 1.0 - cov + 0.32, c1.r * 0.75 + c2.r * 0.25);
          float thick = smoothstep(1.0 - cov + 0.1, 1.0, c1.r);
          vec3 lit = mix(uCloudShade, uCloudCol, clamp(0.55 + 0.45 * (c2.r - 0.5) * 2.0 - thick * 0.35, 0.0, 1.0));
          lit += uSunCol * pow(sd, 6.0) * 0.6 * (1.0 - thick);
          float fade = smoothstep(0.0, 0.12, h);
          col = mix(col, lit, dens * fade * 0.96);
        }
        col *= (1.0 - uDark);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), mat);
  m.frustumCulled = false; m.renderOrder = -10;
  return m;
}
