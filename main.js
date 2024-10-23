import * as THREE from "three";
import { getBody, getMouseBall } from "./imports/getBodies.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import WebGL from "three/addons/capabilities/WebGL.js";

if (WebGL.isWebGL2Available()) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  camera.position.z = 5;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  document.body.appendChild(renderer.domElement);

  let mousePos = new THREE.Vector2();
  await RAPIER.init();
  const gravity = { x: 0.0, y: 0.0, z: 0.0 };
  const world = new RAPIER.World(gravity);

  // post-processing
  const renderScene = new RenderPass(scene, camera);
  // resolution, strength, radius, threshold
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    2.0,
    1.0,
    0.005
  );
  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  const numBodies = 210;
  const bodies = [];
  for (let i = 0; i < numBodies; i++) {
    const body = getBody(RAPIER, world, i);
    bodies.push(body);
    scene.add(body.mesh);
  }

  const mouseBall = getMouseBall(RAPIER, world);
  scene.add(mouseBall.mesh);

  const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff, 0.35);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.35);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffaa00, 0.35, 50);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);

  const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.35);
  scene.add(pointLightHelper);

  function animate() {
    requestAnimationFrame(animate);
    world.step();
    mouseBall.update(mousePos);
    bodies.forEach((b) => b.update());
    composer.render(scene, camera);
  }

  animate();

  function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", handleWindowResize, false);

  function handleMouseMove(evt) {
    mousePos.x = (evt.clientX / window.innerWidth) * 2.4 - 1.2;
    mousePos.y = -(evt.clientY / window.innerHeight) * 2.4 + 1.2;
  }
  window.addEventListener("mousemove", handleMouseMove, false);
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById("container").appendChild(warning);
}
