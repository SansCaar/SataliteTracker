import {
  Scene,
  PerspectiveCamera,
  Mesh,
  WebGLRenderer,
  AmbientLight,
  TextureLoader,
  SphereBufferGeometry,
  MeshPhongMaterial,
  PointLight,
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  BackSide,
  Vector3,
  Line,
  Geometry,
  Line3,
  TubeGeometry,
  BufferGeometry,
} from "three";
import OrbitControls from "three-orbitcontrols";
import { getGPUTier } from "detect-gpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { callApi } from "./api";

const gpu = getGPUTier();
console.log(gpu);

let camera;
let renderer;
let scene;

let controls;

const canvas = document.querySelector("#scene-container");
const convertLatLngToCartesian = (lat, lng) => {
  let phi = (90 - lat) * (Math.PI / 180);
  let theta = (180 + lng) * (Math.PI / 180);

  let x = -(Math.sin(phi) * Math.cos(theta));
  let z = Math.sin(phi) * Math.sin(theta);
  let y = Math.cos(phi);
  return { x, y, z };
};
//scene
scene = new Scene();
//camera
camera = new PerspectiveCamera(
  15,
  window.innerWidth / window.innerHeight,
  0.001,
  1000
);
camera.position.set(-2, 4, 20);
scene.add(camera);

//lights
const mainLight = new AmbientLight(0xffffff, 0.3);

const pointLight = new PointLight(0xffffff, 2);
pointLight.position.set(10, 6, 10);
scene.add(mainLight, pointLight);

// meshes
const earthMesh = new Mesh(
  new SphereBufferGeometry(1, 30, 30),
  new MeshPhongMaterial({
    roughness: 1,
    metalness: 0,
    map: new TextureLoader().load(require("./textures/earth4k.jpg")),
    bumpMap: new TextureLoader().load(require("./textures/earthbump.jpg")),
    bumpScale: 0.1,
  })
);
scene.add(earthMesh);

//star
const starGeometry = new SphereGeometry(10, 64, 64);
const starMaterial = new MeshBasicMaterial({
  map: new TextureLoader().load(require("./textures/galaxy.png")),
  side: BackSide,
});
const starMesh = new Mesh(starGeometry, starMaterial);
scene.add(starMesh);

//ISS
let iss = new Group();

let loader = new GLTFLoader();
loader.load(require("./textures/models/ISS_stationary.glb"), (gltf) => {
  gltf.scene.scale.set(0.007, 0.007, 0.007);
  iss.add(gltf.scene);
  iss.rotateY(-2);
  iss.rotateZ(-3);

  // iss.position.set(1.5, 1.5, 1.5);
  scene.add(iss);
});

const getSateliteData = async () => {
  let setDetails = document.querySelector("#details");
  let f = 1.5;
  let resp = await callApi();
  console.log(resp);
  if (resp.latitude) {
    setDetails.innerHTML = `Altitude: ${resp.altitude}, Latitude: ${resp.latitude}, Longitude: ${resp.longitude}`;
    let issPos = convertLatLngToCartesian(resp.latitude, resp.longitude);
    console.log(resp);
    console.log(issPos);
    if (issPos.x) {
      iss.position.set(issPos.x + f, issPos.y + f, issPos.z + f);
      iss.updateMatrix();
      scene.add(iss);
    }
  }
};
getSateliteData();

setInterval(() => {
  getSateliteData();
}, 10 * 1000);
// // controls;
controls = new OrbitControls(camera, canvas);

//renderer
renderer = new WebGLRenderer({
  antialias: true,
});

renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;
renderer.setClearColor(0x000000, 0.0);
canvas.appendChild(renderer.domElement);

const render = () => {
  renderer.render(scene, camera);
};
const animate = () => {
  requestAnimationFrame(animate);
  // earthMesh.rotation.y -= 0.0015;
  //   iss.rotation.y -=0.005
  controls.update();
  // cloudMesh.rotation.y -= 0.0003;
  // cloudMesh.rotation.x -= 0.0003;

  render();
};
animate();

function onWindowResize() {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  // Update camera frustum
  camera.updateProjectionMatrix();

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}
window.addEventListener("resize", onWindowResize, false);
