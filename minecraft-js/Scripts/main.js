import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; //Left to rotate, middle to zoom in/out, right to move

import { World } from './world';

//Renderer setup

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);

document.body.appendChild(renderer.domElement);


//Camera setup

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(-32,16,-32);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();


//Scene setup
const scene = new THREE.Scene();

const world = new World();
world.generate();
scene.add(world);

//Random Block
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function setupLights() {
    const light1 = new THREE.DirectionalLight();
    light1.position.set(1, 1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight();
    light2.position.set(-1, 1, -0.5);
    scene.add(light2);

    const light3 = new THREE.AmbientLight();
    light3.intensity = 0.2;
    scene.add(light3);
}



//Render loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.position.y = 1.5;
    renderer.render(scene, camera);

}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
})

setupLights();

animate();