import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { World, Body, Box, Plane, Sphere, Vec3, PointToPointConstraint, Material } from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// Configuración de Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Fondo celeste

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Crear geometría y material para el cubo (color azul)
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xF8F520 }); // Azul
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);



// Configuración de Cannon.js
const world = new World();
world.gravity.set(0, -9.82, 0); // gravedad

// Crear un cuerpo físico para el cubo
const cubeBody = new Body({
  mass: 1, // masa del cubo
  position: new Vec3(0, 5, 0) // Posición inicial del cubo por encima del suelo
});
cubeBody.addShape(new Box(new Vec3(0.5, 0.5, 0.5))); // Forma del cubo
world.addBody(cubeBody);

// Crear un plano en Cannon.js (plataforma)

const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

const groundShape = new Plane();
const groundBody = new Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Ajustar la cámara
camera.position.z = 10;
camera.position.y = 7;

// Controlar el movimiento del cubo con WASD
const moveSpeed = 5; // Velocidad de movimiento

document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      cubeBody.velocity.z = -moveSpeed;
      break;
    case 's':
      cubeBody.velocity.z = moveSpeed;
      break;
    case 'a':
      cubeBody.velocity.x = -moveSpeed;
      break;
    case 'd':
      cubeBody.velocity.x = moveSpeed;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
    case 's':
      cubeBody.velocity.z = 0;
      break;
    case 'a':
    case 'd':
      cubeBody.velocity.x = 0;
      break;
  }
});

// Función de animación
function animate() {
  // Actualizar el mundo de físicas
  world.step(1 / 60);

  // Sincronizar la posición del cubo en Three.js con el cuerpo físico en Cannon.js
  if (cubeBody.position) {
    cube.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);
  } else {
    console.error('cubeBody.position is undefined');
  }

  // Sincronizar la rotación del cubo en Three.js con el cuerpo físico en Cannon.js
  if (cubeBody.quaternion) {
    // Convertir quaternion a ángulos de Euler
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w)
    );
    cube.rotation.set(euler.x, euler.y, euler.z);
  } else {
    console.error('cubeBody.quaternion is undefined');
  }

  // Hacer que la cámara siga al cubo
  camera.position.x = cube.position.x;
  camera.position.z = cube.position.z + 10;
  camera.lookAt(cube.position);

  renderer.render(scene, camera);
}