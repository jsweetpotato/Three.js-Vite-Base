import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "lil-gui";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { extendMaterial } from "./ExtendMaterial";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

THREE.ColorManagement.enabled = false;

const canvas = document.querySelector(".webgl-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

/* ------- Util Base ------- */
const gui = new GUI();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const controls = new OrbitControls(camera, canvas);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

/* --------------------- */
/* --- Util Settings --- */
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// scene.background = new THREE.Color("#fff0c4");
controls.enableDamping = true;

// camera.position.y = 1;
camera.position.z = 12;

/* ------------------------ */
/* -------- Events -------- */

const handleResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

window.addEventListener("resize", handleResize);

/* ----------------------- */
/* ------- Objects ------- */

const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0xffffff
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.position.set(0, -3, 0);
plane.receiveShadow = true;
plane.castShadow = false;

let sphereMat = new THREE.MeshBasicMaterial({
  color: 0xff0000
});

let sphereGeo = new THREE.IcosahedronGeometry(1, 12);

// 인덱스 오브젝트
// .toNonIndexed() -> 인덱스 오브젝트를 non인덱스 오브젝트로 변환
// sphereGeo = new THREE.SphereGeometry(1, 32, 32).toNonIndexed();
// sphereGeo = new THREE.SphereGeometry(1, 16, 16);

const setGeometryAttributes = (geo) => {
  const len = geo.attributes.position.count;

  const randoms = new Float32Array(len);
  const centers = new Float32Array(len * 3); // 5952 * 3 = 17856

  for (let i = 0; i < len; i += 3) {
    const randomNum = Math.random();
    randoms[i] = randoms[i + 1] = randoms[i + 2] = randomNum;

    // 각 삼각형의 중심 구하기
    const i3 = i * 3;

    // 삼각형 첫번째 vetex 좌표
    const x = geo.attributes.position.array[i3];
    const y = geo.attributes.position.array[i3 + 1];
    const z = geo.attributes.position.array[i3 + 2];

    // 삼각형 두번째 vetex 좌표
    const x1 = geo.attributes.position.array[i3 + 3];
    const y1 = geo.attributes.position.array[i3 + 4];
    const z1 = geo.attributes.position.array[i3 + 5];

    // 삼각형 세번째 vetex 좌표
    const x2 = geo.attributes.position.array[i3 + 6];
    const y2 = geo.attributes.position.array[i3 + 7];
    const z2 = geo.attributes.position.array[i3 + 8];

    // 각 삼각형 좌표를 더해 중심 좌표를 구함
    const center = new THREE.Vector3(x, y, z).add(new THREE.Vector3(x1, y1, z1)).add(new THREE.Vector3(x2, y2, z2)).divideScalar(3);

    // 구한 중점 좌표를 삼각형의 vertex 좌표에 넣기
    centers.set([center.x, center.y, center.z], i3); // 첫번째
    centers.set([center.x, center.y, center.z], (i + 1) * 3); // 두번째
    centers.set([center.x, center.y, center.z], (i + 2) * 3); // 세번째
  }

  geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  geo.setAttribute("aCenter", new THREE.BufferAttribute(centers, 3));
};

// setGeometryAttributes(sphereGeo);

sphereMat = extendMaterial(THREE.MeshStandardMaterial, {
  class: THREE.CustomMaterial, // In this case ShaderMaterial would be fine too, just for some features such as envMap this is required

  vertexHeader: `
    attribute float aRandom; 
    attribute vec3 aCenter; 
    uniform float time;
    uniform float progress;
    uniform float factor1;
    uniform float factor2;
    varying vec3 vPos;
    varying float vLocprog;

    mat2 get2dRotateMatrix(float _angle)
    {
      return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
    }

    mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }
  
  vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
  }

  `,
  vertex: {
    transformEnd: `
    vec4 modelPosition = modelMatrix * vec4(position, 1.);
    // position y축 0. ~ 1.
    // 이걸 안하면 처음부터 반정도 부숴진 채 나온다. (y값 범위가 -1 ~ 1까지기 때문에)

    float prog = modelPosition.y/ 3.4 + 2. -1.;

    // y값(prog = 0. ~ 1.)에 따라 0미만 1초과 값은 0과 1로 표현

    // 100. ~ 
    float locprog = clamp((progress * factor1 - prog)/factor2 ,0.,1.); 
    
    mat2 rotateMatrix = get2dRotateMatrix(aRandom * locprog * PI);
    
    transformed = transformed - aCenter;
    
    transformed += 2.* normal* aRandom * locprog ;
    transformed *= (1. -locprog);
    transformed += aCenter;
    transformed.xz = rotateMatrix * transformed.xz; 

    // yuri가 사용한 회전 식
    // transformed = rotate(transformed, vec3(0., 1., 0.), aRandom * locprog * 3.14 );

    vPos = modelPosition.xyz;
    vLocprog = locprog;
    `
  },
  fragmentHeader: `
  uniform vec3 mixcolor;
    varying vec3 vPos;    
    varying float vLocprog;`,
  fragment: {
    colorEnd: `
  float pos = (vPos.y+2.84)/5.78; 
  pos = smoothstep( 0.01, 1., pos);
  // pos = vLocprog;
  vec3 clr = gl_FragColor.rgb;
   gl_FragColor = vec4(mix(clr, mixcolor, vLocprog), 1.);

  `
  },
  uniforms: {
    roughness: 0.35,
    factor1: {
      mixed: true,
      linked: true,
      value: 2.898
    },
    factor2: {
      mixed: true,
      linked: true,
      value: 0
    },
    mixcolor: {
      mixed: true,
      linked: true,
      value: new THREE.Color("#ffffff")
    },
    time: {
      mixed: true, // Uniform will be passed to a derivative material (MeshDepthMaterial below)
      linked: true, // Similar as shared, but only for derivative materials, so wavingMaterial will have it's own, but share with it's shadow material
      value: 0
    },
    progress: {
      mixed: true, // Uniform will be passed to a derivative material (MeshDepthMaterial below)
      linked: true, // Similar as shared, but only for derivative materials, so wavingMaterial will have it's own, but share with it's shadow material
      value: 0
    }
  }
});

sphereMat.uniforms.diffuse.value = new THREE.Color(0xadadff);

const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.customDepthMaterial = extendMaterial(THREE.MeshDepthMaterial, {
  template: sphereMat
});

sphere.castShadow = true;

const loader = new GLTFLoader();
let model;
loader.load("assets/figure-of-a-dancer.gltf", (gltf) => {
  const gltfModel = gltf.scene.getObjectByName("mesh_0");
  const scale = 0.0135;

  gltfModel.scale.set(scale, scale, scale);
  gltfModel.geometry = gltfModel.geometry.toNonIndexed();
  setGeometryAttributes(gltfModel.geometry);
  gltfModel.material = sphereMat;

  gltfModel.castShadow = true;

  gltfModel.customDepthMaterial = extendMaterial(THREE.MeshDepthMaterial, {
    template: sphereMat
  });

  scene.add(gltfModel);
});

scene.add(plane);

/* ----------------------- */
/* --------- GUI --------- */

gui.add(sphereMat.uniforms.progress, "value", 0, 1, 0.001).name("progress");
gui.add(sphereMat.uniforms.factor2, "value", 0, 0.9, 0.001).name("factor");
gui.addColor(sphereMat.uniforms.diffuse, "value");
gui.addColor(sphereMat.uniforms.mixcolor, "value").name("mixcolor");

/* ----------------------- */
/* ------- Lights ------- */

const ambient = new THREE.AmbientLight(0xffffff, 0.9);

const light = new THREE.SpotLight(0xffffff, 40, 0, Math.PI / 5, 0.1);
light.position.set(0, 4, 4);
light.target.position.set(0, 0, 0);

const lightHelper = new THREE.SpotLightHelper(light, 0xff00ff);
light.castShadow = true;
light.shadow.camera.near = 1;
light.shadow.camera.far = 20;
light.shadow.bias = 0.0001;

light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light, ambient);

/* ----------------------- */
/* ------- Animate ------- */

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  sphereMat.uniforms.time.value += 0.01;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
