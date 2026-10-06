// Cheap vertex-lit material (Gouraud): hemisphere + sun computed per vertex, optional texture
// with alpha test, wind sway, fog, instancing. Used for vegetation and far terrain.
import * as THREE from 'three';
import { GROUND_UNIFORMS } from './ground_uniforms.js';

export const LIGHT = {
  uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2).normalize() },
  uSunCol: { value: new THREE.Color(1, 1, 1) },
  uSkyCol: { value: new THREE.Color(0.6, 0.7, 0.9) },
  uGndCol: { value: new THREE.Color(0.3, 0.25, 0.2) },
  uWind: { value: 0 },
};

export function vertexLit({ map = null, alphaTest = 0.0, wind = 0.0, grass = false, side = THREE.FrontSide, detail = null, wrap = 1.0 } = {}) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, uDetail: { value: null } }]);
  uniforms.map.value = map; uniforms.uDetail.value = detail;
  Object.assign(uniforms, LIGHT);
  if (detail) Object.assign(uniforms, GROUND_UNIFORMS);
  const defines = {};
  if (map) defines.USE_MAP_V = '';
  if (detail) defines.USE_DETAIL = '';
  if (alphaTest > 0) defines.ALPHA_T = alphaTest.toFixed(3);
  defines.WIND_AMP = wind.toFixed(4);
  defines.WRAP = wrap.toFixed(3);
  if (grass) defines.GRASS = '';
  const m = new THREE.ShaderMaterial({
    uniforms, defines, side, fog: true, vertexColors: true,
    vertexShader: `
      #include <common>
      #include <fog_pars_vertex>
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol; uniform float uWind;
      varying vec3 vCol; varying vec2 vUv; varying vec3 vWP; varying vec3 vLight;
      void main() {
        vec3 transformed = position;
        mat4 M = modelMatrix;
        #ifdef USE_INSTANCING
          M = modelMatrix * instanceMatrix;
          vec3 ip = instanceMatrix[3].xyz;
          float ph = ip.x * 0.13 + ip.z * 0.09 + position.x * 2.0;
          float hgt = max(position.y, 0.0);
          #ifdef GRASS
            transformed.x += sin(uWind * 2.2 + ph) * WIND_AMP * hgt * hgt * 4.0;
            transformed.z += cos(uWind * 1.7 + ph) * WIND_AMP * 0.6 * hgt * hgt * 4.0;
          #else
            transformed.x += (sin(uWind * 1.6 + ph) * 0.65 + sin(uWind * 3.7 + ph * 2.1) * 0.35) * WIND_AMP * hgt * hgt;
            transformed.z += cos(uWind * 1.3 + ph * 1.3) * WIND_AMP * 0.6 * hgt * hgt;
          #endif
        #endif
        vec4 wp = M * vec4(transformed, 1.0);
        vWP = wp.xyz;
        vec3 n = normalize(mat3(M) * normal);
        float sunL = max((dot(n, uSunDir) + WRAP - 1.0) / WRAP, 0.0);
        float hemi = n.y * 0.5 + 0.5;
        vec3 light = mix(uGndCol, uSkyCol, hemi) + uSunCol * sunL;
        vec3 c = vec3(1.0);
        #ifdef USE_COLOR
          c = color;
        #endif
        #ifdef USE_INSTANCING_COLOR
          c *= instanceColor;
        #endif
        vCol = c * light; vLight = light;
        vUv = uv;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <fog_pars_fragment>
      uniform sampler2D map; uniform sampler2D uDetail;
      #ifdef USE_DETAIL
      uniform sampler2D uGround; uniform float uGroundOn; uniform vec4 uGroundBounds;
      #endif
      varying vec3 vCol; varying vec2 vUv; varying vec3 vWP; varying vec3 vLight;
      void main() {
        vec3 col = vCol;
        #ifdef USE_MAP_V
          vec4 tex = texture2D(map, vUv);
          #ifdef ALPHA_T
            if (tex.a < ALPHA_T) discard;
          #endif
          col *= tex.rgb;
        #endif
        #ifdef USE_DETAIL
          if (uGroundOn > 0.5) {
            vec2 guv = (vWP.xz - uGroundBounds.xy) / uGroundBounds.zw;
            if (guv.x > 0.0 && guv.y > 0.0 && guv.x < 1.0 && guv.y < 1.0) { vec4 gm = texture2D(uGround, guv); col = mix(col, gm.rgb * vLight, gm.a); }
          }
          col *= mix(0.8, 1.18, texture2D(uDetail, vWP.xz * 0.05).r);
        #endif
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  return m;
}
