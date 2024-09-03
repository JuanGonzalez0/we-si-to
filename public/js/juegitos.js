import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { World, Body, Box, Plane, Vec3 } from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const socket = io();


// Variables para el nombre del jugador
let playerName = '';
const nameInput = document.getElementById('nameInput');
const startGameButton = document.getElementById('startGameButton');
const playerLabel = document.getElementById('playerNameLabel');

startGameButton.addEventListener('click', () => {
    playerName = nameInput.value;

    if (playerName.trim() !== '') {
        // Ocultar el formulario
        document.getElementById('nameFormContainer').style.display = 'none';
        
        // Notificar al servidor del nombre del jugador
        socket.emit('playerName', playerName);

        // Iniciar el juego
        startGame();
    } else {
        alert('Please enter your name!');
    }
});

function startGame() {
    // Aquí empieza tu código Three.js y Cannon.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Fondo celeste

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // Crear geometría y material para el cubo (color azul)
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xF8F520 });
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

    // Crear el suelo
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x020003 });
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

    const otherPlayers = {};

    // Actualiza la lista de jugadores
    socket.on('updatePlayersList', (players) => {
        // Limpiar solo los jugadores, no el suelo
        Object.keys(otherPlayers).forEach(id => {
            if (id !== socket.id) {
                // Elimina el cubo y el sprite de la escena
                const playerData = otherPlayers[id];
                if (playerData) {
                    scene.remove(playerData.cube);
                    scene.remove(playerData.nameSprite);
                    delete otherPlayers[id];
                }
            }
        });
    
        // Añadir jugadores nuevos
        Object.keys(players).forEach((id) => {
            if (id !== socket.id && !otherPlayers[id]) { // No añadirnos a nosotros mismos y evitar duplicados
                addOtherPlayer(players[id]);
            }
        });
    });
    
    // Cuando un nuevo jugador se conecta
    socket.on('playerConnected', (player) => {
        if (!otherPlayers[player.id]) { // Evita añadir jugadores duplicados
            addOtherPlayer(player);
        }
    });
    
    // Añade un nuevo jugador a la escena
    function addOtherPlayer(player) {
        // Crear el cubo del jugador
        const otherPlayerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const otherPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Color rojo
        const otherPlayerCube = new THREE.Mesh(otherPlayerGeometry, otherPlayerMaterial);
        scene.add(otherPlayerCube);
        otherPlayerCube.position.set(player.x, player.y, player.z);
    
        // Crear el sprite para el nombre del jugador
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.fillText(player.username, 0, 24); // Ajusta la posición del texto si es necesario
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(player.x, player.y + 1.5, player.z); // Posiciona el nombre ligeramente encima del cubo
        sprite.scale.set(8, 4, 6); // Escala del texto
        scene.add(sprite);
    
        // Almacena el cubo y el sprite en `otherPlayers`
        otherPlayers[player.id] = {
            cube: otherPlayerCube,
            nameSprite: sprite
        };
    }
    
    // Opcional: Actualiza el nombre del jugador
    socket.on('playerNameUpdated', (player) => {
        const playerData = otherPlayers[player.id];
        if (playerData) {
            const { nameSprite } = playerData;
            if (nameSprite) {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = '24px Arial';
                context.fillStyle = 'white';
                context.fillText(player.username, 0, 24); // Ajusta la posición del texto si es necesario
                const texture = new THREE.CanvasTexture(canvas);
                nameSprite.material.map = texture;
                nameSprite.material.needsUpdate = true;
            }
        }
    });
    
    // Actualiza la posición del jugador
    socket.on('playerMoved', (player) => {
        const playerData = otherPlayers[player.id];
        if (playerData) {
            const { cube, nameSprite } = playerData;
            if (cube) {
                cube.position.set(player.x, player.y, player.z);
            }
            if (nameSprite) {
                nameSprite.position.set(player.x, player.y + 1.5, player.z);
            }
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
            const euler = new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w)
            );
            cube.rotation.set(euler.x, euler.y, euler.z);
        } else {
            console.error('cubeBody.quaternion is undefined');
        }

    // Actualizar la posición del texto del nombre del jugador
    const playerLabel = document.getElementById('playerNameLabel');
    const vector = new THREE.Vector3(cube.position.x, cube.position.y + 1.5, cube.position.z); // Posiciona el texto ligeramente encima del cubo
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;

    playerLabel.style.left = `${x}px`;
    playerLabel.style.top = `${y}px`;
    playerLabel.textContent = playerName;

    socket.emit('playerMovement', {
      x: cube.position.x,
      y: cube.position.y,
      z: cube.position.z
  });

        // Hacer que la cámara siga al cubo
        camera.position.x = cube.position.x;
        camera.position.z = cube.position.z + 10;
        camera.lookAt(cube.position);

        renderer.render(scene, camera);
    }

    // Aquí puedes usar playerName para mostrar el nombre del jugador en la pantalla, registrar datos, etc.
    console.log("Player Name:", playerName);
}
