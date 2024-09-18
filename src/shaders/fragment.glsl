// uniform float uTime;
varying vec3 vNoraml;

void main(){
  gl_FragColor = vec4(vNoraml.r, vNoraml.g, 1.,1.0);
}
