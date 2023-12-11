import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "lil-gui";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

THREE.ColorManagement.enabled = false;

const canvas = document.querySelector(".webgl-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/* ------- Util Base ------- */
const gui = new GUI();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const controls = new OrbitControls(camera, canvas);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });

/* --------------------- */
/* --- Util Settings --- */
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// scene.background = new THREE.Color("#2d2d2d");
controls.enableDamping = true;

// camera.position.y = 1;
camera.position.z = 5;

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

const mat = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
});

const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);

scene.add(plane);

/* ----------------------- */
/* ------- Animate ------- */

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
