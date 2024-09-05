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

let wallShape, wallBody, pikeShape, pikeBody, paredonShape, paredonBody, paredon2Shape, paredon2Body; 

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
    const groundGeometry = new THREE.PlaneGeometry(50, 300);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x020003 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);

    const groundShape = new Plane();
    const groundBody = new Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Crear geometría y material para la pared (meta) en Three.js
    const wallGeometry = new THREE.BoxGeometry(10, 5, 0.5); // Ajusta el tamaño según necesites
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Verde
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 2.5, -150); // Ajusta la posición según necesites
    scene.add(wall);

    // Crear la pared (meta) en Cannon.js
    wallShape = new Box(new Vec3(5, 2.5, 0.25)); // Ajusta el tamaño según necesites
    wallBody = new Body({
        position: new Vec3(0, 2.5, -155) // Ajusta la posición según necesites
    });
    wallBody.addShape(wallShape);
    world.addBody(wallBody);

    const paredonGeometry = new THREE.BoxGeometry(35, 5, 0.5); // Ajusta el tamaño según necesites
    const paredonMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 }); 
    const paredon = new THREE.Mesh(paredonGeometry, paredonMaterial);
    paredon.position.set(8, 2.5, -20); // Ajusta la posición según necesites
    scene.add(paredon);


    paredonShape = new Box(new Vec3(30, 2.5, 0.25)); // Ajusta el tamaño según necesites
    paredonBody = new Body({
        position: new Vec3(20, 2.5, -20) // Ajusta la posición según necesites
    });
    paredonBody.addShape(paredonShape);
    world.addBody(paredonBody);

    const paredon2Geometry = new THREE.BoxGeometry(35, 5, 0.5); // Ajusta el tamaño según necesites
    const paredon2Material = new THREE.MeshBasicMaterial({ color: 0xff6600 }); 
    const paredon2 = new THREE.Mesh(paredon2Geometry, paredon2Material);
    paredon2.position.set(-8, 2.5, -35); // Ajusta la posición según necesites
    scene.add(paredon2);


    paredon2Shape = new Box(new Vec3(30, 2.5, 0.25)); // Ajusta el tamaño según necesites
    paredon2Body = new Body({
        position: new Vec3(-20, 2.5, -35) // Ajusta la posición según necesites
    });
    paredon2Body.addShape(paredon2Shape);
    world.addBody(paredon2Body);

    const numberOfPikes = 120;  // Ajusta este valor para cambiar la cantidad de pinchos

    // Dimensiones de los pinchos
    const pikeWidth = 1;
    const pikeHeight = 1;
    const pikeDepth = 1;
    
    // Geometría y material del pincho (Three.js)
    const pikeGeometry = new THREE.BoxGeometry(pikeWidth, pikeHeight, pikeDepth);
    const pikeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Naranja
    
    const pikes = []; // Array para almacenar los pinchos
    const pikeBodies = []; // Array para los cuerpos de Cannon.js
    
    // Función para generar un número aleatorio dentro de un rango
    function getRandomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Generar pinchos aleatorios
    for (let i = 0; i < numberOfPikes; i++) {
        const randomX = getRandomInRange(-25, 25); // Genera una posición aleatoria en el eje X
        const randomZ = getRandomInRange(-100, -50); // Genera una posición aleatoria en el eje Z
    
        // Crear el pincho en Three.js
        const pike = new THREE.Mesh(pikeGeometry, pikeMaterial);
        pike.position.set(randomX, 0, randomZ); // Colocar el pincho sobre el suelo
        scene.add(pike);
        pikes.push(pike); // Guardar el pincho en el array para referencia
    
        // Crear el pincho en Cannon.js
        const pikeShape = new Box(new Vec3(pikeWidth / 2, pikeHeight / 2, pikeDepth / 2)); // Tamaño del pincho
        const pikeBody = new Body({
            mass: 0, // Los pinchos no deben moverse
            position: new Vec3(randomX, 0.5, randomZ) // Posición del cuerpo en el mundo físico
        });
        pikeBody.addShape(pikeShape);
        world.addBody(pikeBody);
        pikeBodies.push(pikeBody); // Guardar el cuerpo físico en el array
    }
    
    // Ajustar la cámara
    camera.position.z = 10;
    camera.position.y = 7;

    const spawnPosition = new THREE.Vector3(0, 5, 0); // Cambia esta posición según tu necesidad

    function resetToSpawn() {
        // Mueve el cubo a la posición de spawn
        cubeBody.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        cube.position.copy(cubeBody.position); // Sincroniza la posición del cubo en Three.js con el cuerpo físico en Cannon.js
    
        cubeBody.velocity.set(0, 0, 0); // Detiene el movimiento en todas las direcciones
        cubeBody.angularVelocity.set(0, 0, 0);
        resetTimer();
    }
    function muerte(){
        // Mueve el cubo a la posición de spawn
        cubeBody.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        cube.position.copy(cubeBody.position); // Sincroniza la posición del cubo en Three.js con el cuerpo físico en Cannon.js
    
        cubeBody.velocity.set(0, 0, 0); // Detiene el movimiento en todas las direcciones
        cubeBody.angularVelocity.set(0, 0, 0);
    }

let elapsedTime = 0;

    function updateTimer() {
        let currentTime = Date.now();
        elapsedTime = Math.floor((currentTime - startTime) / 1000); // Tiempo en segundos
        document.getElementById('timer').textContent = `Tiempo: ${elapsedTime} s`;
    }

    function resetTimer() {
        startTime = Date.now();
        hasWon = false; // Opcional: reinicia el estado de victoria si es necesario
    }

    function jump() {
        // Verifica si el cubo está en el suelo antes de permitir el salto
        if (cubeBody.position.y <= 1) {
            // Aplica una fuerza hacia arriba para el salto
            cubeBody.applyImpulse(new Vec3(0, 6, 0), cubeBody.position);
        }
    }

    function freno(){
        cubeBody.angularVelocity.set(0, 0, 0);
    }
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
            case ' ':
                jump(); // Llama a la función de salto cuando se presiona Espacio
                break;
            case 'f': // Regresa al spawn cuando se presiona F
                resetToSpawn();
                break;
            case 'r':
                freno();
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
        const otherPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xF8F520 }); // Color rojo
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

    let startTime = Date.now();
    let hasWon = false;
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

        // Verificar colisión con la pared
        if (wallBody) { // Asegúrate de que wallBody esté definido antes de usarlo
            const cubePosition = cubeBody.position;
            const wallPosition = wallBody.position;

            const distance = cubePosition.distanceTo(wallPosition);
            if (distance < 6) { // Ajusta el valor según el tamaño de la pared y la tolerancia
                if (!hasWon) {
                    hasWon = true;
                    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
                    showWinMessage(elapsedTime);
                }
            }
        }

        pikes.forEach((pike, index) => {
            const distance = cube.position.distanceTo(pike.position);
            if (distance < 1.5) { // Si la distancia es menor que el tamaño del pincho, significa colisión
                console.log("Has tocado un pincho!");
                muerte(); // Devuelve al jugador al punto de inicio
            }
        });
        updateTimer()


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
    // Función para mostrar el mensaje de victoria
    function showWinMessage(elapsedTime) {
        alert(`¡Ganaste! Tu tiempo es: ${elapsedTime} segundos`);
        resetToSpawn();
    }
}
