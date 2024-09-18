uniform float uTime;
varying vec2 vUv;
varying vec3 vNoraml;
attribute float aRandom;

void main (){

  vec3 pos = position;

  pos += aRandom* normal;
  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vNoraml = normal;
  vUv = uv;
}
