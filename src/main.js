import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "lil-gui";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
class App {
  constructor() {
    THREE.ColorManagement.enabled = false;

    const canvas = document.querySelector(".webgl-canvas");
    this._canvas = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas });

    // Renderer settings
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene = scene;

    const clock = new THREE.Clock();
    this._clock = clock;

    this._setCamera();
    this._setLight();
    this._setModel();
    this._setControls();
    this._setGUI();

    window.onresize = this.resize.bind(this);
    this.resize();

    requestAnimationFrame(this.render.bind(this));
  }

  _setCamera() {
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.z = 5;
    this._camera = camera;
  }

  _setLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this._scene.add(ambientLight);
  }

  _setModel() {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);

    this._scene.add(plane);
  }

  _setControls() {
    const controls = new OrbitControls(this._camera, this._canvas);
    controls.enableDamping = true;
    this._controls = controls;
  }

  _setGUI() {
    const gui = new GUI();
  }

  render() {
    const elapsedTime = this._clock.getElapsedTime();
    // material.uniforms.uTime.valaue = elapsedTime;

    // Update controls
    this._controls.update();

    // Render
    this._renderer.render(this._scene, this._camera);
    requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    this._camera.aspect = sizes.width / sizes.height;
    this._camera.updateProjectionMatrix();

    // Update renderer
    this._renderer.setSize(sizes.width, sizes.height);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

window.onload = function () {
  new App();
};
